# 💰 Expense Tracker

A beginner-friendly personal expense tracking app built with **Next.js 14**, **SQLite**, **Prisma**, and **Tailwind CSS**.

---

## What It Does

- Track **personal**, **household**, and **hubby** expenses
- Track expenses paid with **borrowed money** (mark as Outstanding / Repaid)
- Track expenses **hubby owes you** (mark as Owes Me / Paid Back)
- **Dashboard** with spending summaries and visual breakdowns
- **Filter** by category, source of funds, who it's for, month, and year
- **Search** expenses by title or notes
- **Export to CSV**
- Clean **status badges** and colour-coded UI

---

## Colour Scheme

| Colour        | Hex       | Used for                            |
|---------------|-----------|-------------------------------------|
| Forest Green  | `#0C3B2C` | Navbar, headings, primary brand     |
| Amber Gold    | `#F0A020` | Buttons, active states, outstanding |
| Light Mint    | `#CBF0E4` | Backgrounds, success tints          |
| Crimson Red   | `#CC1F1F` | Alerts, hubby owes, warnings        |

---

## Folder Structure

```
expense-tracker/
├── prisma/
│   ├── schema.prisma        # Database schema (FundingSource + Expense models)
│   └── seed.ts              # Seeds default funding sources + sample data
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout (Navbar + footer)
│   │   ├── page.tsx         # Dashboard
│   │   ├── globals.css      # Tailwind + custom styles
│   │   ├── expenses/
│   │   │   ├── page.tsx     # Expenses list with filters
│   │   │   ├── new/page.tsx # Add new expense
│   │   │   └── [id]/edit/   # Edit existing expense
│   │   ├── borrowed/
│   │   │   └── page.tsx     # Borrowed money tracker
│   │   ├── reimbursements/
│   │   │   └── page.tsx     # Hubby reimbursements tracker
│   │   └── api/
│   │       ├── dashboard/   # GET dashboard stats
│   │       ├── expenses/    # GET/POST expenses; PUT/DELETE by ID
│   │       │   └── [id]/
│   │       │       ├── repay/      # POST — mark borrowed as repaid
│   │       │       └── reimburse/ # POST — mark hubby as paid back
│   │       ├── funding-sources/   # GET/POST funding sources
│   │       └── export/            # GET CSV export
│   ├── components/
│   │   ├── Navbar.tsx        # Top navigation
│   │   ├── ExpenseForm.tsx   # Create/edit form
│   │   ├── ExpenseTable.tsx  # Expense list table
│   │   ├── StatusBadge.tsx   # Coloured status pills
│   │   └── DashboardCard.tsx # Stat card widget
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   └── utils.ts          # Formatting, validation, CSV helpers
│   └── types/
│       └── index.ts          # Shared TypeScript types + constants
├── .env                      # DATABASE_URL (SQLite path)
├── package.json
├── tailwind.config.ts        # Custom colour palette
└── tsconfig.json
```

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
# Run the Prisma migration (creates the SQLite database + tables)
npm run db:migrate

# Seed with default funding sources and sample expenses
npm run db:seed
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## All Available Commands

| Command            | Description                                   |
|--------------------|-----------------------------------------------|
| `npm run dev`      | Start development server on port 3000         |
| `npm run build`    | Build for production                          |
| `npm run start`    | Run the production build                      |
| `npm run db:migrate` | Create/update the database schema           |
| `npm run db:seed`  | Populate the database with sample data        |
| `npm run db:studio`| Open Prisma Studio (visual DB browser)       |
| `npm run db:reset` | Reset database and re-seed from scratch       |

---

## How the Loan / Reimbursement Logic Works

### Borrowed Money

1. When you create an expense and select **"Borrowed money"** as the funds type,
   the system automatically sets `borrowedStatus = "OUTSTANDING"`.
2. The expense appears in the **Borrowed Money** page and the dashboard summary.
3. When you repay the money, click **"Mark Repaid"**.
   The system sets `borrowedStatus = "REPAID"` and records today's date as `repaidDate`.
4. Repaid items move to the "settled" section and are no longer counted in the outstanding total.

### Hubby Reimbursements

1. When you create an expense and select **"Hubby"** as who it's for,
   the system automatically sets `reimbursementStatus = "OWES_ME"`.
2. The expense appears in the **Reimbursements** page and the dashboard summary.
3. When hubby pays you back, click **"Paid Back"**.
   The system sets `reimbursementStatus = "PAID_BACK"` and records `reimbursementDate`.
4. Settled items move to the "paid back" section and are no longer counted in the owed total.

### Edge Case: Both Apply

An expense can be **both** borrowed AND for hubby (e.g. you borrowed money to pay for his prescription).
In that case, both statuses are tracked independently — you'll need to repay the loan AND receive reimbursement from hubby.

---

## Adding More Funding Sources

By default the app ships with:
- **Personal** — your own personal money
- **House** — joint household account
- **Loan from Hubby** — money borrowed from your husband

To add more, either:
- Use Prisma Studio: `npm run db:studio` → FundingSource → Add record
- Or call the API: `POST /api/funding-sources` with `{ "name": "My New Source" }`
- Or add entries directly to `prisma/seed.ts` and re-run `npm run db:seed`

---

## Tech Stack

| Technology  | Version | Purpose                   |
|-------------|---------|---------------------------|
| Next.js     | 14      | Framework (App Router)    |
| Prisma      | 5       | ORM / database access     |
| SQLite      | —       | Local database (via Prisma)|
| Tailwind CSS| 3       | Styling                   |
| TypeScript  | 5       | Type safety               |
