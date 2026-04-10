export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { category: true, lineItems: true, hubbyBorrow: { include: { repayments: true } } },
    });
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (err) {
    console.error("[expense GET id]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { amount, date, notes, categoryId, isHubbyBorrow, lineItems, hubbyDescription } = body;

    // Delete existing line items and recreate
    await prisma.expenseLineItem.deleteMany({ where: { expenseId: params.id } });

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        amount: parseFloat(amount),
        date: new Date(date),
        notes: notes || null,
        categoryId,
        isHubbyBorrow: Boolean(isHubbyBorrow),
        lineItems: lineItems?.length
          ? { create: lineItems.map((li: { description: string; amount: number }) => ({
              description: li.description,
              amount: parseFloat(String(li.amount)),
            })) }
          : undefined,
      },
      include: { category: true, lineItems: true, hubbyBorrow: { include: { repayments: true } } },
    });

    // Update hubby borrow total if exists
    if (updated.hubbyBorrow) {
      await prisma.hubbyBorrow.update({
        where: { expenseId: params.id },
        data: {
          totalAmount: parseFloat(amount),
          description: hubbyDescription || null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[expense PUT]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.expense.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[expense DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
