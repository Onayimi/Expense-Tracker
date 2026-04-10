export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const income = await prisma.income.findUnique({
      where: { id: params.id },
      include: { source: true },
    });
    if (!income) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(income);
  } catch (err) {
    console.error("[income GET id]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { amount, date, notes, sourceId } = body;
    const updated = await prisma.income.update({
      where: { id: params.id },
      data: {
        amount: parseFloat(amount),
        date: new Date(date),
        notes: notes || null,
        sourceId,
      },
      include: { source: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[income PUT]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.income.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[income DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
