import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export type Note = { id: number; text: string; created_at: string };

let initialized = false;
async function init() {
  if (initialized) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  initialized = true;
}

export async function listNotes(): Promise<Note[]> {
  await init();
  const res = await client.execute(
    "SELECT id, text, created_at FROM notes ORDER BY id DESC"
  );
  return res.rows as unknown as Note[];
}

export async function addNote(text: string): Promise<Note> {
  await init();
  const res = await client.execute({
    sql: "INSERT INTO notes (text) VALUES (?)",
    args: [text],
  });
  const id = Number(res.lastInsertRowid);
  const row = await client.execute({
    sql: "SELECT id, text, created_at FROM notes WHERE id = ?",
    args: [id],
  });
  return row.rows[0] as unknown as Note;
}

export async function deleteNote(id: number): Promise<boolean> {
  await init();
  const res = await client.execute({
    sql: "DELETE FROM notes WHERE id = ?",
    args: [id],
  });
  return res.rowsAffected > 0;
}