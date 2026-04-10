import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const updated = await prisma.expenseCategory.update({ where: { id: params.id }, data: { name: name.trim() } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[categories PUT]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const count = await prisma.expense.count({ where: { categoryId: params.id } });
    if (count > 0) return NextResponse.json({ error: `Cannot delete — ${count} expenses use this category` }, { status: 409 });
    await prisma.expenseCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[categories DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
