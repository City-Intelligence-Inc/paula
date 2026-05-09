"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { client } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, CreditCard, Plus } from "lucide-react";
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
    return () => {
      cancelled = true;
    };
  }, [fetchApi, id]);

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
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">Parents</h2>
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
                  <span className="text-xs text-neutral-400">
                    {parent.stripeCustomerId ? "Stripe ✓" : "no Stripe"}
                  </span>
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
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">
          Students
        </h2>
        {students.length === 0 ? (
          <p className="text-sm text-neutral-400">No students linked yet.</p>
        ) : (
          <div className="space-y-2">
            {students.map((student) => (
              <Card
                key={student.id}
                className="py-0 border border-neutral-200 rounded-lg"
              >
                <Link
                  href={`/admin/students/${student.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Grade {student.grade}
                    </p>
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
            ))}
          </div>
        )}
      </div>
    </div>
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
