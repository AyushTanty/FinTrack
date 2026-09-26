const prisma = require('../utils/prisma');

async function createExpense(userId, data) {
  let accountId = data.accountId;
  if (!accountId) {
    const defaultAcc = await prisma.account.findFirst({
      where: { userId, isDefault: true }
    }) || await prisma.account.findFirst({
      where: { userId }
    });
    if (defaultAcc) accountId = defaultAcc.id;
  }

  const expense = await prisma.expense.create({
    data: {
      userId,
      accountId,
      categoryId: data.categoryId,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      paymentMethod: data.paymentMethod,
      notes: data.notes
    }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entity: 'Expense',
      entityId: expense.id,
      action: 'CREATED',
      after: expense
    }
  });

  return expense;
}

async function listExpenses(userId, { month, year, categoryId, paymentMethod, page = 1, limit = 50 }) {
  const where = { userId, deletedAt: null };
  
  if (month && year) {
    where.date = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1)
    };
  }
  if (categoryId) where.categoryId = categoryId;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  return prisma.expense.findMany({
    where,
    skip: (page - 1) * limit,
    take: Number(limit),
    orderBy: { date: 'desc' },
    include: { category: true, account: true }
  });
}

async function updateExpense(userId, id, data) {
  const expense = await prisma.expense.findFirst({ where: { id, userId, deletedAt: null } });
  if (!expense) throw new Error('Expense not found');

  const updateData = {};
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.accountId !== undefined) updateData.accountId = data.accountId;

  const updated = await prisma.expense.update({
    where: { id },
    data: updateData
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entity: 'Expense',
      entityId: updated.id,
      action: 'UPDATED',
      before: expense,
      after: updated
    }
  });

  return updated;
}

async function deleteExpense(userId, id) {
  const expense = await prisma.expense.findFirst({ where: { id, userId, deletedAt: null } });
  if (!expense) throw new Error('Expense not found');

  const deleted = await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      entity: 'Expense',
      entityId: expense.id,
      action: 'DELETED',
      before: expense
    }
  });

  return deleted;
}

module.exports = { createExpense, listExpenses, updateExpense, deleteExpense };

