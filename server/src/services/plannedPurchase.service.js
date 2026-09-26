const prisma = require('../utils/prisma');
const { log } = require('./audit.service');

async function createPurchase(userId, data) {
  return prisma.plannedPurchase.create({
    data: {
      userId,
      categoryId: data.categoryId,
      name: data.name,
      expectedAmount: data.expectedAmount,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      priority: data.priority,
      isRecurring: data.isRecurring,
      recurrence: data.recurrence,
      notes: data.notes
    }
  });
}

async function listPurchases(userId, status, priority) {
  const where = { userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  return prisma.plannedPurchase.findMany({ where });
}

async function updatePurchase(userId, id, data) {
  const purchase = await prisma.plannedPurchase.findFirst({ where: { id, userId } });
  if (!purchase) throw new Error('Planned purchase not found');

  const updateData = { ...data };
  if (updateData.expectedDate) updateData.expectedDate = new Date(updateData.expectedDate);

  return prisma.plannedPurchase.update({
    where: { id },
    data: updateData
  });
}

async function deletePurchase(userId, id) {
  const purchase = await prisma.plannedPurchase.findFirst({ where: { id, userId } });
  if (!purchase) throw new Error('Planned purchase not found');

  return prisma.plannedPurchase.delete({
    where: { id }
  });
}

async function convertPurchase(userId, id, data) {
  const purchase = await prisma.plannedPurchase.findFirst({ where: { id, userId } });
  if (!purchase) throw new Error('Planned purchase not found');

  let categoryId = data.categoryId || purchase.categoryId;
  if (!categoryId) {
    const defaultCat = await prisma.category.findFirst({ where: { userId } });
    if (defaultCat) categoryId = defaultCat.id;
  }

  let accountId = data.accountId;
  if (!accountId) {
    const defaultAcc = await prisma.account.findFirst({ where: { userId, isDefault: true } }) ||
                       await prisma.account.findFirst({ where: { userId } });
    if (defaultAcc) accountId = defaultAcc.id;
  }

  const expense = await prisma.expense.create({
    data: {
      userId,
      accountId,
      categoryId,
      description: purchase.name,
      amount: purchase.expectedAmount,
      date: new Date(data.date || new Date()),
      paymentMethod: data.paymentMethod || 'OTHER',
      notes: data.notes || purchase.notes
    }
  });

  const updated = await prisma.plannedPurchase.update({
    where: { id },
    data: { status: 'PURCHASED', convertedExpenseId: expense.id }
  });

  await log(userId, 'PlannedPurchase', id, 'CONVERTED', purchase, updated);
  return updated;
}

module.exports = { createPurchase, listPurchases, updatePurchase, deletePurchase, convertPurchase };
