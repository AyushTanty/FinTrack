const Decimal = require('decimal.js');
const prisma = require('../utils/prisma');
const { calculateTotalBalance } = require('./balanceCalc');
const { getUpcomingObligationsTotal } = require('./upcomingObligations');
const { getMonthStart, getMonthEnd, getDaysRemainingInMonth } = require('../utils/dateHelpers');

/**
 * Calculates the day-aware Safe Daily Budget:
 * (Current Balance
 *  - Savings Allocation
 *  - Emergency Buffer
 *  - SUM of all unpaid RecurringExpense/Subscription amounts due this month
 *  - SUM of PlannedPurchase amounts with expectedDate this month)
 * divided by
 * (days remaining from today, inclusive, to end of current month)
 * 
 * Result is floored to a whole number and never negative.
 */
async function calculateSafeDailyBudget(userId, month, year) {
  // 1. Current Balance computed on read
  const totalBalance = await calculateTotalBalance(userId);

  const monthStart = getMonthStart(month, year);
  const monthEnd = getMonthEnd(month, year);

  // 2. Monthly Plan: Savings Allocation and Emergency Buffer reserved immediately in full
  const plan = await prisma.monthlyPlan.findUnique({
    where: { userId_month_year: { userId, month, year } }
  });
  let savingsAllocation = new Decimal(plan?.savingsAllocation || 0);
  if (savingsAllocation.eq(0)) {
    const activeGoals = await prisma.savingsGoal.findMany({
      where: { userId, status: 'ACTIVE' }
    });
    for (const g of activeGoals) {
      if (g.monthlyContribution) {
        savingsAllocation = savingsAllocation.plus(new Decimal(g.monthlyContribution));
      }
    }
    if (savingsAllocation.eq(0)) {
      const contributionsAgg = await prisma.savingsContribution.aggregate({
        where: {
          goal: { userId },
          date: { gte: monthStart, lte: monthEnd }
        },
        _sum: { amount: true }
      });
      savingsAllocation = new Decimal(contributionsAgg._sum.amount || 0);
    }
  }
  const emergencyBuffer = new Decimal(plan?.emergencyBuffer || 0);

  // 3. Upcoming Obligations due this month (unpaid recurring bills and subscriptions)
  const upcomingTotal = await getUpcomingObligationsTotal(userId, month, year);

  // 4. Planned Purchases with status PLANNED and expectedDate this month
  const plannedAgg = await prisma.plannedPurchase.aggregate({
    where: {
      userId,
      status: 'PLANNED',
      expectedDate: { gte: monthStart, lte: monthEnd }
    },
    _sum: { expectedAmount: true }
  });
  const plannedTotal = new Decimal(plannedAgg._sum.expectedAmount || 0);

  // 5. Remaining pool for the rest of the month
  const remainingPool = totalBalance
    .minus(savingsAllocation)
    .minus(emergencyBuffer)
    .minus(upcomingTotal)
    .minus(plannedTotal);

  if (remainingPool.lte(0)) {
    return new Decimal(0);
  }

  // 6. Days remaining from today, inclusive, to the end of the month
  const daysRemaining = getDaysRemainingInMonth(month, year);
  if (daysRemaining <= 0) {
    return new Decimal(0);
  }

  return remainingPool.dividedBy(daysRemaining).floor();
}

module.exports = { calculateSafeDailyBudget };
