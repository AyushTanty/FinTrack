const prisma = require('../utils/prisma');
const Decimal = require('decimal.js');

async function getSavingsProgress(userId) {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId }
  });

  return goals.map(g => {
    const current = new Decimal(g.currentAmount);
    const target = new Decimal(g.targetAmount);
    const progress = target.gt(0) ? current.dividedBy(target).times(100).toNumber() : 100;
    
    // Simplistic projected completion
    const monthly = new Decimal(g.monthlyContribution);
    let projectedMonths = null;
    if (monthly.gt(0) && current.lt(target)) {
      projectedMonths = target.minus(current).dividedBy(monthly).ceil().toNumber();
    }

    return {
      ...g,
      progressPercentage: progress,
      projectedCompletionMonths: projectedMonths
    };
  });
}

module.exports = { getSavingsProgress };
