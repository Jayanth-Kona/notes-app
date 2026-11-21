"use client";

import { useEffect, useMemo, useState } from "react";

type Note = {
  id: number;
  title: string;
  text: string;
  created_at: string;
  updated_at: string;
};

function displayTitle(n: Note) {
  if (n.title.trim()) return n.title.trim();
  const oneLine = n.text.replace(/\s+/g, " ").trim();
  return oneLine ? oneLine.slice(0, 48) + (oneLine.length > 48 ? "…" : "") : "Untitled";
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [bodyDraft, setBodyDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNew, setIsNew] = useState(false); // "new note" editor open

  async function refresh(selectAfter?: number) {
    const res = await fetch("/api/notes", { cache: "no-store" });
    const data: Note[] = await res.json();
    setNotes(data);
    setLoading(false);
    if (selectAfter != null) setSelectedId(selectAfter);
    else if (selectedId == null && data.length) setSelectedId(data[0].id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  useEffect(() => {
    setTitleDraft(selected?.title ?? "");
    setBodyDraft(selected?.text ?? "");
    setIsNew(false);
  }, [selected?.id, selected?.title, selected?.text]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q)
    );
  }, [notes, query]);

  function startNew() {
    setSelectedId(null);
    setTitleDraft("");
    setBodyDraft("");
    setIsNew(true);
    setMenuOpen(false);
  }

  async function createNote() {
    if (saving) return;
    const title = titleDraft.trim();
    const text = bodyDraft.trim();
    if (!title && !text) {
      setIsNew(false);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
    });
    const created: Note = await res.json();
    setIsNew(false);
    await refresh(created.id);
    setSaving(false);
  }

  async function saveEdit() {
    if (!selected || saving) return;
    const title = titleDraft.trim();
    const text = bodyDraft.trim();
    if (!title && !text) return;
    if (title === selected.title && text === selected.text) return;
    setSaving(true);
    await fetch(`/api/notes/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
    });
    await refresh(selected.id);
    setSaving(false);
  }

  async function removeNote(id: number) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (selectedId === id) {
      setSelectedId(null);
      setTitleDraft("");
      setBodyDraft("");
    }
    await refresh();
  }

  const dirty =
    selected != null &&
    (titleDraft.trim() !== selected.title || bodyDraft.trim() !== selected.text);

  const editorOpen = isNew || selected != null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-screen max-w-6xl flex-col px-3 py-3 md:px-6 md:py-6">
        <header className="mb-3 flex items-center justify-between md:mb-6">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Notes</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={startNew}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
            >
              + New note
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm md:hidden"
            >
              {menuOpen ? "Close" : "List ▾"}
            </button>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden md:grid-cols-[320px_1fr] md:gap-6">
          {/* Sidebar */}
          <aside
            className={`flex min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 ${
              menuOpen ? "flex" : "hidden md:flex"
            }`}
          >
            <div className="border-b border-zinc-800 p-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {loading ? (
                <li className="p-3 text-sm text-zinc-500">Loading…</li>
              ) : filtered.length === 0 ? (
                <li className="p-3 text-sm text-zinc-500">No notes.</li>
              ) : (
                filtered.map((n) => {
                  const active = n.id === selectedId && !isNew;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => {
                          setSelectedId(n.id);
                          setMenuOpen(false);
                        }}
                        className={`group mb-1 w-full rounded-lg px-3 py-2 text-left transition ${
                          active
                            ? "bg-emerald-600/15 ring-1 ring-emerald-600/50"
                            : "hover:bg-zinc-800/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {displayTitle(n)}
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNote(n.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                removeNote(n.id);
                              }
                            }}
                            className="shrink-0 rounded px-1 text-xs text-zinc-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                            title="Delete"
                          >
                            ✕
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                          {n.text.replace(/\s+/g, " ").trim() || "—"}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* Editor */}
          <section className="flex min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40">
            {editorOpen ? (
              <>
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                  <div className="text-xs text-zinc-500">
                    {isNew
                      ? "New note"
                      : selected
                      ? `Updated ${selected.updated_at}`
                      : ""}
                  </div>
                  <div className="flex gap-2">
                    {isNew ? (
                      <>
                        <button
                          onClick={createNote}
                          disabled={saving}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40"
                        >
                          {saving ? "Saving…" : "Create"}
                        </button>
                        <button
                          onClick={() => setIsNew(false)}
                          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {dirty && (
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40"
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                        )}
                        {selected && (
                          <button
                            onClick={() => removeNote(selected.id)}
                            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-red-400 hover:border-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={isNew ? undefined : saveEdit}
                  placeholder="Title (optional)"
                  className="border-b border-zinc-800 bg-transparent px-4 py-3 text-lg font-semibold outline-none placeholder:text-zinc-600 md:px-6"
                />
                <textarea
                  value={bodyDraft}
                  onChange={(e) => setBodyDraft(e.target.value)}
                  onBlur={isNew ? undefined : saveEdit}
                  className="min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none md:p-6"
                  placeholder="Write something…"
                  autoFocus={isNew}
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500">
                Select a note, or click <span className="mx-1 font-semibold text-emerald-400">+ New note</span> to start.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}