const prisma = require('../utils/prisma');

async function createIncome(userId, data) {
  let accountId = data.accountId;
  if (!accountId) {
    const defaultAcc = await prisma.account.findFirst({
      where: { userId, isDefault: true }
    }) || await prisma.account.findFirst({
      where: { userId }
    });
    if (defaultAcc) accountId = defaultAcc.id;
  }

  return prisma.income.create({
    data: {
      userId,
      accountId,
      source: data.source,
      type: data.type,
      amount: data.amount,
      date: new Date(data.date),
      isRecurring: data.isRecurring,
      notes: data.notes
    }
  });
}

async function listIncome(userId, { month, year, type, page = 1, limit = 50 }) {
  const where = { userId };
  if (month && year) {
    where.date = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1)
    };
  }
  if (type) where.type = type;

  return prisma.income.findMany({
    where,
    skip: (page - 1) * limit,
    take: Number(limit),
    orderBy: { date: 'desc' },
    include: { account: true }
  });
}

async function updateIncome(userId, id, data) {
  const income = await prisma.income.findFirst({ where: { id, userId } });
  if (!income) throw new Error('Income not found');

  const updateData = { ...data };
  if (updateData.date) updateData.date = new Date(updateData.date);

  return prisma.income.update({
    where: { id },
    data: updateData
  });
}

async function deleteIncome(userId, id) {
  const income = await prisma.income.findFirst({ where: { id, userId } });
  if (!income) throw new Error('Income not found');

  return prisma.income.delete({
    where: { id }
  });
}

module.exports = { createIncome, addIncome: createIncome, listIncome, updateIncome, deleteIncome };

