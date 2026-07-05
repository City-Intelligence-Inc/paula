"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { BookUser, Send, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// C-2/C-4: the Contacts database. Every lead (inquiry form) and customer
// (manual add, completed registration) in one list, with the original
// inquiry and every staff response logged on the profile. From here an
// admin approves a lead → "Send invitation" fires the tokenized C-1 flow.

interface LogEntry {
  at: string;
  by: string;
  kind: "inquiry" | "response" | "note" | "system";
  text: string;
}

interface Contact {
  id: string;
  email: string;
  name: string;
  phone?: string;
  source: "inquiry" | "manual" | "registration";
  familyId?: string;
  studentInfo?: string;
  log: LogEntry[];
  mailingListSyncedAt?: string;
  mailingListError?: string;
  createdAt: string;
  updatedAt: string;
}

const SOURCE_LABEL: Record<Contact["source"], string> = {
  inquiry: "Inquiry",
  manual: "Manual",
  registration: "Registered",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContactsPage() {
  const fetchApi = useApi();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Manual add
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");

  const load = useCallback(() => {
    fetchApi("/api/admin/contacts")
      .then((r) => r.json())
      .then((j) => {
        setContacts(j.contacts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);
  useEffect(load, [load]);

  const filtered = contacts.filter((c) => {
    const needle = q.toLowerCase().trim();
    if (!needle) return true;
    return (
      c.name.toLowerCase().includes(needle) ||
      c.email.toLowerCase().includes(needle) ||
      (c.studentInfo || "").toLowerCase().includes(needle)
    );
  });

  const open = contacts.find((c) => c.id === openId) || null;

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetchApi("/api/admin/contacts", {
        method: "POST",
        body: JSON.stringify({
          action: "add",
          email: addEmail,
          name: addName,
          phone: addPhone,
        }),
      });
      if (res.ok) {
        setAddOpen(false);
        setAddName("");
        setAddEmail("");
        setAddPhone("");
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  const respond = async () => {
    if (!open || !reply.trim()) return;
    setBusy(true);
    try {
      const res = await fetchApi("/api/admin/contacts", {
        method: "POST",
        body: JSON.stringify({ action: "respond", email: open.email, text: reply }),
      });
      if (res.ok) {
        setReply("");
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  // C-1: admin approval → tokenized invitation, carrying the lead's details.
  const sendInvitation = async (c: Contact) => {
    if (
      !window.confirm(
        `Approve ${c.name} and email an invitation to ${c.email}? The link is single-use and expires in 7 days.`,
      )
    )
      return;
    setBusy(true);
    setMsg(null);
    try {
      const [firstName, ...rest] = c.name.split(" ");
      const res = await fetchApi("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({
          email: c.email,
          role: "parent",
          firstName,
          lastName: rest.join(" "),
          prefill: {
            ...(c.phone ? { phone: c.phone } : {}),
            ...(c.studentInfo ? { studentInfo: c.studentInfo } : {}),
          },
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error || "Invitation failed");
      } else if (j.emailError) {
        setMsg(`Invite created but email failed (${j.emailError}) — copy the link from Users → Pending invitations.`);
      } else {
        setMsg(`Invitation sent to ${c.email}.`);
        await fetchApi("/api/admin/contacts", {
          method: "POST",
          body: JSON.stringify({
            action: "respond",
            email: c.email,
            text: "Approved — portal invitation sent.",
          }),
        });
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <BookUser className="h-6 w-6 text-mathitude-purple" />
            Contacts
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Every lead and customer. Inquiries land here automatically and sync
            to the Resend mailing list; approve a lead to send their portal
            invitation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search contacts…"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm w-56"
          />
          <Button onClick={() => setAddOpen(!addOpen)} variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Add contact
          </Button>
        </div>
      </div>

      {addOpen && (
        <Card className="p-4">
          <form onSubmit={addContact} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Name</label>
              <input
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Email</label>
              <input
                required
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Phone</label>
              <input
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" disabled={busy}>
              Save contact
            </Button>
          </form>
        </Card>
      )}

      {msg && <p className="text-sm text-neutral-600">{msg}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500">
          No contacts yet. Inquiry-form submissions appear here automatically.
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="divide-y divide-neutral-100">
            {filtered.map((c) => (
              <div key={c.id}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                  onClick={() => setOpenId(openId === c.id ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-neutral-900">
                      {c.name}
                    </span>
                    <span className="text-xs text-neutral-400 ml-2">
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </span>
                  </div>
                  <Badge className="bg-neutral-100 text-neutral-600 border-neutral-200">
                    {SOURCE_LABEL[c.source]}
                  </Badge>
                  {c.mailingListSyncedAt ? (
                    <span className="text-xs text-emerald-700">Mailing list ✓</span>
                  ) : c.mailingListError ? (
                    <span className="text-xs text-amber-600" title={c.mailingListError}>
                      Mailing list ⚠
                    </span>
                  ) : null}
                  <span className="text-xs text-neutral-400">{fmt(c.updatedAt)}</span>
                </button>

                {openId === c.id && (
                  <div className="px-4 pb-4 bg-neutral-50/60 border-t border-neutral-100">
                    {c.studentInfo && (
                      <p className="text-xs text-neutral-600 pt-3">
                        <span className="font-medium">Students:</span> {c.studentInfo}
                      </p>
                    )}
                    <div className="mt-3 space-y-2">
                      {c.log.length === 0 && (
                        <p className="text-xs text-neutral-400">No activity yet.</p>
                      )}
                      {c.log.map((entry, i) => (
                        <div
                          key={i}
                          className={`rounded-md px-3 py-2 text-xs ${
                            entry.kind === "inquiry"
                              ? "bg-mathitude-purple/5 border border-mathitude-purple/15"
                              : "bg-white border border-neutral-200"
                          }`}
                        >
                          <p className="text-neutral-400 mb-1">
                            {entry.kind === "inquiry" ? "Inquiry" : entry.by} ·{" "}
                            {fmt(entry.at)}
                          </p>
                          <p className="text-neutral-700 whitespace-pre-wrap">
                            {entry.text}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-start gap-2">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Log a response (call summary, email sent, …)"
                        rows={2}
                        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={respond} disabled={busy || !reply.trim()}>
                          Log response
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendInvitation(c)}
                          disabled={busy}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Send invitation
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
