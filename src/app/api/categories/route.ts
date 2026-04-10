import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const cat = await prisma.expenseCategory.create({ data: { name: name.trim() } });
    return NextResponse.json(cat, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg.includes("Unique")) return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
