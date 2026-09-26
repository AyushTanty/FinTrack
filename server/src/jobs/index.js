const prisma = require('../utils/prisma');
const cron = require('node-cron');
const { getISTNow, IST } = require('../utils/dateHelpers');
const { fromZonedTime } = require('date-fns-tz');

async function processRecurringExpenses() {
  console.log('Running recurring expense job...');
  const today = getISTNow();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const active = await prisma.recurringExpense.findMany({
    where: { isActive: true }
  });

  for (const req of active) {
    let due = false;
    if (req.frequency === 'MONTHLY' && req.dayOfMonth === day) due = true;
    if (req.frequency === 'QUARTERLY' && req.dayOfMonth === day && [1, 4, 7, 10].includes(month)) due = true;
    if (req.frequency === 'YEARLY' && req.dayOfMonth === day && req.monthOfYear === month) due = true;

    if (due) {
      const exists = await prisma.expense.findFirst({
        where: {
          recurringId: req.id,
          date: {
            gte: fromZonedTime(`${year}-${String(month).padStart(2, '0')}-01T00:00:00`, IST),
            lt: fromZonedTime(month === 12 ? `${year + 1}-01-01T00:00:00` : `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`, IST)
          }
        }
      });

      if (!exists) {
        await prisma.expense.create({
          data: {
            userId: req.userId,
            categoryId: req.categoryId,
            description: req.name,
            amount: req.amount,
            date: today,
            paymentMethod: 'OTHER',
            recurringId: req.id
          }
        });
      }
    }
  }
}

async function processSubscriptions() {
  console.log('Running subscription billing job...');
  const today = getISTNow();

  const active = await prisma.subscription.findMany({
    where: { isActive: true, nextBillingDate: { lte: today } }
  });

  for (const sub of active) {
    const categoryId = sub.categoryId || (await getDefaultCat(sub.userId));
    if (!categoryId) continue;

    const defaultAcc = await prisma.account.findFirst({
      where: { userId: sub.userId, isDefault: true }
    }) || await prisma.account.findFirst({
      where: { userId: sub.userId }
    });

    await prisma.expense.create({
      data: {
        userId: sub.userId,
        accountId: defaultAcc?.id || null,
        categoryId,
        description: `Subscription: ${sub.name}`,
        amount: sub.amount,
        date: today,
        paymentMethod: 'OTHER',
        subscriptionId: sub.id
      }
    });

    let nextDate = new Date(sub.nextBillingDate);
    if (sub.billingCycle === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (sub.billingCycle === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + 1);
    else if (sub.billingCycle === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { nextBillingDate: nextDate }
    });
  }
}

async function getDefaultCat(userId) {
  let cat = await prisma.category.findFirst({ where: { userId, name: 'Subscriptions' } });
  if (!cat) {
    cat = await prisma.category.findFirst({ where: { userId } });
  }
  return cat ? cat.id : null;
}

async function processMonthlyPlans() {
  console.log('Running monthly plan generation job...');
  const today = getISTNow();
  if (today.getDate() !== 1) return;

  const users = await prisma.user.findMany();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  for (const user of users) {
    const existing = await prisma.monthlyPlan.findUnique({
      where: { userId_month_year: { userId: user.id, month, year } }
    });

    if (!existing) {
      const prevPlan = await prisma.monthlyPlan.findUnique({
        where: { userId_month_year: { userId: user.id, month: prevMonth, year: prevYear } }
      });

      await prisma.monthlyPlan.create({
        data: {
          userId: user.id,
          month,
          year,
          plannedIncome: prevPlan ? prevPlan.plannedIncome : 0,
          savingsAllocation: prevPlan ? prevPlan.savingsAllocation : 0,
          emergencyBuffer: user.defaultEmergencyBuffer
        }
      });
    }
  }
}

function initJobs() {
  cron.schedule('1 0 * * *', processRecurringExpenses, { timezone: IST });
  cron.schedule('1 0 * * *', processSubscriptions, { timezone: IST });
  cron.schedule('5 0 1 * *', processMonthlyPlans, { timezone: IST });
}

module.exports = { initJobs };
