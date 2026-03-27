'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import DataTable, { type Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { Family } from '@/types';
import { Plus, Loader2, Home, Users, GraduationCap } from 'lucide-react';
import type { FormEvent } from 'react';

export default function FamiliesPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <FamiliesContent />
    </ProtectedRoute>
  );
}

function FamiliesContent() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function loadFamilies() {
    try {
      const f = await api.get<Family[]>('/families');
      setFamilies(f);
    } catch {
      toast('Failed to load families', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<Family>[] = [
    {
      key: 'name',
      header: 'Family Name',
      render: (f) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Home className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-900">{f.name}</span>
        </div>
      ),
    },
    {
      key: 'parents',
      header: 'Parents',
      render: (f) => (
        <span>
          {f.parents?.map((p) => p.name).join(', ') || '-'}
        </span>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      render: (f) => (
        <span>
          {f.students
            ?.map((s) => `${s.firstName} ${s.lastName}`)
            .join(', ') || '-'}
        </span>
      ),
    },
    {
      key: 'activePackage',
      header: 'Package',
      render: (f) =>
        f.activePackage ? (
          <Badge variant={f.activePackage.status === 'active' ? 'success' : 'neutral'}>
            {f.activePackage.name}
          </Badge>
        ) : (
          <span className="text-slate-400">None</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="md:ml-64">
        <div className="px-4 py-8 md:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Families</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage families and their members.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Family
            </button>
          </div>

          <DataTable
            columns={columns}
            data={families}
            loading={loading}
            emptyMessage="No families found."
            onRowClick={(f) => setSelectedFamily(f)}
          />
        </div>
      </main>

      {/* Family Detail Modal */}
      <Modal
        open={!!selectedFamily}
        onClose={() => setSelectedFamily(null)}
        title={selectedFamily?.name || 'Family Details'}
        wide
      >
        {selectedFamily && (
          <div className="space-y-6">
            {/* Parents */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users className="h-4 w-4" />
                Parents
              </h4>
              {selectedFamily.parents?.length ? (
                <div className="space-y-2">
                  {selectedFamily.parents.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                      {p.phone && (
                        <p className="text-xs text-slate-500">{p.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No parents listed.</p>
              )}
            </div>

            {/* Students */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <GraduationCap className="h-4 w-4" />
                Students
              </h4>
              {selectedFamily.students?.length ? (
                <div className="space-y-2">
                  {selectedFamily.students.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedFamily(null);
                        router.push(`/students/${s.id}`);
                      }}
                      className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:bg-blue-50"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Grade {s.grade}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No students enrolled.
                </p>
              )}
            </div>

            {/* Package */}
            {selectedFamily.activePackage && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Active Package
                </h4>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">
                      {selectedFamily.activePackage.name}
                    </p>
                    <Badge
                      variant={
                        selectedFamily.activePackage.status === 'active'
                          ? 'success'
                          : 'neutral'
                      }
                    >
                      {selectedFamily.activePackage.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedFamily.activePackage.usedSessions} /{' '}
                    {selectedFamily.activePackage.totalSessions} sessions
                    used
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Family Modal */}
      <AddFamilyModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={() => {
          setShowAddModal(false);
          setLoading(true);
          loadFamilies();
        }}
      />
    </div>
  );
}

// ── Add Family Modal ─────────────────────────────────────────────────────────

function AddFamilyModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function reset() {
    setName('');
    setParentName('');
    setParentEmail('');
    setParentPhone('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/families', {
        name,
        parents: parentName
          ? [
              {
                name: parentName,
                email: parentEmail,
                phone: parentPhone || undefined,
              },
            ]
          : [],
      });
      toast('Family created', 'success');
      reset();
      onCreated();
    } catch {
      toast('Failed to create family', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Family">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Family Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. The Smiths"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <hr className="border-slate-200" />
        <p className="text-xs font-medium uppercase text-slate-400">
          Primary Parent (optional)
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Parent Name
          </label>
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Phone
          </label>
          <input
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Family
          </button>
        </div>
      </form>
    </Modal>
  );
}
