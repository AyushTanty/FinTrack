/**
 * retrievalService.js
 *
 * Retrieves only the minimum relevant financial data needed to answer
 * a specific AI question. Every function uses aggregates over raw records
 * wherever possible to keep context small and API cost low.
 *
 * RULES:
 * - Prefer aggregate/sum queries over returning raw transaction lists
 * - Hard cap: never return more than 50 records in any single call
 * - Never dump the entire database for any intent
 */

const prisma = require('../../utils/prisma');
const { getMonthStart, getMonthEnd, getDaysRemainingInMonth } = require('../../utils/dateHelpers');
const { getTotalBalance } = require('../balanceService');

const MAX_RECORDS = 50;

// ---------------------------------------------------------------------------
// SPENDING_INTENT — aggregated totals by category, not raw rows
// ---------------------------------------------------------------------------
async function getSpendingSummary(userId, month, year) {
  try {
    const start = getMonthStart(month, year);
    const end = getMonthEnd(month, year);

    // Aggregate total spent
    const totalAgg = await prisma.expense.aggregate({
      where: { userId, date: { gte: start, lte: end }, deletedAt: null },
      _sum: { amount: true },
      _count: true
    });
    const totalSpent = Number(totalAgg._sum.amount || 0);
    const transactionCount = totalAgg._count;

    // Group by category — use groupBy for efficiency
    const grouped = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: start, lte: end }, deletedAt: null },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: MAX_RECORDS
    });

    // Fetch category names for the IDs
    const categoryIds = grouped.map(g => g.categoryId).filter(Boolean);
    const categories = categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, color: true }
        })
      : [];

    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c; });

    const byCategory = grouped.map(g => ({
      name: catMap[g.categoryId]?.name || 'Uncategorized',
      color: catMap[g.categoryId]?.color || '#94a3b8',
      amount: Number(g._sum.amount || 0)
    }));

    const topCategory = byCategory.length > 0 ? byCategory[0] : null;

    return { totalSpent, transactionCount, byCategory, topCategory };
  } catch (err) {
    console.error('[retrievalService.getSpendingSummary]', err.message);
    return { totalSpent: 0, transactionCount: 0, byCategory: [], topCategory: null };
  }
}

// ---------------------------------------------------------------------------
// INCOME_INTENT — aggregated by source
// ---------------------------------------------------------------------------
async function getIncomeSummary(userId, month, year) {
  try {
    const start = getMonthStart(month, year);
    const end = getMonthEnd(month, year);

    const agg = await prisma.income.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true }
    });
    const totalIncome = Number(agg._sum.amount || 0);

    const grouped = await prisma.income.groupBy({
      by: ['source'],
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    });

    const sources = grouped.map(g => ({
      source: g.source,
      amount: Number(g._sum.amount || 0)
    }));

    return { totalIncome, sources };
  } catch (err) {
    console.error('[retrievalService.getIncomeSummary]', err.message);
    return { totalIncome: 0, sources: [] };
  }
}

