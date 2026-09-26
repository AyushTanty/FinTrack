const prisma = require('../utils/prisma');
const { getMonthStart, getMonthEnd } = require('../utils/dateHelpers');
const Decimal = require('decimal.js');

async function getBudgetVsActual(userId, month, year) {
  const start = getMonthStart(month, year);
  const end = getMonthEnd(month, year);

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true }
  });

  const expenses = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      deletedAt: null,
      date: { gte: start, lte: end }
    },
    _sum: { amount: true }
  });

  const expenseMap = {};
  for (const exp of expenses) {
    expenseMap[exp.categoryId] = new Decimal(exp._sum.amount || 0);
  }

  return budgets.map(b => ({
    categoryId: b.categoryId,
    categoryName: b.category.name,
    budgeted: new Decimal(b.amount),
    actual: expenseMap[b.categoryId] || new Decimal(0)
  }));
}

module.exports = { getBudgetVsActual };
