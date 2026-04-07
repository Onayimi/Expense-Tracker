/**
 * Edit Expense Page  (/expenses/[id]/edit)
 * ------------------------------------------
 * Loads the existing expense data, then renders the form pre-filled with it.
 * This is a server component — it fetches data on the server before rendering.
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpenseForm from "@/components/ExpenseForm";
import { toInputDate } from "@/lib/utils";
import type { FundsType, ExpenseFor } from "@/types";

interface EditExpensePageProps {
  params: { id: string };
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const id = parseInt(params.id);

  // Validate the ID
  if (isNaN(id)) notFound();

  // Fetch the expense from the database (server-side)
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { fundingSource: true },
  });

  // Show 404 if not found
  if (!expense) notFound();

  // Format the data to match what ExpenseForm expects
  const initialData = {
    date: toInputDate(expense.date),
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    fundingSourceId: expense.fundingSourceId,
    fundsType: expense.fundsType as FundsType,
    expenseFor: expense.expenseFor as ExpenseFor,
    notes: expense.notes ?? "",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1>Edit Expense</h1>
        <p className="text-sm text-gray-500 mt-1">
          Editing: <strong>{expense.title}</strong>
        </p>
      </div>

      {/* Pre-filled form */}
      <div className="card">
        <ExpenseForm initialData={initialData} expenseId={id} />
      </div>
    </div>
  );
}
