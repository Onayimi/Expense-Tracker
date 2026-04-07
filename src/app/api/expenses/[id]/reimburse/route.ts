/**
 * API Route: /api/expenses/[id]/reimburse
 * -----------------------------------------
 * POST — Marks a hubby expense as PAID_BACK.
 *
 * This is called when hubby has paid you back for an expense
 * you covered on his behalf.
 *
 * Request body (optional):
 *   { reimbursementDate: "2024-01-25" }  — defaults to today if not provided
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
    const reimbursementDate = body.reimbursementDate
      ? new Date(body.reimbursementDate)
      : new Date();

    // Make sure this expense is for hubby
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    if (expense.expenseFor !== "HUBBY") {
      return NextResponse.json(
        { error: "This expense is not marked as for hubby" },
        { status: 400 }
      );
    }
    if (expense.reimbursementStatus === "PAID_BACK") {
      return NextResponse.json(
        { error: "This expense is already marked as paid back" },
        { status: 400 }
      );
    }

    // Update status to PAID_BACK and record when he paid you back
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        reimbursementStatus: "PAID_BACK",
        reimbursementDate,
      },
      include: { fundingSource: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to mark as paid back:", error);
    return NextResponse.json(
      { error: "Failed to mark as paid back" },
      { status: 500 }
    );
  }
}
