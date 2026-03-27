'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { Student, Family } from '@/types';
import { Plus, Loader2 } from 'lucide-react';

export default function StudentsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <StudentsContent />
    </ProtectedRoute>
  );
}

function StudentsContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function loadStudents() {
    try {
      const [s, f] = await Promise.all([
        api.get<Student[]>('/students'),
        api.get<Family[]>('/families'),
      ]);
      setStudents(s);
      setFamilies(f);
    } catch {
      toast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (s) => (
        <span className="font-medium text-slate-900">
          {s.firstName} {s.lastName}
        </span>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (s) => <span>{s.grade}</span>,
    },
    {
      key: 'familyName',
      header: 'Family',
      render: (s) => <span>{s.familyName || '-'}</span>,
    },
    {
      key: 'nextSession',
      header: 'Next Session',
      render: (s) =>
        s.nextSession ? (
          <span>
            {new Date(s.nextSession).toLocaleDateString()} at{' '}
            {new Date(s.nextSession).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
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
              <h1 className="text-2xl font-bold text-slate-900">Students</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage all enrolled students.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Student
            </button>
          </div>

          <DataTable
            columns={columns}
            data={students}
            loading={loading}
            emptyMessage="No students found. Add your first student to get started."
            onRowClick={(s) => router.push(`/students/${s.id}`)}
          />
        </div>
      </main>

      {/* Add Student Modal */}
      <AddStudentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        families={families}
        onCreated={() => {
          setShowModal(false);
          setLoading(true);
          loadStudents();
        }}
      />
    </div>
  );
}

// ── Add Student Modal ────────────────────────────────────────────────────────

function AddStudentModal({
  open,
  onClose,
  families,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  families: Family[];
  onCreated: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [grade, setGrade] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function reset() {
    setFirstName('');
    setLastName('');
    setGrade('');
    setFamilyId('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/students', {
        firstName,
        lastName,
        grade: Number(grade),
        familyId: familyId || undefined,
      });
      toast('Student added successfully', 'success');
      reset();
      onCreated();
    } catch {
      toast('Failed to add student', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Student">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              First Name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Last Name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Grade
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Family
          </label>
          <select
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a family</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
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
            Add Student
          </button>
        </div>
      </form>
    </Modal>
  );
}
