const prisma = require('../utils/prisma');
const Decimal = require('decimal.js');
const { calculateTotalBalance } = require('./balanceCalc');
const { getUpcomingObligationsTotal } = require('./upcomingObligations');
const { getMonthStart, getMonthEnd } = require('../utils/dateHelpers');

async function calculateTrueAvailableMoney(userId, month, year) {
  const totalBalance = await calculateTotalBalance(userId);
  const upcomingObligations = await getUpcomingObligationsTotal(userId, month, year);
  
  const monthStart = getMonthStart(month, year);
  const monthEnd = getMonthEnd(month, year);

  const plannedPurchases = await prisma.plannedPurchase.aggregate({
    where: {
      userId,
      status: 'PLANNED',
      expectedDate: {
        lte: monthEnd
      }
    },
    _sum: { expectedAmount: true }
  });
  const plannedTotal = new Decimal(plannedPurchases._sum.expectedAmount || 0);

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

  return totalBalance
    .minus(upcomingObligations)
    .minus(plannedTotal)
    .minus(savingsAllocation)
    .minus(emergencyBuffer);
}

module.exports = { calculateTrueAvailableMoney };
