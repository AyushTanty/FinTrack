const prisma = require('../utils/prisma');
const { log } = require('./audit.service');

async function createRecurringExpense(userId, data) {
  return prisma.recurringExpense.create({
    data: {
      userId,
      categoryId: data.categoryId,
      name: data.name,
      amount: data.amount,
      frequency: data.frequency,
      dayOfMonth: data.dayOfMonth,
      monthOfYear: data.monthOfYear,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes
    }
  });
}

async function listRecurringExpenses(userId) {
  return prisma.recurringExpense.findMany({
    where: { userId }
  });
}

async function updateRecurringExpense(userId, id, data) {
  const existing = await prisma.recurringExpense.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Recurring expense not found');

  const updateData = { ...data };
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
  
  const updated = await prisma.recurringExpense.update({
    where: { id },
    data: updateData
  });
  
  await log(userId, 'RecurringExpense', id, 'UPDATED', existing, updated);
  return updated;
}

async function disableRecurringExpense(userId, id) {
  const existing = await prisma.recurringExpense.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Recurring expense not found');

  const updated = await prisma.recurringExpense.update({
    where: { id },
    data: { isActive: false }
  });
  
  await log(userId, 'RecurringExpense', id, 'UPDATED', existing, updated);
  return updated;
}

module.exports = { createRecurringExpense, listRecurringExpenses, updateRecurringExpense, disableRecurringExpense };
