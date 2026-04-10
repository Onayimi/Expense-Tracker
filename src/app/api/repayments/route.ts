import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hubbyBorrowId, amount, date, notes } = body;

    if (!hubbyBorrowId) return NextResponse.json({ error: "Borrow ID required" }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    const borrow = await prisma.hubbyBorrow.findUnique({ where: { id: hubbyBorrowId } });
    if (!borrow) return NextResponse.json({ error: "Borrow record not found" }, { status: 404 });

    const repaymentAmount = parseFloat(amount);
    const remaining = borrow.totalAmount - borrow.paidAmount;
    if (repaymentAmount > remaining + 0.001) {
      return NextResponse.json({ error: `Repayment exceeds outstanding balance of $${remaining.toFixed(2)}` }, { status: 400 });
    }

    const newPaid = borrow.paidAmount + repaymentAmount;
    const newStatus = newPaid >= borrow.totalAmount - 0.001 ? "PAID" : "PARTIAL";

    const [repayment] = await prisma.$transaction([
      prisma.repayment.create({
        data: { hubbyBorrowId, amount: repaymentAmount, date: new Date(date), notes: notes || null },
      }),
      prisma.hubbyBorrow.update({
        where: { id: hubbyBorrowId },
        data: { paidAmount: newPaid, status: newStatus },
      }),
    ]);

    return NextResponse.json(repayment, { status: 201 });
  } catch (err) {
    console.error("[repayments POST]", err);
    return NextResponse.json({ error: "Failed to record repayment" }, { status: 500 });
  }
}
