import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("sourceId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (sourceId) where.sourceId = sourceId;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const income = await prisma.income.findMany({
      where,
      include: { source: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(income);
  } catch (err) {
    console.error("[income GET]", err);
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, date, notes, sourceId } = body;

    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });
    if (!sourceId) return NextResponse.json({ error: "Source is required" }, { status: 400 });

    const income = await prisma.income.create({
      data: { amount: parseFloat(amount), date: new Date(date), notes: notes || null, sourceId },
      include: { source: true },
    });
    return NextResponse.json(income, { status: 201 });
  } catch (err) {
    console.error("[income POST]", err);
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 });
  }
}
