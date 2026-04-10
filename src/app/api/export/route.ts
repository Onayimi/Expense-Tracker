import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCSV } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [income, expenses, repayments] = await Promise.all([
      prisma.income.findMany({ include: { source: true }, orderBy: { date: "desc" } }),
      prisma.expense.findMany({ include: { category: true, lineItems: true, hubbyBorrow: true }, orderBy: { date: "desc" } }),
      prisma.repayment.findMany({ include: { hubbyBorrow: true }, orderBy: { date: "desc" } }),
    ]);

    const incomeRows = income.map((i) => ({
      type: "Income",
      date: new Date(i.date).toLocaleDateString(),
      description: `Income - ${i.source.name}`,
      amount: i.amount,
      source: i.source.name,
      category: "",
      notes: i.notes ?? "",
      hubbyStatus: "",
    }));

    const expenseRows = expenses.map((e) => ({
      type: e.isHubbyBorrow ? "Hubby Borrow" : "Expense",
      date: new Date(e.date).toLocaleDateString(),
      description: e.category.name,
      amount: -e.amount,
      source: "",
      category: e.category.name,
      notes: e.notes ?? "",
      hubbyStatus: e.hubbyBorrow?.status ?? "",
    }));

    const repaymentRows = repayments.map((r) => ({
      type: "Hubby Repayment",
      date: new Date(r.date).toLocaleDateString(),
      description: "Repayment from hubby",
      amount: r.amount,
      source: "",
      category: "",
      notes: r.notes ?? "",
      hubbyStatus: "",
    }));

    const csv = toCSV([...incomeRows, ...expenseRows, ...repaymentRows]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="vela-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("[export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
