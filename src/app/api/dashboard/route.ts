/**
 * API Route: /api/dashboard
 * --------------------------
 * GET — Returns all the aggregated stats for the dashboard page.
 *
 * Calculates:
 * - Total expense count and total amount
 * - Breakdown by category
 * - Breakdown by funding source
 * - Outstanding and repaid borrowed money totals
 * - Hubby owes me and received reimbursement totals
 * - Lists of unpaid items for the bottom-of-dashboard summaries
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic — always fetch fresh data from the database
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ── Fetch all expenses with their funding source ────────────────────
    const allExpenses = await prisma.expense.findMany({
      include: { fundingSource: true },
      orderBy: { date: "desc" },
    });

    // ── Total overview ───────────────────────────────────────────────────
    const totalExpenses = allExpenses.length;
    const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    // ── Group by category ────────────────────────────────────────────────
    const categoryMap = new Map<string, { total: number; count: number }>();
    for (const e of allExpenses) {
      const existing = categoryMap.get(e.category) ?? { total: 0, count: 0 };
      categoryMap.set(e.category, {
        total: existing.total + e.amount,
        count: existing.count + 1,
      });
    }
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total); // Sort highest spend first

    // ── Group by funding source ──────────────────────────────────────────
    const sourceMap = new Map<string, { total: number; count: number }>();
    for (const e of allExpenses) {
      const sourceName = e.fundingSource.name;
      const existing = sourceMap.get(sourceName) ?? { total: 0, count: 0 };
      sourceMap.set(sourceName, {
        total: existing.total + e.amount,
        count: existing.count + 1,
      });
    }
    const bySource = Array.from(sourceMap.entries())
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.total - a.total);

    // ── Borrowed money totals ────────────────────────────────────────────
    const outstandingBorrowedExpenses = allExpenses.filter(
      (e) => e.borrowedStatus === "OUTSTANDING"
    );
    const repaidBorrowedExpenses = allExpenses.filter(
      (e) => e.borrowedStatus === "REPAID"
    );

    const totalOutstandingBorrowed = outstandingBorrowedExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const totalRepaidBorrowed = repaidBorrowedExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // ── Hubby reimbursement totals ───────────────────────────────────────
    const hubbyOwesMeExpenses = allExpenses.filter(
      (e) => e.reimbursementStatus === "OWES_ME"
    );
    const paidBackExpenses = allExpenses.filter(
      (e) => e.reimbursementStatus === "PAID_BACK"
    );

    const totalHubbyOwesMe = hubbyOwesMeExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const totalReimbursementsReceived = paidBackExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    return NextResponse.json({
      totalExpenses,
      totalAmount,
      byCategory,
      bySource,
      totalOutstandingBorrowed,
      totalRepaidBorrowed,
      totalHubbyOwesMe,
      totalReimbursementsReceived,
      outstandingBorrowedExpenses,
      hubbyOwesMeExpenses,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
