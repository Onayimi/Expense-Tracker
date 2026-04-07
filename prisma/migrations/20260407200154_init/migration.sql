-- CreateTable
CREATE TABLE "FundingSource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "notes" TEXT,
    "fundingSourceId" INTEGER NOT NULL,
    "fundsType" TEXT NOT NULL DEFAULT 'MINE',
    "expenseFor" TEXT NOT NULL DEFAULT 'ME',
    "borrowedStatus" TEXT,
    "repaidDate" DATETIME,
    "reimbursementStatus" TEXT,
    "reimbursementDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "FundingSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FundingSource_name_key" ON "FundingSource"("name");
