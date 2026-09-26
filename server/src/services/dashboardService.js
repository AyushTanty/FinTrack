const { calculateTrueAvailableMoney } = require('../analytics/tamCalc');
const { calculateSafeDailyBudget } = require('../analytics/dailyBudgetCalc');
const { getUpcomingObligations } = require('../analytics/upcomingObligations');
const { getBudgetVsActual } = require('../analytics/budgetVsActual');
const { getCostOfLiving } = require('../analytics/costOfLiving');
const { getTotalBalance } = require('./balanceService');
const { getMonthStart, getMonthEnd, getDaysRemainingInMonth } = require('../utils/dateHelpers');
const prisma = require('../utils/prisma');
const Decimal = require('decimal.js');

async function getDashboardData(userId, month, year) {
  const start = getMonthStart(month, year);
  const end = getMonthEnd(month, year);

  // 1. Total Balance across all accounts (computed on read)
  const totalBalance = await getTotalBalance(userId);

  // 2. Upcoming obligations (unpaid recurring + subscriptions due this month)
  const upcomingData = await getUpcomingObligations(userId, month, year);
  const upcomingTotal = upcomingData.total;

  // 3. Planned purchases for this month (status = PLANNED, expectedDate in this month)
  const plannedListRaw = await prisma.plannedPurchase.findMany({
    where: {
      userId,
      status: 'PLANNED',
      expectedDate: { gte: start, lte: end }
    },
    include: { category: true },
    orderBy: { expectedDate: 'asc' }
  });

  let plannedTotal = new Decimal(0);
  const plannedList = [];
  for (const p of plannedListRaw) {
    const pAmt = new Decimal(p.expectedAmount);
    plannedTotal = plannedTotal.plus(pAmt);
    const dateStr = p.expectedDate ? new Date(p.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'This month';
    plannedList.push({
      id: p.id,
      name: p.name,
      amount: pAmt.toNumber(),
      expectedDate: p.expectedDate,
      dueText: `expected ${dateStr}`,
      category: p.category?.name || 'Planned'
    });
  }

  // 4. Monthly Plan & Savings Goals (savings allocation & emergency buffer)
  const plan = await prisma.monthlyPlan.findUnique({
    where: { userId_month_year: { userId, month, year } }
  });
  let savingsAllocation = new Decimal(plan?.savingsAllocation || 0);
  const emergencyBuffer = new Decimal(plan?.emergencyBuffer || 0);

  // Check active savings goals monthly contribution targets
  const activeGoals = await prisma.savingsGoal.findMany({
    where: { userId, status: 'ACTIVE' }
  });
  let goalsCommittedTotal = new Decimal(0);
  for (const g of activeGoals) {
    if (g.monthlyContribution) {
      goalsCommittedTotal = goalsCommittedTotal.plus(new Decimal(g.monthlyContribution));
    }
  }

  // Also check actual savings contributions made this month
  const contributionsAgg = await prisma.savingsContribution.aggregate({
    where: {
      goal: { userId },
      date: { gte: start, lte: end }
    },
    _sum: { amount: true }
  });
  const actualSavedThisMonth = new Decimal(contributionsAgg._sum.amount || 0);

  // If monthly plan savings allocation is 0, use goals target or actual saved
  let committedSavings = savingsAllocation;
  if (committedSavings.eq(0)) {
    if (goalsCommittedTotal.gt(0)) {
      committedSavings = goalsCommittedTotal;
    } else if (actualSavedThisMonth.gt(0)) {
      committedSavings = actualSavedThisMonth;
    }
  }

  // 5. True Available Money (TAM)
  const tam = totalBalance
    .minus(upcomingTotal)
    .minus(plannedTotal)
    .minus(committedSavings)
    .minus(emergencyBuffer);

  // 6. Safe Daily Budget (SDB)
  const daysRemaining = getDaysRemainingInMonth(month, year);
  const safeDailyBudget = tam.gt(0) ? tam.dividedBy(daysRemaining).floor() : new Decimal(0);

  // 7. Income this month
  const incomeAgg = await prisma.income.aggregate({
    where: {
      userId,
      date: { gte: start, lte: end }
    },
    _sum: { amount: true }
  });
  const totalIncome = new Decimal(incomeAgg._sum.amount || 0);

  // 8. Spending this month
  const expenseAgg = await prisma.expense.aggregate({
    where: {
      userId,
      deletedAt: null,
      date: { gte: start, lte: end }
    },
    _sum: { amount: true }
  });
  const totalSpent = new Decimal(expenseAgg._sum.amount || 0);

  // 9. Cost of Living Breakdown
  const col = await getCostOfLiving(userId, month, year);

  // 10. Budget vs Actual mini status
  const budgetStatusRaw = await getBudgetVsActual(userId, month, year);
  const budgetStatus = budgetStatusRaw.map(b => ({
    categoryId: b.categoryId,
    name: b.categoryName,
    budgeted: b.budgeted.toNumber(),
    actual: b.actual.toNumber(),
    remaining: b.budgeted.minus(b.actual).toNumber(),
    percent: b.budgeted.gt(0) 
      ? Math.min(100, Math.round(b.actual.dividedBy(b.budgeted).toNumber() * 100))
      : 0
  }));

  // 11. Category Breakdown for chart
  const categoriesRaw = await prisma.expense.findMany({
    where: {
      userId,
      deletedAt: null,
      date: { gte: start, lte: end }
    },
    include: { category: true }
  });
  const catMap = {};
  for (const exp of categoriesRaw) {
    const cName = exp.category?.name || 'Other';
    const cColor = exp.category?.color || '#94a3b8';
    if (!catMap[cName]) catMap[cName] = { name: cName, value: 0, color: cColor };
    catMap[cName].value += Number(exp.amount);
  }
  const categories = Object.values(catMap);

  // 12. Monthly Trend (last 3 months)
  const trend = [];
  for (let i = 2; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const mStart = getMonthStart(m, y);
    const mEnd = getMonthEnd(m, y);

    const mSpentAgg = await prisma.expense.aggregate({
      where: {
        userId,
        deletedAt: null,
        date: { gte: mStart, lte: mEnd }
      },
      _sum: { amount: true }
    });

    const mIncomeAgg = await prisma.income.aggregate({
      where: {
        userId,
        date: { gte: mStart, lte: mEnd }
      },
      _sum: { amount: true }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    trend.push({
      month: m,
      year: y,
      name: `${monthNames[m - 1]} ${y}`,
      spent: Number(mSpentAgg._sum.amount || 0),
      income: Number(mIncomeAgg._sum.amount || 0)
    });
  }

  return {
    summary: {
      income: totalIncome.toNumber(),
      spent: totalSpent.toNumber(),
      savings: committedSavings.toNumber(),
      actualSaved: actualSavedThisMonth.toNumber(),
      balance: totalBalance.toNumber(),
      fixedExpenses: col.fixed.toNumber(),
      variableExpenses: col.variable.toNumber(),
      discretionaryExpenses: col.discretionary.toNumber()
    },
    trueAvailableMoney: tam.toNumber(),
    safeDailyBudget: safeDailyBudget.toNumber(),
    daysRemaining,
    upcomingObligations: upcomingTotal.toNumber(),
    upcomingObligationsDetail: upcomingData.details,
    plannedPurchasesTotal: plannedTotal.toNumber(),
    tamBreakdown: {
      totalBalance: totalBalance.toNumber(),
      savingsAllocation: committedSavings.toNumber(),
      emergencyBuffer: emergencyBuffer.toNumber(),
      upcomingObligations: upcomingTotal.toNumber(),
      upcomingList: upcomingData.details,
      plannedPurchases: plannedTotal.toNumber(),
      plannedList: plannedList,
      remainingPool: tam.toNumber(),
      daysRemaining,
      safeDailyBudget: safeDailyBudget.toNumber()
    },
    budgetStatus,
    trend,
    categories
  };
}

module.exports = { getDashboardData };
