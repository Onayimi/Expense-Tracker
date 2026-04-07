/**
 * New Expense Page  (/expenses/new)
 */

import ExpenseForm from "@/components/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1>Add New Expense</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to record a new expense.
        </p>
      </div>

      <div className="card border-t-4 border-gold">
        <ExpenseForm />
      </div>
    </div>
  );
}
