import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const updated = await prisma.incomeSource.update({ where: { id: params.id }, data: { name: name.trim() } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[income-sources PUT]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const count = await prisma.income.count({ where: { sourceId: params.id } });
    if (count > 0) return NextResponse.json({ error: `Cannot delete — ${count} income entries use this source` }, { status: 409 });
    await prisma.incomeSource.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[income-sources DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
