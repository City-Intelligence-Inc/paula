"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { client } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, CreditCard, Plus, UserCheck } from "lucide-react";
import { PaymentMethodsPanel } from "@/components/stripe/payment-methods-panel";
import { SaveCardForm } from "@/components/stripe/save-card-form";
import type { Family, Parent, Student } from "@/lib/types";

export default function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const fetchApi = useApi();
  const [family, setFamily] = useState<Family | null>(null);
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tutorsById, setTutorsById] = useState<
    Record<string, { firstName: string; lastName: string }>
  >({});
  const [savingPayer, setSavingPayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client(fetchApi)
      .families.get(id)
      .then((data) => {
        if (cancelled) return;
        setFamily(data.family);
        setParents(data.parents || []);
        setStudents(data.students || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    fetchApi("/api/admin/tutors")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const map: Record<string, { firstName: string; lastName: string }> = {};
        for (const t of j.tutors || []) {
          map[t.id] = { firstName: t.firstName, lastName: t.lastName };
        }
        setTutorsById(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fetchApi, id]);

  async function setPrimaryPayer(parentId: string) {
    if (!family || family.primaryPayerId === parentId) return;
    setSavingPayer(parentId);
    try {
      const res = await fetchApi(`/api/families/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryPayerId: parentId }),
      });
      if (res.ok) {
        const json = await res.json();
        setFamily(json.family);
      }
    } finally {
      setSavingPayer(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
      </div>
    );
  }

  if (error || !family) {
    return (
      <Card className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load family: {error || "not found"}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/families"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3 w-3" /> Families
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mt-2">
          {family.id}
        </h1>
        {family.address && (
          <p className="text-sm text-neutral-500 mt-1">
            {family.address.street}, {family.address.city},{" "}
            {family.address.state} {family.address.zip}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900">Parents</h2>
          <AddParentForm
            familyId={family.id}
            onAdded={(p) => setParents((prev) => [...prev, p])}
          />
        </div>
        {parents.length === 0 ? (
          <p className="text-sm text-neutral-400">No parents linked yet.</p>
        ) : (
          <div className="space-y-2">
            {parents.map((parent) => (
              <Card
                key={parent.id}
                className="py-0 border border-neutral-200 rounded-lg"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 truncate">
                        {parent.firstName} {parent.lastName}
                      </p>
                      {family.primaryPayerId === parent.id && (
                        <Badge className="bg-neutral-900/5 text-neutral-900 border-neutral-200">
                          Primary payer
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {parent.email}
                      </span>
                      {parent.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {parent.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-neutral-400">
                      {parent.stripeCustomerId ? "Stripe ✓" : "no Stripe"}
                    </span>
                    {family.primaryPayerId !== parent.id && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={savingPayer === parent.id}
                        onClick={() => setPrimaryPayer(parent.id)}
                        className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md text-xs whitespace-nowrap"
                      >
                        {savingPayer === parent.id
                          ? "Saving…"
                          : "Make primary payer"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {parents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-mathitude-purple" />
            Payment methods
          </h2>
          {parents.map((p) => (
            <ParentPaymentBlock key={p.id} parent={p} />
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900">Students</h2>
          <AddSiblingForm
            familyId={family.id}
            onAdded={(s) => setStudents((prev) => [...prev, s])}
          />
        </div>
        {students.length === 0 ? (
          <p className="text-sm text-neutral-400">No students linked yet.</p>
        ) : (
          <div className="space-y-2">
            {students.map((student) => {
              const assignedTutors = (student.tutorIds || [])
                .map((tid) => tutorsById[tid])
                .filter(Boolean) as { firstName: string; lastName: string }[];
              return (
                <Card
                  key={student.id}
                  className="py-0 border border-neutral-200 rounded-lg"
                >
                  <Link
                    href={`/admin/students/${student.id}`}
                    className="flex items-start gap-4 p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Grade {student.grade}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <UserCheck className="h-3 w-3 text-[#7030A0]" />
                        {assignedTutors.length === 0 ? (
                          <span className="text-xs text-neutral-400">
                            No tutor assigned
                          </span>
                        ) : (
                          assignedTutors.map((t, i) => (
                            <span
                              key={i}
                              className="text-xs text-[#7030A0] bg-[#7030A0]/5 border border-[#7030A0]/10 rounded-full px-2 py-0.5"
                            >
                              {t.firstName} {t.lastName}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <Badge
                      className={
                        student.status === "active"
                          ? "bg-neutral-900/5 text-neutral-900 border-neutral-200"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200"
                      }
                    >
                      {student.status}
                    </Badge>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AddParentForm({
  familyId,
  onAdded,
}: {
  familyId: string;
  onAdded: (p: Parent) => void;
}) {
  const fetchApi = useApi();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetchApi(`/api/families/${familyId}/parents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (r.ok && j.parent) {
        onAdded(j.parent);
        setForm({ firstName: "", lastName: "", email: "", phone: "" });
        setOpen(false);
      } else {
        alert(j.error || "Add failed");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add parent
      </Button>
    );
  }

  return (
    <Card className="border border-neutral-200 rounded-lg overflow-hidden w-full mt-2">
      <form onSubmit={submit} className="p-4 space-y-3">
        <p className="text-xs text-neutral-500">
          Add a second parent (e.g. the other parent paying). They&apos;ll get
          their own Stripe customer once a card is saved.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            placeholder="First name"
            value={form.firstName}
            onChange={(e) =>
              setForm((p) => ({ ...p, firstName: e.target.value }))
            }
            className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) =>
              setForm((p) => ({ ...p, lastName: e.target.value }))
            }
            className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md text-xs"
          >
            {saving ? "Saving…" : "Add Parent"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md text-xs"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AddSiblingForm({
  familyId,
  onAdded,
}: {
  familyId: string;
  onAdded: (s: Student) => void;
}) {
  const fetchApi = useApi();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    grade: "",
    rate: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetchApi(`/api/families/${familyId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rate: parseFloat(form.rate) || 0,
        }),
      });
      const j = await r.json();
      if (r.ok && j.student) {
        onAdded(j.student);
        setForm({ firstName: "", lastName: "", grade: "", rate: "" });
        setOpen(false);
      } else {
        alert(j.error || "Add failed");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add sibling
      </Button>
    );
  }

  return (
    <Card className="border border-neutral-200 rounded-lg overflow-hidden w-full mt-2">
      <form onSubmit={submit} className="p-4 space-y-3">
        <p className="text-xs text-neutral-500">
          Add another student under this family. Billing reuses the family&apos;s
          existing card — no need for parents to enter payment info again.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            placeholder="First name"
            value={form.firstName}
            onChange={(e) =>
              setForm((p) => ({ ...p, firstName: e.target.value }))
            }
            className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) =>
              setForm((p) => ({ ...p, lastName: e.target.value }))
            }
            className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Grade (K, 1–16)"
            value={form.grade}
            onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
            className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Rate $/session"
            value={form.rate}
            onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
            className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md text-xs"
          >
            {saving ? "Saving…" : "Add Sibling"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md text-xs"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ParentPaymentBlock({ parent }: { parent: Parent }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {parent.firstName} {parent.lastName} · {parent.email}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          <Plus className="h-3 w-3" />
          {adding ? "Cancel" : "Add card"}
        </Button>
      </div>
      {adding && (
        <Card className="border border-neutral-200 rounded-lg p-4">
          <p className="text-xs text-neutral-500 mb-3">
            Enter the card details on behalf of {parent.firstName}. Stripe
            stores the card; Mathitude never sees the number.
          </p>
          <SaveCardForm parentId={parent.id} hideHeader />
        </Card>
      )}
      {parent.stripeCustomerId ? (
        <PaymentMethodsPanel parentId={parent.id} />
      ) : (
        <Card className="border border-neutral-200 rounded-lg bg-neutral-50">
          <div className="py-4 px-4 text-sm text-neutral-500">
            No Stripe customer yet. Click <strong>Add card</strong> to create
            one + save the first card in a single step.
          </div>
        </Card>
      )}
    </div>
  );
}
