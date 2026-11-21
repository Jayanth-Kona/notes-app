import { NextResponse } from "next/server";
import { listNotes, addNote } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await listNotes());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const note = await addNote(text);
  return NextResponse.json(note, { status: 201 });
}