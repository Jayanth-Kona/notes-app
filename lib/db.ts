import { DatabaseSync } from "node:sqlite";
import path from "node:path";

// One DB file at the project root. Survives server restarts.
const DB_PATH = path.join(process.cwd(), "notes.db");

// Reuse a single connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { _db?: DatabaseSync };

function getDb(): DatabaseSync {
  if (!globalForDb._db) {
    const db = new DatabaseSync(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    globalForDb._db = db;
  }
  return globalForDb._db;
}

export type Note = { id: number; text: string; created_at: string };

export function listNotes(): Note[] {
  return getDb()
    .prepare("SELECT id, text, created_at FROM notes ORDER BY id DESC")
    .all() as unknown as Note[];
}

export function addNote(text: string): Note {
  const db = getDb();
  const info = db.prepare("INSERT INTO notes (text) VALUES (?)").run(text);
  const id = Number(info.lastInsertRowid);
  return db
    .prepare("SELECT id, text, created_at FROM notes WHERE id = ?")
    .get(id) as unknown as Note;
}

export function deleteNote(id: number): boolean {
  const info = getDb().prepare("DELETE FROM notes WHERE id = ?").run(id);
  return info.changes > 0;
}