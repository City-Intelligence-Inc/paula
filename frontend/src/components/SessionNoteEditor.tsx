'use client';

import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Badge from './Badge';
import { useToast } from './Toast';
import api from '@/lib/api';

interface Props {
  sessionId: string;
  initialInternalNote: string;
  initialClientNote: string;
  onSaved?: () => void;
}

type TabKey = 'internal' | 'client';

export default function SessionNoteEditor({
  sessionId,
  initialInternalNote,
  initialClientNote,
  onSaved,
}: Props) {
  const [tab, setTab] = useState<TabKey>('internal');
  const [internalNote, setInternalNote] = useState(initialInternalNote);
  const [clientNote, setClientNote] = useState(initialClientNote);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const currentNote = tab === 'internal' ? internalNote : clientNote;
  const setCurrentNote =
    tab === 'internal' ? setInternalNote : setClientNote;

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/sessions/${sessionId}`, {
        internalNote,
        clientNote,
      });
      toast('Notes saved successfully', 'success');
      onSaved?.();
    } catch {
      toast('Failed to save notes', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('internal')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'internal'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Internal Note
          <Badge variant="danger">INTERNAL ONLY</Badge>
        </button>
        <button
          onClick={() => setTab('client')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'client'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Client Note
        </button>
      </div>

      {/* Note area */}
      <div className="p-4">
        {tab === 'internal' && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            This note is for internal use only. Parents will NOT see this.
          </div>
        )}
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder={
            tab === 'internal'
              ? 'Add internal notes about this session...'
              : 'Add a note for the parent/family...'
          }
          className="h-32 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
