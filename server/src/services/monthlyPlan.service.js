const prisma = require('../utils/prisma');

async function rolloverPlan(userId, planId, allocations) {
  const plan = await prisma.monthlyPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error('Plan not found');
  if (plan.isRolledOver) throw { status: 409, message: 'Plan already rolled over' };

  let totalRolled = 0;
  
  for (const alloc of allocations) {
    if (alloc.destination === 'next_month') {
      const nextMonth = plan.month === 12 ? 1 : plan.month + 1;
      const nextYear = plan.month === 12 ? plan.year + 1 : plan.year;
      
      await prisma.monthlyPlan.upsert({
        where: { userId_month_year: { userId, month: nextMonth, year: nextYear } },
        update: { plannedIncome: { increment: alloc.amount } },
        create: {
          userId,
          month: nextMonth,
          year: nextYear,
          plannedIncome: alloc.amount
        }
      });
    } else if (alloc.destination === 'savings' && alloc.goalId) {
      await prisma.savingsGoal.update({
        where: { id: alloc.goalId },
        data: { currentAmount: { increment: alloc.amount } }
      });
      await prisma.savingsContribution.create({
        data: { goalId: alloc.goalId, amount: alloc.amount, date: new Date() }
      });
    }
    totalRolled += alloc.amount;
  }

  const updated = await prisma.monthlyPlan.update({
    where: { id: planId },
    data: { isRolledOver: true, rolloverAmount: totalRolled }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entity: 'MonthlyPlan',
      entityId: planId,
      action: 'ROLLED_OVER',
      after: updated
    }
  });

  return updated;
}

module.exports = { rolloverPlan };
