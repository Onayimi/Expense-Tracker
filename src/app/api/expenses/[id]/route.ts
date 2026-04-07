/**
 * API Route: /api/expenses/[id]
 * ------------------------------
 * GET    — Returns a single expense by ID
 * PUT    — Updates an existing expense
 * DELETE — Deletes an expense
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getDefaultBorrowedStatus,
  getDefaultReimbursementStatus,
  validateExpenseForm,
} from "@/lib/utils";
import type { FundsType, ExpenseFor } from "@/types";

// Helper to extract the numeric ID from the route segment
function getId(params: { id: string }): number | null {
  const id = parseInt(params.id);
  return isNaN(id) ? null : id;
}

// ── GET /api/expenses/[id] ─────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { fundingSource: true },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to fetch expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// ── PUT /api/expenses/[id] ─────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await request.json();

    const validationError = validateExpenseForm(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
      date,
      title,
      category,
      amount,
      fundingSourceId,
      fundsType,
      expenseFor,
      notes,
    } = body;

    // Re-calculate statuses when the expense is edited
    // (e.g. if user changes fundsType from MINE to BORROWED, set outstanding)
    const newBorrowedStatus = getDefaultBorrowedStatus(fundsType as FundsType);
    const newReimbursementStatus = getDefaultReimbursementStatus(
      expenseFor as ExpenseFor
    );

    // Fetch the current expense so we can preserve repaid/reimbursement dates
    // if the statuses haven't changed
    const current = await prisma.expense.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // If the status was already REPAID and we're keeping fundsType=BORROWED,
    // preserve the REPAID status rather than resetting it to OUTSTANDING
    const borrowedStatus =
      fundsType === "BORROWED" && current.borrowedStatus === "REPAID"
        ? "REPAID"
        : newBorrowedStatus;

    const reimbursementStatus =
      expenseFor === "HUBBY" && current.reimbursementStatus === "PAID_BACK"
        ? "PAID_BACK"
        : newReimbursementStatus;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: new Date(date),
        title: String(title).trim(),
        category,
        amount: parseFloat(amount),
        fundingSourceId: parseInt(fundingSourceId),
        fundsType,
        expenseFor,
        notes: notes ? String(notes).trim() : null,
        borrowedStatus,
        reimbursementStatus,
        // Preserve repaid date if status is still REPAID
        repaidDate:
          borrowedStatus === "REPAID" ? current.repaidDate : null,
        reimbursementDate:
          reimbursementStatus === "PAID_BACK"
            ? current.reimbursementDate
            : null,
      },
      include: { fundingSource: true },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to update expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/expenses/[id] ──────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
