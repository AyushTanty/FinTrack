const prisma = require('../utils/prisma');

async function upsertBudget(userId, data) {
  return prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year
      }
    },
    update: { amount: data.amount },
    create: {
      userId,
      categoryId: data.categoryId,
      month: data.month,
      year: data.year,
      amount: data.amount
    }
  });
}

async function updateBudget(userId, id, data) {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Budget not found');

  return prisma.budget.update({
    where: { id },
    data
  });
}

async function listBudgets(userId, month, year) {
  return prisma.budget.findMany({
    where: { userId, month: parseInt(month), year: parseInt(year) }
  });
}

module.exports = { upsertBudget, updateBudget, listBudgets };
