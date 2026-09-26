const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { seedDefaultCategories } = require('../../../prisma/seed');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/tokenHelpers');

async function register({ email, password, name, initialBalance }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, passwordHash, name }
  });

  await seedDefaultCategories(user.id);

  await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Default Bank',
      type: 'BANK',
      initialBalance,
      isDefault: true
    }
  });

  const now = new Date();
  await prisma.monthlyPlan.create({
    data: {
      userId: user.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      plannedIncome: 0
    }
  });

  return generateTokens(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  return generateTokens(user);
}

function generateTokens(user) {
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);
  return { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } };
}

async function refresh(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) return null;
  return { accessToken: generateAccessToken(user.id, user.email) };
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true }
  });
  if (!user) throw new Error('User not found');
  return user;
}

module.exports = { register, login, refresh, getCurrentUser };
