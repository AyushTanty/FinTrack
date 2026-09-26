const prisma = require('../utils/prisma');
const { getMonthStart, getMonthEnd } = require('../utils/dateHelpers');
const Decimal = require('decimal.js');

async function getCostOfLiving(userId, month, year) {
  const start = getMonthStart(month, year);
  const end = getMonthEnd(month, year);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      deletedAt: null,
      date: { gte: start, lte: end }
    },
    include: { category: true }
  });

  let fixed = new Decimal(0);
  let variable = new Decimal(0);
  let discretionary = new Decimal(0);

  for (const exp of expenses) {
    const amount = new Decimal(exp.amount);
    if (exp.category.type === 'FIXED') fixed = fixed.plus(amount);
    else if (exp.category.type === 'VARIABLE') variable = variable.plus(amount);
    else if (exp.category.type === 'DISCRETIONARY') discretionary = discretionary.plus(amount);
  }

  return { fixed, variable, discretionary };
}

module.exports = { getCostOfLiving };
