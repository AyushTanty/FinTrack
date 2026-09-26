# myBudget — Personal Cost of Living & Budget Management

> A private, production-grade personal financial command center designed exclusively for monthly budgeting, cost-of-living tracking, cash flow visibility, and deliberate financial stewardship.

---

## Table of Contents

1. [Executive Summary & Purpose](#executive-summary--purpose)
2. [Tech Stack](#tech-stack)
3. [Quiet Fiscal Clarity Design System](#quiet-fiscal-clarity-design-system)
4. [Core Financial Formulas](#core-financial-formulas)
5. [Feature Walkthrough](#feature-walkthrough)
   - [Dashboard / Today](#1-dashboard--today)
   - [Money Management](#2-money-management-income--accounts)
   - [Expense Tracking](#3-expense-tracking-daily-recurring--bills)
   - [Subscriptions & Flexible Services](#4-subscriptions--flexible-services)
   - [Planned Purchases & Impact Simulator](#5-planned-purchases--impact-simulator)
   - [Savings Goals](#6-savings-goals)
   - [Financial Reports](#7-financial-reports-recharts)
   - [Settings & Category Guardrails](#8-settings--category-guardrails)
   - [Audit Trail](#9-audit-trail)
   - [Global Quick Add](#10-global-quick-add)
   - [AI Financial Assistant](#11-ai-financial-assistant)
6. [API Documentation](#api-documentation)
7. [Database Schema & Prisma](#database-schema--prisma)
8. [Automated Cron Jobs](#automated-cron-jobs)
9. [Installation & Setup Guide](#installation--setup-guide)
10. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Executive Summary & Purpose

**myBudget** is built to solve a single problem with uncompromising precision: **honest personal cash flow management and cost-of-living tracking**. 

It eliminates dopamine-driven gamification, speculative crypto/investment tracking, and cluttered productivity widgets in favor of clean financial clarity. Every number in myBudget represents actual liquid reality:
- Currency is strictly in **Indian Rupee (₹)**.
- Dates and boundaries observe **Asia/Kolkata (IST)**.
- Account balances are **computed on read** from real transaction history, never stored as mutable cache columns.
- The **True Available Money (TAM)** model prevents the illusion of wealth by deducting upcoming fixed obligations, emergency reserves, and planned capital purchases before calculating what is safe to spend today.

---

## Tech Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Modular SPA architecture, React Router v6, Suspense code-splitting |
| **UI Framework** | React-Bootstrap + Bootstrap 5.3 | Dark theme (`data-bs-theme="dark"`), zero Tailwind CSS |
| **Typography** | Inter | OpenType tabular numbers (`tabular-nums slashed-zero`) |
| **Visualizations** | Recharts | SVG charts with dark-mode tooltips and cartesian grids |
| **Icons** | Lucide-React | Crisp, uniform vector stroke iconography |
| **Backend** | Node.js + Express.js | REST API, CommonJS architecture, route-level validation |
| **Database & ORM**| PostgreSQL + Prisma ORM | Relational models, CUID primary keys, Decimal(15,2) money math |
| **Precision Math** | decimal.js | Exact floating-point arithmetic for balances and ledger records |
| **Timezone / Dates**| date-fns + date-fns-tz | IST (`Asia/Kolkata`) month start/end boundaries |
| **Security & Auth**| bcrypt (cost 12), JWT | HttpOnly refresh cookie, in-memory access token, express-rate-limit |
| **Background Jobs**| node-cron | Automated billing & recurring transaction generation |
| **AI Assistant** | Groq API (`openai/gpt-oss-120b`) | Rule-based intent classifier, RAG financial retrieval, confirmation flow |

---

## Quiet Fiscal Clarity Design System

myBudget follows the **Quiet Fiscal Clarity** design system, designed for focused, low-glare financial stewardship.

### Dark Mode Palette Tokens

```css
--canvas-base:       #0F172A; /* Slate 900 — Root canvas */
--surface-card:      #1E293B; /* Slate 800 — Cards & Modals */
--surface-inset:     #182234; /* Darker inset table headers */
--surface-hover:     #24334A; /* Hover highlights */
--border-subtle:     #334155; /* Slate 700 — 1px structural dividers */
--accent-indigo:     #4F46E5; /* Indigo 600 — Primary action & focus */
--text-primary:      #F8FAFC; /* Slate 50 — Crisp primary typography */
--text-secondary:    #94A3B8; /* Slate 400 — Muted labels & captions */
--fiscal-income:     #10B981; /* Emerald 500 — Positive surplus/income */
--fiscal-warning:    #F59E0B; /* Amber 500 — Upcoming obligations/caps */
--fiscal-expense:    #EF4444; /* Coral Red 500 — Expenses & deficits */
```

### Numerical Typography Standard
All figures, currency totals, ledger rows, and table columns enforce tabular alignment:
```css
font-variant-numeric: tabular-nums slashed-zero;
font-feature-settings: "tnum" 1, "zero" 1;
```
This guarantees vertical decimal point alignment across table rows without horizontal character drift.

---

## Core Financial Formulas

### 1. Account Balance (Computed on Read)
```text
Account Balance = initialBalance 
                + SUM(Income.amount WHERE accountId = ID) 
                - SUM(Expense.amount WHERE accountId = ID AND deletedAt IS NULL)

Total Balance = SUM(all active Account Balances)
```

### 2. True Available Money (TAM)
```text
TAM = Total Balance 
    - Upcoming Obligations (Unpaid Recurring Bills + Subscriptions due this month)
    - Active Planned Purchases (Status = PLANNED, expectedDate <= End of Month)
    - Monthly Savings Allocation (from active MonthlyPlan)
    - Emergency Buffer Reserve (from active MonthlyPlan)
```

### 3. Safe Daily Budget (SDB)
```text
Days Remaining = Max(1, Total Days in Month - Today Day of Month + 1)
Safe Daily Budget = Floor(TAM / Days Remaining)   [0 if TAM <= 0]
```

---

## Feature Walkthrough

### 1. Dashboard / Today
- **4 Key Summary Cards**: Monthly Income, Total Spent (with fixed expense breakdown), Committed Savings, and Total Net Account Balance.
- **TAM Card**: Hero display of True Available Money with an expandable breakdown showing each deduction.
- **Safe Daily Budget Card**: Actionable daily spending allowance based on remaining days in the month.
- **Upcoming Obligations Mini-Table**: Lists unpaid recurring expenses and subscriptions due this month.
- **Budget vs Actual Status**: Real-time progress bars comparing actual spending against budget per category.
- **Monthly Spending Trend**: 6-month comparative line chart of Income vs. Expenses.
- **Category Donut Chart**: Proportional breakdown of spending across categories.

### 2. Money Management (Income & Accounts)
- **Accounts**: Overview of all Bank, UPI, Cash, and Wallet accounts with live computed balances.
- **Income Tracking**: Log income categorized by Salary, Freelance, One-time, or Recurring sources.
- **Account Filtering**: Inspect income streams per account and date range.

### 3. Expense Tracking (Daily, Recurring & Bills)
- **Daily Ledger**: Paginated list of expenses with date, category badge, description, amount, payment method (UPI, Cash, Card, Bank Transfer), and notes.
- **Filtering**: Instant filtering by Month, Year, Category, and Payment Method.
- **Signed Display Convention**: Expenses render as negative (`-₹350`) in coral red; income renders as positive (`+₹25,000`) in emerald green.
- **Recurring Expenses**: Manage monthly, quarterly, or yearly recurring obligations (Rent, Wi-Fi, Electricity) with automated generation on due dates.

### 4. Subscriptions & Flexible Services
- **Fixed Subscriptions**: Track OTT, Gym, Mobile, and Software memberships with billing cycles and next renewal dates.
- **Flexible Subscriptions**: Supports tiffin or meal subscriptions with a **Usage Calendar**.
  - Log daily statuses: `USED`, `SKIPPED`, `HOLIDAY`, `UNAVAILABLE`.
  - Configurable skip rules: `REFUND_PER_DAY`, `CREDIT_PER_DAY`, `CARRY_FORWARD`.

### 5. Planned Purchases & Impact Simulator
- **Purchase Priority**: Categorize upcoming purchases by `HIGH`, `MEDIUM`, or `LOW` priority.
- **Purchase Impact Simulator**: Test an expenditure before buying to preview its immediate effect on TAM and Safe Daily Budget.
- **Conversion to Expense**: Single-click conversion from `PLANNED` to an active `Expense` row once purchased.

### 6. Savings Goals
- **Goal Cards**: Track target amounts, current saved amounts, progress percentages, and projected completion dates.
- **Contributions**: Add dedicated deposits to goals with automatic audit logging.

### 7. Financial Reports (Recharts)
Seven analytical perspectives:
1. **Monthly Spending Trend**: Income vs. Expenses over 3, 6, or 12 months.
2. **Category Breakdown**: Proportional donut distribution.
3. **Budget vs. Actual**: Grouped comparative bar chart per category.
4. **Fixed vs. Variable**: Stacked area chart showing discretionary vs. mandatory expenses.
5. **Daily Spending**: Daily burn-rate bar chart for the month.
6. **Subscription Spending**: Annual cost trajectory of subscriptions.
7. **Cost of Living Breakdown**: Composite trend across Fixed, Variable, and Discretionary buckets.

### 8. Settings & Category Guardrails
- **Category Management**: Add, update, or remove spending categories with custom colors and icons.
- **Deletion Guardrails**: A category cannot be deleted if associated with existing expenses, recurring items, or budgets (returns `409 Conflict` with exact reference count).
- **Security**: Password update form and profile preference management.

### 9. Audit Trail
- System-wide immutable event log capturing `CREATED`, `UPDATED`, `DELETED`, and `CONVERTED` actions with before/after JSON snapshots.

### 10. Global Quick Add
- Accessible via the **`+ Add Transaction`** button in the desktop topbar, sidebar, or mobile header.
- Multi-tab modal allowing rapid entry of:
  - **Expense** (Default: 4-field speed entry)
  - **Income**
  - **Planned Purchase**
  - **Savings Contribution**

### 11. AI Financial Assistant
An isolated, optional financial copilot powered by **Groq (`openai/gpt-oss-120b`)**:
- **RAG Architecture**: Queries pull only minimal, aggregated context (spending summaries, TAM, upcoming bills) rather than whole database dumps.
- **Rule-Based Intent Classifier**: Zero redundant LLM calls; intents (`spending`, `income`, `available`, `bills`, `savings`, `purchase`) are resolved before context assembly.
- **Conversational Queries**: Instant answers to natural questions (*"How much did I spend this month?"*, *"What bills are due soon?"*).
- **Natural-Language Financial Actions**: Say *"I spent ₹350 on food today"* to parse the transaction into an interactive preview card.
- **Safety First**: The AI **never writes directly to the database**. All extracted actions require explicit user confirmation (**Confirm & Save**) in React state before execution.
- **Total Isolation**: If the AI API is unreachable or rate-limited, the core finance app continues operating at 100% speed.

---

## API Documentation

All responses follow the standardized envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Descriptive error message" }
```

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user, seed default categories & account |
| `POST` | `/api/auth/login` | Authenticate user, issue access token & refresh cookie |
| `POST` | `/api/auth/refresh` | Silent refresh of expired access token |
| `POST` | `/api/auth/logout` | Clear refresh cookie |

### Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Aggregated dashboard data (TAM, SDB, upcoming, summary) |
| `GET` | `/api/dashboard/tam` | Detailed True Available Money breakdown |

### Transactions & Money (`/api/expenses`, `/api/income`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/expenses` | Filtered expenses list with pagination |
| `POST` | `/api/expenses` | Record a new expense |
| `PUT` | `/api/expenses/:id` | Update an existing expense |
| `DELETE`| `/api/expenses/:id` | Soft delete expense (sets `deletedAt`) |
| `GET` | `/api/income` | List income entries |
| `POST` | `/api/income` | Record income entry |

### Subscriptions & Obligations (`/api/subscriptions`, `/api/recurring-expenses`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/subscriptions` | List active subscriptions |
| `POST` | `/api/subscriptions` | Create a new subscription |
| `GET` | `/api/subscriptions/:id/usage` | Fetch daily usage logs for flexible subscriptions |
| `POST` | `/api/subscriptions/:id/usage` | Record daily usage (`USED`, `SKIPPED`, etc.) |
| `GET` | `/api/recurring-expenses` | List recurring expense items |
| `POST` | `/api/recurring-expenses` | Add recurring obligation |

### Planned Purchases & Savings (`/api/planned-purchases`, `/api/savings`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/planned-purchases` | List planned items |
| `GET` | `/api/planned-purchases/simulate` | Simulate purchase impact on TAM/SDB |
| `POST` | `/api/planned-purchases/:id/convert`| Convert planned purchase to an active expense |
| `GET` | `/api/savings` | List savings goals with progress |
| `POST` | `/api/savings/:id/contributions` | Record contribution towards goal |

### AI Assistant (`/api/ai`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Send financial question or action command |
| `POST` | `/api/ai/action/confirm` | Execute a user-confirmed AI transaction |

---

## Database Schema & Prisma

The database schema is defined in `prisma/schema.prisma`. Key models include:

- **`User`**: Account owner profile, default currency (`INR`), timezone (`Asia/Kolkata`), emergency buffer.
- **`Account`**: Bank, UPI, Cash, Wallet instances storing `initialBalance`.
- **`Category`**: Fixed, Variable, Discretionary, or Savings categories.
- **`Expense`**: Expenditure records with soft delete (`deletedAt`), payment method, and optional links to subscriptions/recurring items.
- **`Income`**: Revenue records categorized by type (`SALARY`, `FREELANCE`, `ONE_TIME`).
- **`RecurringExpense`**: Fixed obligations with frequency (`MONTHLY`, `QUARTERLY`, `YEARLY`) and `dayOfMonth`.
- **`Subscription`**: Recurring memberships with `billingCycle`, flexible status, and skip rules.
- **`SubscriptionUsage`**: Daily usage ledger for flexible subscriptions (`USED`, `SKIPPED`, `HOLIDAY`).
- **`PlannedPurchase`**: Future intended buys with priority rating and status (`PLANNED`, `PURCHASED`, `DEFERRED`).
- **`SavingsGoal`**: Target funds with current savings amount, target completion date, and monthly contribution goals.
- **`SavingsContribution`**: Individual deposits linked to specific savings goals.
- **`AuditLog`**: Immutable activity trail recording `before` and `after` JSON snapshots.

---

## Automated Cron Jobs

Background workers run via `node-cron` observing IST timezone (`Asia/Kolkata`):

1. **Recurring Expense Worker** (`jobs/recurringExpenseJob.js`):
   - Runs daily at `00:01 IST`.
   - Checks active `RecurringExpense` entries matching the current day.
   - Automatically generates an `Expense` record if not already generated this period.
2. **Subscription Billing Worker** (`jobs/subscriptionBillingJob.js`):
   - Runs daily at `00:01 IST`.
   - Checks active subscriptions where `nextBillingDate <= today`.
   - Generates the matching `Expense` entry and advances `nextBillingDate` according to `billingCycle`.
3. **Monthly Plan Rollover Worker** (`jobs/monthlyPlanJob.js`):
   - Runs on the 1st of every month at `00:05 IST`.
   - Auto-creates the new month's plan seeding values from prior allocations.

---

## Installation & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher running on `localhost:5432`

### 2. Configure Environment Variables
Create or verify `server/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mybudget?schema=public
JWT_SECRET=your-secure-access-token-secret-32-chars
JWT_REFRESH_SECRET=your-secure-refresh-token-secret-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development


```

### 3. Database Initialization
From the repository root:
```powershell
npx prisma db push
```

### 4. Running the Application

Open two terminal sessions:

#### Terminal 1 — Backend API
```powershell
cd server
npm run dev
```
*API server runs at `http://localhost:5000`*

#### Terminal 2 — Frontend Client
```powershell
cd client
npm run dev
```
*Vite dev server runs at `http://localhost:5173`*

Open **`http://localhost:5173`** in your browser to sign in or create an account.

---

## Troubleshooting & FAQ

#### Q: Getting `429 Too Many Requests` on login or page refresh?
- The general rate limiter is configured to exempt localhost (`127.0.0.1`, `::1`) and `/health` requests with a generous ceiling of 5,000 requests per 15 minutes. If triggered during testing, restarting the server resets the in-memory window.

#### Q: How to switch the AI Provider?
- The AI service uses an OpenAI-compatible REST interface. You can switch from Groq to any OpenAI-compatible provider (e.g. OpenAI, DeepSeek, Local Ollama, vLLM) by adjusting `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` in `server/.env`. Dynamic environment reloading applies changes without restarting.

#### Q: Why do account balances update automatically when an expense is added?
- Account balances are never stored as static totals in the database. Every time an account balance is queried, `balanceService.js` computes the exact sum: `initialBalance + Incomes - Expenses`. This guarantees mathematical consistency.

#### Q: How do I backup my financial data?
- Standard PostgreSQL dumps capture all financial history:
  ```powershell
  pg_dump -U postgres -d mybudget > mybudget_backup.sql
  ```

---

*myBudget — Engineered for mindful, high-trust financial stewardship.*
