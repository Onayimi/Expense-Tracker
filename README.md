# Vela — Personal Finance Tracker

A polished, mobile-first personal expense tracking app built for iPhone. Track income, personal expenses, and money lent to your partner with partial/full repayment tracking.

## App Name

**Vela** — means "to watch over" (guarding your finances)

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary | Deep Forest Green | `#123227` |
| Accent | Gold/Amber | `#D9A11E` |
| Background | Off-white | `#EEF4F3` |
| Borders | Light Sage | `#C6D4D2` |
| Danger | Accent Red | `#C62828` |

## Features

### Dashboard
- Available balance (Income − Expenses + Hubby Repayments)
- This month income & spending snapshot
- Quick-add buttons
- Hubby outstanding balance alerts
- Category breakdown (this month)
- Recent transaction feed

### Income Tracking
- Add income with source, date, amount, notes
- Filter by source
- Per-source totals
- Create/rename/delete custom sources
- Full CRUD with edit and delete

### Expense Tracking
- Add expenses by category
- Optional itemized line-item breakdown (e.g. Groceries → bread $4, milk $6)
- Mark any expense as "paid on behalf of hubby"
- Full CRUD with edit and delete
- Filter by category chips

### Hubby Tracker
- All expenses paid on behalf of hubby
- Status: Outstanding / Partially Paid / Fully Paid
- Record partial or full repayments
- Repayment history per borrow entry
- Delete repayments (auto-recalculates balance)
- Over-payment prevention

### Transaction History
- All income, expenses, hubby borrows, and repayments in one view
- Filter by type (tab pills)
- Date range filter
- Keyword search
- Sort newest/oldest
- Net total for current view

### Reports
- Monthly period selector
- Spending vs. income vs. net summary
- Spending rate bar
- Category breakdown with percentage bars
- Income by source breakdown
- All-time hubby summary (lent / repaid / outstanding)
- Monthly trend (last 6 months, clickable)

### Settings
- App name and currency settings
- Add/rename/delete income sources
- Add/rename/delete expense categories
- Deletion protection (blocked if in use)
- CSV data export

## Balance Logic

```
Available Balance = Total Income − Total Expenses + Total Hubby Repayments
```

All expenses (including hubby borrows) reduce available balance immediately because money left your hands. Repayments from hubby restore the balance when received.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite via Prisma |
| ORM | Prisma 5 |
| Runtime | Node.js 22 |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env

# 3. Create database and run migrations
npx prisma migrate dev --name init

# 4. Seed with sample data
npm run db:seed

# 5. Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production app |
| `npm run start` | Start production server |
| `npm run db:seed` | Populate database with sample data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run db:reset` | Reset DB and re-seed |

## Database Schema

```
IncomeSource    — Income sources (Salary, Rent, etc.)
Income          — Income entries linked to a source
ExpenseCategory — Expense categories (Groceries, Transport, etc.)
Expense         — Expense entries with optional line items
ExpenseLineItem — Individual items within an expense
HubbyBorrow     — Tracks expenses paid on behalf of partner
Repayment       — Individual repayment records for HubbyBorrow
AppSettings     — App name, currency, etc.
```

## Push to GitHub

```bash
git add -A
git commit -m "feat: complete Vela expense tracking app"
git push -u origin claude/expense-tracker-app-dxfmD
```

## PWA Installation (iPhone)

1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

The app will install with the forest green theme and behave like a native app.

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Dashboard
│   ├── income/page.tsx   # Income tracking
│   ├── expenses/page.tsx # Expense tracking
│   ├── hubby/page.tsx    # Partner borrow tracker
│   ├── history/page.tsx  # Full transaction history
│   ├── reports/page.tsx  # Reports & summaries
│   ├── settings/page.tsx # App settings
│   └── api/              # All API routes
├── components/
│   ├── layout/BottomNav.tsx
│   └── ui/               # Modal, Badge, EmptyState, ConfirmDialog
├── lib/
│   ├── prisma.ts
│   └── utils.ts
└── types/index.ts
```
