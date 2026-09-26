const prisma = require('../utils/prisma');
const { log } = require('./audit.service');

async function createSubscription(userId, data) {
  return prisma.subscription.create({
    data: {
      userId,
      categoryId: data.categoryId,
      name: data.name,
      type: data.type,
      amount: data.amount,
      billingCycle: data.billingCycle,
      startDate: new Date(data.startDate),
      nextBillingDate: new Date(data.nextBillingDate),
      isFlexible: data.isFlexible,
      skipRule: data.skipRule,
      notes: data.notes
    }
  });
}

async function listSubscriptions(userId, isActive) {
  const where = { userId };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  return prisma.subscription.findMany({
    where,
    include: {
      usageLogs: {
        select: { date: true, status: true, notes: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function updateSubscription(userId, id, data) {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) throw new Error('Subscription not found');

  const updateData = { ...data };
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.nextBillingDate) updateData.nextBillingDate = new Date(updateData.nextBillingDate);
  const updated = await prisma.subscription.update({
    where: { id },
    data: updateData
  });
  await log(userId, 'Subscription', id, 'UPDATED', sub, updated);
  return updated;
}

async function disableSubscription(userId, id) {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) throw new Error('Subscription not found');

  const updated = await prisma.subscription.update({
    where: { id },
    data: { isActive: false }
  });
  await log(userId, 'Subscription', id, 'UPDATED', sub, updated);
  return updated;
}

async function deleteSubscription(userId, id) {
  const sub = await prisma.subscription.findFirst({
    where: { id, userId },
    include: { _count: { select: { expenses: true } } }
  });
  if (!sub) throw new Error('Subscription not found');

  if (sub._count && sub._count.expenses > 0) {
    const updated = await prisma.subscription.update({
      where: { id },
      data: { isActive: false }
    });
    await log(userId, 'Subscription', id, 'UPDATED', sub, updated);
    return { deleted: false, disabled: true, message: 'Subscription has historical expenses and has been set to Cancelled' };
  } else {
    await prisma.subscriptionUsage.deleteMany({ where: { subscriptionId: id } });
    await prisma.subscription.delete({ where: { id } });
    await log(userId, 'Subscription', id, 'DELETED', sub, null);
    return { deleted: true };
  }
}

async function logUsage(userId, id, data) {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) throw new Error('Subscription not found');
  
  return prisma.subscriptionUsage.upsert({
    where: {
      subscriptionId_date: { subscriptionId: id, date: new Date(data.date) }
    },
    update: { status: data.status, notes: data.notes },
    create: {
      subscriptionId: id,
      date: new Date(data.date),
      status: data.status,
      notes: data.notes
    }
  });
}

async function getUsage(userId, id, month, year, startDate, endDate) {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) throw new Error('Subscription not found');
  
  const where = { subscriptionId: id };
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (month && year) {
    where.date = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1)
    };
  }
  return prisma.subscriptionUsage.findMany({
    where,
    orderBy: { date: 'asc' }
  });
}

module.exports = {
  createSubscription,
  listSubscriptions,
  updateSubscription,
  disableSubscription,
  deleteSubscription,
  logUsage,
  getUsage
};
