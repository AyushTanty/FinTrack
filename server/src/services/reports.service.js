const prisma = require('../utils/prisma');
const { getMonthStart, getMonthEnd } = require('../utils/dateHelpers');
const Decimal = require('decimal.js');

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function getMonthlyTrend(userId, months = 6) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const trend = [];
  for (let i = months - 1; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const start = getMonthStart(m, y);
    const end = getMonthEnd(m, y);

    const spentAgg = await prisma.expense.aggregate({
      where: { userId, deletedAt: null, date: { gte: start, lte: end } },
      _sum: { amount: true }
    });

    const incomeAgg = await prisma.income.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true }
    });

    trend.push({
      month: m,
      year: y,
      name: `${monthNames[m - 1]} ${y}`,
      spent: Number(spentAgg._sum.amount || 0),
      income: Number(incomeAgg._sum.amount || 0)
    });
  }

  return trend;
}

async function getCategoryBreakdown(userId, month, year) {
  const start = getMonthStart(month, year);
  const end = getMonthEnd(month, year);

  const expenses = await prisma.expense.findMany({
    where: { userId, deletedAt: null, date: { gte: start, lte: end } },
    include: { category: true }
  });

  const catMap = {};
  for (const exp of expenses) {
    const cId = exp.categoryId;
    const cName = exp.category?.name || 'Other';
    const cColor = exp.category?.color || '#94a3b8';
    const cType = exp.category?.type || 'VARIABLE';

    if (!catMap[cId]) {
      catMap[cId] = {
        categoryId: cId,
        name: cName,
        color: cColor,
        type: cType,
        total: 0
      };
    }
    catMap[cId].total += Number(exp.amount);
  }

  return Object.values(catMap).sort((a, b) => b.total - a.total);
}

async function getFixedVsVariable(userId, months = 6) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const data = [];
  for (let i = months - 1; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const start = getMonthStart(m, y);
    const end = getMonthEnd(m, y);

    const expenses = await prisma.expense.findMany({
      where: { userId, deletedAt: null, date: { gte: start, lte: end } },
      include: { category: true }
    });

    let fixed = 0;
    let variable = 0;
    let discretionary = 0;

    for (const exp of expenses) {
      const amt = Number(exp.amount);
      if (exp.category?.type === 'FIXED') fixed += amt;
      else if (exp.category?.type === 'VARIABLE') variable += amt;
      else if (exp.category?.type === 'DISCRETIONARY') discretionary += amt;
      else variable += amt;
    }

    data.push({
      month: m,
      year: y,
      name: `${monthNames[m - 1]} ${y}`,
      fixed,
      variable,
      discretionary,
      total: fixed + variable + discretionary
    });
  }

  return data;
}

async function getDailySpending(userId, month, year) {
  const start = getMonthStart(month, year);
  const end = getMonthEnd(month, year);

  const expenses = await prisma.expense.findMany({
    where: { userId, deletedAt: null, date: { gte: start, lte: end } },
    select: { date: true, amount: true }
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyMap = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap[d] = 0;
  }

  for (const exp of expenses) {
    const day = new Date(exp.date).getDate();
    if (dailyMap[day] !== undefined) {
      dailyMap[day] += Number(exp.amount);
    }
  }

  return Object.entries(dailyMap).map(([day, total]) => ({
    day: parseInt(day),
    name: `Day ${day}`,
    total
  }));
}

async function getSubscriptionSpending(userId, months = 6) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const data = [];
  for (let i = months - 1; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const start = getMonthStart(m, y);
    const end = getMonthEnd(m, y);

    // Filter subscription-linked expenses
    const agg = await prisma.expense.aggregate({
      where: {
        userId,
        deletedAt: null,
        subscriptionId: { not: null },
        date: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });

    data.push({
      month: m,
      year: y,
      name: `${monthNames[m - 1]} ${y}`,
      total: Number(agg._sum.amount || 0)
    });
  }

  return data;
}

async function getCostOfLivingTrend(userId, months = 12) {
  return getFixedVsVariable(userId, months);
}

module.exports = {
  getMonthlyTrend,
  getCategoryBreakdown,
  getFixedVsVariable,
  getDailySpending,
  getSubscriptionSpending,
  getCostOfLivingTrend
};
