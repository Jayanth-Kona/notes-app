import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export type Note = {
  id: number;
  title: string;
  text: string;
  created_at: string;
  updated_at: string;
};

let initPromise: Promise<void> | null = null;
function init() {
  if (!initPromise) {
    initPromise = (async () => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL DEFAULT '',
          text TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      const cols = await client.execute("PRAGMA table_info(notes)");
      const names = new Set(cols.rows.map((r: any) => r.name));
      if (!names.has("title")) {
        await client.execute(
          "ALTER TABLE notes ADD COLUMN title TEXT NOT NULL DEFAULT ''"
        );
      }
      if (!names.has("updated_at")) {
        // SQLite forbids ALTER ADD COLUMN with a non-constant default.
        // Add with constant '', backfill, and we treat '' as created_at.
        await client.execute(
          "ALTER TABLE notes ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''"
        );
        await client.execute(
          "UPDATE notes SET updated_at = created_at WHERE updated_at = ''"
        );
      }
    })();
  }
  return initPromise;
}

const COLS = "id, title, text, created_at, updated_at";

export async function listNotes(): Promise<Note[]> {
  await init();
  const res = await client.execute(
    `SELECT ${COLS} FROM notes ORDER BY id DESC`
  );
  return res.rows as unknown as Note[];
}

export async function addNote(title: string, text: string): Promise<Note> {
  await init();
  const res = await client.execute({
    sql: "INSERT INTO notes (title, text) VALUES (?, ?)",
    args: [title, text],
  });
  const id = Number(res.lastInsertRowid);
  const row = await client.execute({
    sql: `SELECT ${COLS} FROM notes WHERE id = ?`,
    args: [id],
  });
  return row.rows[0] as unknown as Note;
}

export async function updateNote(
  id: number,
  title: string,
  text: string
): Promise<Note | null> {
  await init();
  const res = await client.execute({
    sql: "UPDATE notes SET title = ?, text = ?, updated_at = datetime('now') WHERE id = ?",
    args: [title, text, id],
  });
  if (res.rowsAffected === 0) return null;
  const row = await client.execute({
    sql: `SELECT ${COLS} FROM notes WHERE id = ?`,
    args: [id],
  });
  return (row.rows[0] as unknown as Note) ?? null;
}

export async function deleteNote(id: number): Promise<boolean> {
  await init();
  const res = await client.execute({
    sql: "DELETE FROM notes WHERE id = ?",
    args: [id],
  });
  return res.rowsAffected > 0;
}