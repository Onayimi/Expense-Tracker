export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const borrow = await prisma.hubbyBorrow.findUnique({
      where: { id: params.id },
      include: { expense: { include: { category: true, lineItems: true } }, repayments: true },
    });
    if (!borrow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(borrow);
  } catch (err) {
    console.error("[hubby GET id]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Deleting the expense cascades to hubbyBorrow and repayments
    const borrow = await prisma.hubbyBorrow.findUnique({ where: { id: params.id } });
    if (!borrow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.expense.delete({ where: { id: borrow.expenseId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[hubby DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
