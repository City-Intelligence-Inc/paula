"use client";

import { useEffect, useState, useRef, useCallback } from "react";
  const fetchApi = useApi();
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";

interface ContentBlock {
  blockId: string;
  content: string;
  type: string;
  updatedAt?: string;
}

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  "math-engagement": "Math Engagement",
  tutoring: "Tutoring",
  shop: "Shop",
  events: "Events",
  contact: "Contact",
  about: "About",
};

function BlockEditor({
  pageId,
  block,
  onDelete,
}: {
  pageId: string;
  block: ContentBlock;
  onDelete: (blockId: string) => void;
}) {
  const [value, setValue] = useState(block.content);
  const [savedValue, setSavedValue] = useState(block.content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedTimer = useRef<NodeJS.Timeout | null>(null);

  const isHeading = block.type === "heading";
  const isDirty = value !== savedValue;

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    try {
      const res = await fetchApi(`/api/content/${pageId}/${block.blockId}`, {
        method: "PUT",
        body: JSON.stringify({ content: value, type: block.type }),
      });
      if (res.ok) {
        setSavedValue(value);
        setSaved(true);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete block "${block.blockId}"?`)) return;
    try {
      const res = await fetchApi(`/api/content/${pageId}/${block.blockId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(block.blockId);
      }
    } catch {
      // silent fail
    }
  }

  return (
    <div className="group relative bg-white border border-neutral-200 rounded-lg p-5">
      {/* Block header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">
            {block.blockId}
          </span>
          <span className="text-xs text-neutral-300">
            {block.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all p-1"
            title="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editable content */}
      {isHeading ? (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          className="w-full text-lg font-semibold text-neutral-900 border border-dashed border-neutral-200 focus:border-solid focus:border-neutral-400 rounded-md p-3 outline-none transition-colors bg-transparent"
          placeholder="Heading text..."
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoResize();
          }}
          onBlur={handleSave}
          className="w-full text-sm text-neutral-700 border border-dashed border-neutral-200 focus:border-solid focus:border-neutral-400 rounded-md p-3 outline-none transition-colors bg-transparent resize-none overflow-hidden"
          placeholder="Content text..."
          rows={1}
        />
      )}

      {/* Save button (shown when dirty) */}
      {isDirty && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-neutral-900 text-white hover:bg-neutral-800 rounded px-3 py-1.5 font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // New block form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newBlockId, setNewBlockId] = useState("");
  const [newBlockType, setNewBlockType] = useState<"text" | "heading" | "link" | "image">("text");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);

  useEffect(() => {
    fetchBlocks();
  }, [pageId]);

  function fetchBlocks() {
    setLoading(true);
    // Fetch all blocks for this page from the admin endpoint
    fetchApi("/api/content-admin")
      .then((res) => res.json())
      .then((json) => {
        const pageBlocks = (json.pages || {})[pageId] || [];
        setBlocks(
          pageBlocks.sort((a: ContentBlock, b: ContentBlock) =>
            a.blockId.localeCompare(b.blockId)
          )
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function handleDeleteBlock(blockId: string) {
    setBlocks((prev) => prev.filter((b) => b.blockId !== blockId));
  }

  async function handleAddBlock() {
    if (!newBlockId.trim()) return;
    setAddingBlock(true);
    try {
      const res = await fetchApi(`/api/content/${pageId}/${newBlockId.trim()}`, {
        method: "PUT",
        body: JSON.stringify({
          content: newBlockContent,
          type: newBlockType,
        }),
      });
      if (res.ok) {
        setBlocks((prev) => [
          ...prev,
          {
            blockId: newBlockId.trim(),
            content: newBlockContent,
            type: newBlockType,
          },
        ]);
        setNewBlockId("");
        setNewBlockContent("");
        setNewBlockType("text");
        setShowNewForm(false);
      }
    } catch {
      // silent fail
    } finally {
      setAddingBlock(false);
    }
  }

  const pageLabel = PAGE_LABELS[pageId] || pageId;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
          <Link
            href="/admin/pages"
            className="hover:text-neutral-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Pages
          </Link>
          <span>/</span>
          <span className="text-neutral-700">{pageLabel}</span>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          {pageLabel}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {blocks.length} {blocks.length === 1 ? "content block" : "content blocks"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Block list */}
          <div className="space-y-4">
            {blocks.map((block) => (
              <BlockEditor
                key={block.blockId}
                pageId={pageId}
                block={block}
                onDelete={handleDeleteBlock}
              />
            ))}

            {blocks.length === 0 && !showNewForm && (
              <div className="text-center py-12 text-neutral-400">
                <p className="text-sm">No content blocks yet. Add one to get started.</p>
              </div>
            )}
          </div>

          {/* Add block */}
          {showNewForm ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-medium text-neutral-900">
                Add New Block
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">
                    Block ID
                  </label>
                  <input
                    type="text"
                    value={newBlockId}
                    onChange={(e) => setNewBlockId(e.target.value)}
                    placeholder="e.g. hero-heading"
                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">
                    Type
                  </label>
                  <select
                    value={newBlockType}
                    onChange={(e) =>
                      setNewBlockType(
                        e.target.value as "text" | "heading" | "link" | "image"
                      )
                    }
                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
                  >
                    <option value="text">Text</option>
                    <option value="heading">Heading</option>
                    <option value="link">Link</option>
                    <option value="image">Image</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Content
                </label>
                <textarea
                  value={newBlockContent}
                  onChange={(e) => setNewBlockContent(e.target.value)}
                  placeholder="Block content..."
                  rows={3}
                  className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 resize-y"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddBlock}
                  disabled={!newBlockId.trim() || addingBlock}
                  className="text-sm bg-neutral-900 text-white hover:bg-neutral-800 rounded-md px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingBlock ? "Adding..." : "Add Block"}
                </button>
                <button
                  onClick={() => {
                    setShowNewForm(false);
                    setNewBlockId("");
                    setNewBlockContent("");
                    setNewBlockType("text");
                  }}
                  className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-300 rounded-lg py-3 text-sm text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Block
            </button>
          )}
        </>
      )}
    </div>
  );
}
