"use client";

import { useEffect, useState } from "react";

type Note = { id: number; text: string; created_at: string };

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/notes", { cache: "no-store" });
    setNotes(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    setText("");
    await refresh();
    setBusy(false);
  }

  async function removeNote(id: number) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">Notes</h1>

      <form onSubmit={addNote} className="mb-6 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="text-gray-500">No notes yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-gray-900">{n.text}</p>
                <p className="mt-1 text-xs text-gray-400">{n.created_at}</p>
              </div>
              <button
                onClick={() => removeNote(n.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
