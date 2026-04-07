/**
 * API Route: /api/export
 * -----------------------
 * GET — Downloads all expenses as a CSV file.
 *
 * Supports the same filters as /api/expenses so you can export
 * a filtered subset (e.g. only borrowed money, only hubby expenses).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCSV, formatDate } from "@/lib/utils";

// Force dynamic rendering — this route reads query params from the URL
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Accept the same filters as the main expenses endpoint
    const category = searchParams.get("category") ?? "";
    const fundingSource = searchParams.get("fundingSource") ?? "";
    const expenseFor = searchParams.get("expenseFor") ?? "";
    const fundsType = searchParams.get("fundsType") ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (category) where.category = category;
    if (expenseFor) where.expenseFor = expenseFor;
    if (fundsType) where.fundsType = fundsType;
    if (fundingSource) where.fundingSource = { name: fundingSource };

    const expenses = await prisma.expense.findMany({
      where,
      include: { fundingSource: true },
      orderBy: { date: "desc" },
    });

    // Transform Prisma records into flat CSV-friendly objects
    const rows = expenses.map((e) => ({
      ID: e.id,
      Date: formatDate(e.date),
      Title: e.title,
      Category: e.category,
      Amount: e.amount.toFixed(2),
      "Funding Source": e.fundingSource.name,
      "Funds Type": e.fundsType,
      "Expense For": e.expenseFor,
      "Borrowed Status": e.borrowedStatus ?? "",
      "Repaid Date": e.repaidDate ? formatDate(e.repaidDate) : "",
      "Reimbursement Status": e.reimbursementStatus ?? "",
      "Reimbursement Date": e.reimbursementDate
        ? formatDate(e.reimbursementDate)
        : "",
      Notes: e.notes ?? "",
      "Created At": formatDate(e.createdAt),
    }));

    const csv = toCSV(rows);

    // Return as a downloadable CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
