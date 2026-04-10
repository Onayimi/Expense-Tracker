import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sources = await prisma.incomeSource.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(sources);
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const source = await prisma.incomeSource.create({ data: { name: name.trim() } });
    return NextResponse.json(source, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg.includes("Unique")) return NextResponse.json({ error: "Source name already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}