// ---------------------------------------------------------------------------
// BUDGET_INTENT — budget vs actual per category (aggregated)
// ---------------------------------------------------------------------------
async function getBudgetStatus(userId, month, year) {
  try {
    const start = getMonthStart(month, year);
    const end = getMonthEnd(month, year);

    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: { select: { id: true, name: true } } },
      take: MAX_RECORDS
    });

    if (budgets.length === 0) return [];

    // Aggregate actual spending per category in one query
    const categoryIds = budgets.map(b => b.categoryId);
    const actuals = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        categoryId: { in: categoryIds },
        date: { gte: start, lte: end },
        deletedAt: null
      },
      _sum: { amount: true }
    });

    const actualMap = {};
    actuals.forEach(a => { actualMap[a.categoryId] = Number(a._sum.amount || 0); });

    return budgets.map(b => {
      const budgeted = Number(b.amount);
      const actual = actualMap[b.categoryId] || 0;
      return {
        categoryName: b.category?.name || 'Unknown',
        budgeted,
        actual,
        remaining: budgeted - actual,
        overBudget: actual > budgeted
      };
    });
  } catch (err) {
    console.error('[retrievalService.getBudgetStatus]', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// BILL_INTENT — upcoming recurring bills + subscriptions due this month
// ---------------------------------------------------------------------------
async function getUpcomingBills(userId, month, year) {
  try {
    const start = getMonthStart(month, year);
    const end = getMonthEnd(month, year);

    const [recurrings, subscriptions] = await Promise.all([
      prisma.recurringExpense.findMany({
        where: { userId, isActive: true },
        select: { name: true, amount: true, dayOfMonth: true },
        take: MAX_RECORDS
      }),
      prisma.subscription.findMany({
        where: { userId, isActive: true, nextBillingDate: { gte: start, lte: end } },
        select: { name: true, amount: true, nextBillingDate: true },
        take: MAX_RECORDS
      })
    ]);

    const bills = [];

    // For recurring expenses, compute the due date from dayOfMonth
    recurrings.forEach(r => {
      try {
        const dueDate = new Date(year, month - 1, r.dayOfMonth);
        if (dueDate >= start && dueDate <= end) {
          bills.push({
            name: r.name,
            amount: Number(r.amount),
            dueDate: dueDate.toISOString().split('T')[0]
          });
        }
      } catch (_) {}
    });

    subscriptions.forEach(s => {
      bills.push({
        name: s.name,
        amount: Number(s.amount),
        dueDate: s.nextBillingDate
          ? new Date(s.nextBillingDate).toISOString().split('T')[0]
          : 'this month'
      });
    });

    return bills;
  } catch (err) {
    console.error('[retrievalService.getUpcomingBills]', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// SUBSCRIPTION_INTENT — active subscriptions list
// ---------------------------------------------------------------------------
async function getSubscriptions(userId) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, isActive: true },
      select: { name: true, type: true, amount: true, billingCycle: true, nextBillingDate: true },
      orderBy: { amount: 'desc' },
      take: MAX_RECORDS
    });

    return subscriptions.map(s => ({
      name: s.name,
      type: s.type,
      amount: Number(s.amount),
      billingCycle: s.billingCycle,
      nextBillingDate: s.nextBillingDate
        ? new Date(s.nextBillingDate).toISOString().split('T')[0]
        : null
    }));
  } catch (err) {
    console.error('[retrievalService.getSubscriptions]', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// SAVINGS_INTENT — savings goals with progress
// ---------------------------------------------------------------------------
async function getSavingsGoals(userId) {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { name: true, targetAmount: true, currentAmount: true, targetDate: true },
      take: 20
    });

    return goals.map(g => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      return {
        name: g.name,
        targetAmount: target,
        currentAmount: current,
        remaining: target - current,
        progress: target > 0 ? Math.round((current / target) * 100) : 0,
        targetDate: g.targetDate ? new Date(g.targetDate).toISOString().split('T')[0] : null
      };
    });
  } catch (err) {
    console.error('[retrievalService.getSavingsGoals]', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// BALANCE_INTENT — uses existing TAM calculation (no duplication)
// ---------------------------------------------------------------------------
async function getAvailableMoney(userId, month, year) {
  try {
    const end = getMonthEnd(month, year);
    const daysRemaining = getDaysRemainingInMonth(month, year);

    // Use the existing balance service — no duplicate logic
    const totalBalance = await getTotalBalance(userId);

    const upcomingBills = await getUpcomingBills(userId, month, year);
    const upcomingTotal = upcomingBills.reduce((s, b) => s + b.amount, 0);

    const plannedAgg = await prisma.plannedPurchase.aggregate({
      where: { userId, status: 'PLANNED', expectedDate: { lte: end } },
      _sum: { expectedAmount: true }
    });
    const plannedTotal = Number(plannedAgg._sum.expectedAmount || 0);

    const plan = await prisma.monthlyPlan.findUnique({
      where: { userId_month_year: { userId, month, year } },
      select: { savingsAllocation: true, emergencyBuffer: true }
    });
    const savingsAlloc = Number(plan?.savingsAllocation || 0);
    const emergencyBuffer = Number(plan?.emergencyBuffer || 0);

    const tam = totalBalance.toNumber() - upcomingTotal - plannedTotal - savingsAlloc - emergencyBuffer;
    const safeDailyBudget = daysRemaining > 0 && tam > 0 ? Math.floor(tam / daysRemaining) : 0;

    return {
      totalBalance: totalBalance.toNumber(),
      upcomingObligations: upcomingTotal,
      plannedPurchases: plannedTotal,
      savingsAllocation: savingsAlloc,
      emergencyBuffer,
      tam,
      safeDailyBudget,
      daysRemaining
    };
  } catch (err) {
    console.error('[retrievalService.getAvailableMoney]', err.message);
    return { totalBalance: 0, tam: 0, safeDailyBudget: 0, daysRemaining: 0 };
  }
}

// ---------------------------------------------------------------------------
// PURCHASE_INTENT — planned purchases (PLANNED status only)
// ---------------------------------------------------------------------------
async function getPlannedPurchases(userId) {
  try {
    const purchases = await prisma.plannedPurchase.findMany({
      where: { userId, status: 'PLANNED' },
      select: { name: true, expectedAmount: true, expectedDate: true, priority: true },
      orderBy: { expectedDate: 'asc' },
      take: 20
    });

    return purchases.map(p => ({
      name: p.name,
      expectedAmount: Number(p.expectedAmount),
      expectedDate: p.expectedDate
        ? new Date(p.expectedDate).toISOString().split('T')[0]
        : null,
      priority: p.priority
    }));
  } catch (err) {
    console.error('[retrievalService.getPlannedPurchases]', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// ACCOUNT_INTENT — account balances (computed on read via balanceService)
// ---------------------------------------------------------------------------
async function getAccounts(userId) {
  try {
    const { getAccountBalance } = require('../balanceService');

    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, type: true, initialBalance: true }
    });

    const withBalances = await Promise.all(
      accounts.map(async a => {
        try {
          const balance = await getAccountBalance(a.id);
          return { name: a.name, type: a.type, balance: balance.toNumber() };
        } catch (_) {
          return { name: a.name, type: a.type, balance: Number(a.initialBalance) };
        }
      })
    );

    return withBalances;
  } catch (err) {
    console.error('[retrievalService.getAccounts]', err.message);
    return [];
  }
}

module.exports = {
  getSpendingSummary,
  getIncomeSummary,
  getBudgetStatus,
  getUpcomingBills,
  getSubscriptions,
  getSavingsGoals,
  getAvailableMoney,
  getPlannedPurchases,
  getAccounts
};
