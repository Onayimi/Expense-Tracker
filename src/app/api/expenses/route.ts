/**
 * API Route: /api/expenses
 * -------------------------
 * GET  — Returns a filtered list of expenses
 * POST — Creates a new expense
 *
 * GET query params:
 *   search        - text search on title/notes
 *   category      - filter by category name
 *   fundingSource - filter by funding source name
 *   expenseFor    - filter by "ME" | "HOUSEHOLD" | "HUBBY"
 *   fundsType     - filter by "MINE" | "BORROWED"
 *   month         - filter by month number (1-12)
 *   year          - filter by year (e.g. 2024)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getDefaultBorrowedStatus,
  getDefaultReimbursementStatus,
  validateExpenseForm,
} from "@/lib/utils";
import type { FundsType, ExpenseFor } from "@/types";

// Force dynamic — this route reads query params and writes to the database
export const dynamic = "force-dynamic";

// ── GET /api/expenses ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const fundingSource = searchParams.get("fundingSource") ?? "";
    const expenseFor = searchParams.get("expenseFor") ?? "";
    const fundsType = searchParams.get("fundsType") ?? "";
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Build Prisma where clause dynamically based on provided filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Text search: match title or notes (case-insensitive via SQLite "contains")
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (category) where.category = category;
    if (expenseFor) where.expenseFor = expenseFor;
    if (fundsType) where.fundsType = fundsType;

    // Filter by funding source name (requires joining to FundingSource)
    if (fundingSource) {
      where.fundingSource = { name: fundingSource };
    }

    // Filter by month and/or year
    if (month || year) {
      const dateFilters: { gte?: Date; lte?: Date } = {};

      const y = year ? parseInt(year) : new Date().getFullYear();
      const m = month ? parseInt(month) - 1 : 0; // JS months are 0-based

      if (month && year) {
        // Specific month in a specific year
        dateFilters.gte = new Date(y, m, 1);
        dateFilters.lte = new Date(y, m + 1, 0, 23, 59, 59);
      } else if (year) {
        // Entire year
        dateFilters.gte = new Date(y, 0, 1);
        dateFilters.lte = new Date(y, 11, 31, 23, 59, 59);
      }

      where.date = dateFilters;
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { fundingSource: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// ── POST /api/expenses ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
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

    // ── Core business logic ────────────────────────────────────────────
    // Automatically set statuses based on fundsType and expenseFor

    // If paying with borrowed money → mark as outstanding
    const borrowedStatus = getDefaultBorrowedStatus(fundsType as FundsType);

    // If paying for hubby → mark as hubby owes me
    const reimbursementStatus = getDefaultReimbursementStatus(
      expenseFor as ExpenseFor
    );

    const expense = await prisma.expense.create({
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
      },
      include: { fundingSource: true },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
