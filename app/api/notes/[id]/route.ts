import { NextResponse } from "next/server";
import { deleteNote, updateNote } from "@/lib/db";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const ok = await deleteNote(numId);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const title =
    typeof body?.title === "string" ? body.title.trim() : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text && !title) {
    return NextResponse.json(
      { error: "title or text is required" },
      { status: 400 }
    );
  }
  const note = await updateNote(numId, title, text);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(note);
}