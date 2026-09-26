const prisma = require('../utils/prisma');
const Decimal = require('decimal.js');

async function calculateAccountBalance(accountId) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return new Decimal(0);

  const incomes = await prisma.income.aggregate({
    where: { accountId },
    _sum: { amount: true }
  });

  const expenses = await prisma.expense.aggregate({
    where: { accountId, deletedAt: null },
    _sum: { amount: true }
  });

  const initial = new Decimal(account.initialBalance || 0);
  const inc = new Decimal(incomes._sum.amount || 0);
  const exp = new Decimal(expenses._sum.amount || 0);

  return initial.plus(inc).minus(exp);
}

async function calculateTotalBalance(userId) {
  const accounts = await prisma.account.findMany({ where: { userId } });
  let initialTotal = new Decimal(0);
  for (const acc of accounts) {
    initialTotal = initialTotal.plus(new Decimal(acc.initialBalance || 0));
  }

  const incomes = await prisma.income.aggregate({
    where: { userId },
    _sum: { amount: true }
  });

  const expenses = await prisma.expense.aggregate({
    where: { userId, deletedAt: null },
    _sum: { amount: true }
  });

  const inc = new Decimal(incomes._sum.amount || 0);
  const exp = new Decimal(expenses._sum.amount || 0);

  return initialTotal.plus(inc).minus(exp);
}

module.exports = { calculateAccountBalance, calculateTotalBalance };

