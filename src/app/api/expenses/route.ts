import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const hubbyOnly = searchParams.get("hubbyOnly") === "true";

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (hubbyOnly) where.isHubbyBorrow = true;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true, lineItems: true, hubbyBorrow: { include: { repayments: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (err) {
    console.error("[expenses GET]", err);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, date, notes, categoryId, isHubbyBorrow, lineItems, hubbyDescription } = body;

    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });

    const expense = await prisma.expense.create({
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
        hubbyBorrow: isHubbyBorrow
          ? { create: {
              description: hubbyDescription || null,
              totalAmount: parseFloat(amount),
              paidAmount: 0,
              status: "OUTSTANDING",
            } }
          : undefined,
      },
      include: { category: true, lineItems: true, hubbyBorrow: { include: { repayments: true } } },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error("[expenses POST]", err);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
