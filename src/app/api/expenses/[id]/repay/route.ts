/**
 * API Route: /api/expenses/[id]/repay
 * -------------------------------------
 * POST — Marks a borrowed-money expense as REPAID.
 *
 * This is called when you have paid back money you borrowed
 * (e.g. you borrowed from hubby and have now paid him back).
 *
 * Request body (optional):
 *   { repaidDate: "2024-01-25" }  — defaults to today if not provided
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const repaidDate = body.repaidDate ? new Date(body.repaidDate) : new Date();

    // Make sure this expense actually has borrowed money
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    if (expense.fundsType !== "BORROWED") {
      return NextResponse.json(
        { error: "This expense is not marked as borrowed money" },
        { status: 400 }
      );
    }
    if (expense.borrowedStatus === "REPAID") {
      return NextResponse.json(
        { error: "This expense is already marked as repaid" },
        { status: 400 }
      );
    }

    // Update status to REPAID and record the repayment date
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        borrowedStatus: "REPAID",
        repaidDate,
      },
      include: { fundingSource: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to mark as repaid:", error);
    return NextResponse.json(
      { error: "Failed to mark as repaid" },
      { status: 500 }
    );
  }
}
