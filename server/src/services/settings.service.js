const prisma = require('../utils/prisma');
const { calculateAccountBalance } = require('../analytics/balanceCalc');

async function getSettings(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true, timezone: true, defaultEmergencyBuffer: true, name: true, email: true }
  });
}

async function updateSettings(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data
  });
}

async function listAccounts(userId) {
  const accounts = await prisma.account.findMany({ where: { userId } });
  const mapped = [];
  for (const acc of accounts) {
    const bal = await calculateAccountBalance(acc.id);
    mapped.push({ ...acc, computedBalance: bal });
  }
  return mapped;
}

async function createAccount(userId, data) {
  return prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      initialBalance: data.initialBalance,
      notes: data.notes
    }
  });
}

async function updateAccount(userId, id, data) {
  const existing = await prisma.account.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Account not found');

  return prisma.account.update({
    where: { id },
    data
  });
}

module.exports = { getSettings, updateSettings, listAccounts, createAccount, updateAccount };
