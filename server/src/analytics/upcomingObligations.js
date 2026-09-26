const prisma = require('../utils/prisma');
const Decimal = require('decimal.js');
const { getMonthStart, getMonthEnd } = require('../utils/dateHelpers');

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return 'st';
    case 2:  return 'nd';
    case 3:  return 'rd';
    default: return 'th';
  }
}

async function getUpcomingObligations(userId, month, year) {
  const monthStart = getMonthStart(month, year);
  const monthEnd = getMonthEnd(month, year);

  // 1. Recurring expenses with no matching paid Expense for this month
  const recurrings = await prisma.recurringExpense.findMany({
    where: { userId, isActive: true },
    include: {
      category: true,
      expenses: {
        where: {
          date: { gte: monthStart, lte: monthEnd },
          deletedAt: null
        }
      }
    }
  });

  let recurringTotal = new Decimal(0);
  const details = [];

  for (const r of recurrings) {
    // Only include if NOT yet paid (no expense row this month)
    if (r.expenses.length === 0) {
      const amount = new Decimal(r.amount);
      recurringTotal = recurringTotal.plus(amount);
      details.push({
        id: r.id,
        name: r.name,
        category: r.category?.name || 'Fixed Bill',
        amount: amount.toNumber(),
        dueDay: r.dayOfMonth,
        dueText: `due ${r.dayOfMonth}${getOrdinalSuffix(r.dayOfMonth)}`,
        frequency: r.frequency,
        type: 'RECURRING'
      });
    }
  }

  // 2. Subscriptions with nextBillingDate <= monthEnd and no paid Expense this month
  const subs = await prisma.subscription.findMany({
    where: {
      userId,
      isActive: true,
      nextBillingDate: {
        lte: monthEnd
      }
    },
    include: {
      expenses: {
        where: {
          date: { gte: monthStart, lte: monthEnd },
          deletedAt: null
        }
      }
    }
  });

  let subsTotal = new Decimal(0);
  for (const s of subs) {
    // Only include if NOT yet paid (no expense row this month)
    if (s.expenses.length === 0) {
      const amount = new Decimal(s.amount);
      subsTotal = subsTotal.plus(amount);
      const billingDateStr = s.nextBillingDate 
        ? new Date(s.nextBillingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) 
        : 'This month';
      details.push({
        id: s.id,
        name: s.name,
        category: 'Subscription',
        amount: amount.toNumber(),
        billingDate: s.nextBillingDate,
        dueText: `due ${billingDateStr}`,
        type: 'SUBSCRIPTION'
      });
    }
  }

  return {
    total: recurringTotal.plus(subsTotal),
    details
  };
}

async function getUpcomingObligationsTotal(userId, month, year) {
  const result = await getUpcomingObligations(userId, month, year);
  return result.total;
}

module.exports = { getUpcomingObligations, getUpcomingObligationsTotal };
