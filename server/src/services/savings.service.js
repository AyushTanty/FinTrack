const prisma = require('../utils/prisma');
const { log } = require('./audit.service');
const Decimal = require('decimal.js');

async function createGoal(userId, data) {
  return prisma.savingsGoal.create({
    data: {
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      monthlyContribution: data.monthlyContribution,
      notes: data.notes
    }
  });
}

async function listGoals(userId) {
  return prisma.savingsGoal.findMany({ where: { userId } });
}

async function updateGoal(userId, id, data) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error('Goal not found');

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.targetAmount !== undefined) updateData.targetAmount = parseFloat(data.targetAmount);
  if (data.currentAmount !== undefined) updateData.currentAmount = parseFloat(data.currentAmount);
  if (data.targetDate !== undefined) {
    updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
  }
  if (data.monthlyContribution !== undefined) updateData.monthlyContribution = parseFloat(data.monthlyContribution);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: updateData
  });

  await log(userId, 'SavingsGoal', id, 'UPDATED', goal, updated);
  return updated;
}

async function deleteGoal(userId, id) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error('Goal not found');

  // Delete all contributions linked to this goal first
  await prisma.savingsContribution.deleteMany({ where: { goalId: id } });
  // Delete the goal itself
  await prisma.savingsGoal.delete({ where: { id } });

  await log(userId, 'SavingsGoal', id, 'DELETED', goal, null);
  return { deleted: true };
}

async function cancelGoal(userId, id) {
  return deleteGoal(userId, id);
}

async function addContribution(userId, id, data) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error('Goal not found');

  const contributionAmount = new Decimal(data.amount || 0);
  const newCurrent = new Decimal(goal.currentAmount).plus(contributionAmount);
  const target = new Decimal(goal.targetAmount);
  const newStatus = newCurrent.gte(target) ? 'COMPLETED' : goal.status;

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: { currentAmount: newCurrent, status: newStatus }
  });

  await prisma.savingsContribution.create({
    data: {
      goalId: id,
      amount: contributionAmount,
      date: data.date ? new Date(data.date) : new Date(),
      notes: data.notes
    }
  });

  await log(userId, 'SavingsGoal', id, 'CONTRIBUTION_ADDED', goal, updated);
  return updated;
}

async function getContributions(userId, id) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error('Goal not found');
  
  return prisma.savingsContribution.findMany({
    where: { goalId: id },
    orderBy: { date: 'desc' }
  });
}

module.exports = { createGoal, listGoals, updateGoal, deleteGoal, cancelGoal, addContribution, getContributions };
