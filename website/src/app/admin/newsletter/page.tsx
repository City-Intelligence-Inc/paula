"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Trash2, Send, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";

interface Subscriber {
  email: string;
  subscribedAt: string;
}

export default function AdminNewsletterPage() {
  const fetchApi = useApi();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Compose state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  function fetchSubscribers() {
    setLoading(true);
    fetchApi("/api/newsletter/subscribers")
      .then((res) => res.json())
      .then((json) => {
        setSubscribers(json.subscribers || []);
        setCount(json.count || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function handleUnsubscribe(email: string) {
    if (!confirm(`Remove ${email} from the mailing list?`)) return;

    try {
      await fetchApi(`/api/newsletter/subscribers/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      fetchSubscribers();
    } catch {
      alert("Failed to remove subscriber");
    }
  }

  function handleSendToAll() {
    if (!subject.trim() || !message.trim()) return;
    setShowConfirm(true);
  }

  const inputClass =
    "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300";

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">
            Newsletter
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage subscribers and send updates
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg px-5 py-4">
          <Users className="h-5 w-5 text-neutral-400" />
          <div>
            <p className="text-2xl font-semibold text-neutral-900">{count}</p>
            <p className="text-xs text-neutral-500">
              {count === 1 ? "subscriber" : "subscribers"}
            </p>
          </div>
        </div>

        {/* Compose */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Compose
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. March Math Festival Update"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Write your newsletter message..."
                className={inputClass + " resize-y"}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={handleSendToAll}
                disabled={!subject.trim() || !message.trim()}
                className="inline-flex items-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800 rounded-md px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                Send to All
              </button>
              {showConfirm && (
                <p className="text-sm text-neutral-600">
                  Email sending is not yet connected. {count} subscribers would
                  receive this message.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Subscriber list */}
        <div className="bg-white border border-neutral-200 rounded-lg">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              Subscribers
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-neutral-400">
              Loading...
            </div>
          ) : subscribers.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-neutral-400">
              No subscribers yet
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {subscribers.map((sub) => (
                <li
                  key={sub.email}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {sub.email}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Signed up{" "}
                      {new Date(sub.subscribedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(sub.email)}
                    className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                    title="Remove subscriber"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
