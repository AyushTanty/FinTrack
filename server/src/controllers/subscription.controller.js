const {
  createSubscription,
  listSubscriptions,
  updateSubscription,
  disableSubscription,
  deleteSubscription,
  logUsage,
  getUsage
} = require('../services/subscription.service');
const { successResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const data = await listSubscriptions(req.user.id, req.query.isActive);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const data = await createSubscription(req.user.id, req.body);
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const data = await updateSubscription(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.cancel = async (req, res, next) => {
  try {
    const data = await updateSubscription(req.user.id, req.params.id, { isActive: false });
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.reactivate = async (req, res, next) => {
  try {
    const data = await updateSubscription(req.user.id, req.params.id, { isActive: true });
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await deleteSubscription(req.user.id, req.params.id);
    return successResponse(res, result);
  } catch (error) { next(error); }
};

exports.logUsage = async (req, res, next) => {
  try {
    const data = await logUsage(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.updateUsage = async (req, res, next) => {
  try {
    const data = await logUsage(req.user.id, req.params.id, {
      date: req.params.date,
      status: req.body.status,
      notes: req.body.notes
    });
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getUsage = async (req, res, next) => {
  try {
    const month = req.query.month ? parseInt(req.query.month) : undefined;
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const data = await getUsage(req.user.id, req.params.id, month, year, startDate, endDate);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getSummary = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const sub = await require('../utils/prisma').subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

    const data = await getUsage(req.user.id, req.params.id, month, year);
    const daysInMonth = new Date(year, month, 0).getDate();
    const usedDays = data.filter(u => u.status === 'USED').length;
    const skippedDays = data.filter(u => u.status === 'SKIPPED' || u.status === 'HOLIDAY').length;

    // Detect actual cycle duration in days from startDate to nextBillingDate
    let durationDays = 0;
    if (sub.startDate && sub.nextBillingDate) {
      durationDays = Math.round((new Date(sub.nextBillingDate) - new Date(sub.startDate)) / (1000 * 60 * 60 * 24));
    }

    let daysInCycle = daysInMonth;
    if (durationDays > 0 && durationDays !== 30 && durationDays !== 31) {
      daysInCycle = durationDays;
    } else if (sub.billingCycle === 'WEEKLY') {
      daysInCycle = 7;
    } else if (sub.billingCycle === 'QUARTERLY') {
      daysInCycle = 90;
    } else if (sub.billingCycle === 'YEARLY') {
      daysInCycle = 365;
    }

    const dailyRate = Math.round((Number(sub.amount) / daysInCycle) * 100) / 100;
    let adjustment = 0;
    if (sub.skipRule === 'REFUND_PER_DAY' || sub.skipRule === 'CREDIT_PER_DAY' || sub.skipRule === 'CARRY_FORWARD') {
      adjustment = Math.round(skippedDays * dailyRate * 100) / 100;
    }

    const effectiveCost = Math.max(0, Math.round((Number(sub.amount) - adjustment) * 100) / 100);
    const creditBalance = Number(sub.creditBalance || 0) + (sub.skipRule === 'CREDIT_PER_DAY' ? adjustment : 0);
    const carryForwardAmount = Number(sub.carryForwardAmount || 0) + (sub.skipRule === 'CARRY_FORWARD' ? adjustment : 0);

    const summary = {
      usedDays,
      skippedDays,
      daysInCycle,
      dailyRate,
      adjustment,
      effectiveCost,
      creditBalance,
      carryForwardAmount
    };
    return successResponse(res, summary);
  } catch (error) { next(error); }
};
