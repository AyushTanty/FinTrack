const {
  getMonthlyTrend,
  getCategoryBreakdown,
  getFixedVsVariable,
  getDailySpending,
  getSubscriptionSpending,
  getCostOfLivingTrend
} = require('../services/reports.service');
const { getBudgetVsActual } = require('../analytics/budgetVsActual');
const { getSavingsProgress } = require('../analytics/savingsProgress');
const { successResponse } = require('../utils/apiResponse');

exports.getMonthlyTrend = async (req, res, next) => {
  try {
    const data = await getMonthlyTrend(req.user.id, parseInt(req.query.months) || 6);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await getCategoryBreakdown(req.user.id, month, year);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getBudgetVsActual = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await getBudgetVsActual(req.user.id, month, year);
    const formatted = data.map(b => ({
      categoryId: b.categoryId,
      name: b.categoryName,
      budgeted: b.budgeted.toNumber(),
      actual: b.actual.toNumber(),
      remaining: b.budgeted.minus(b.actual).toNumber(),
      status: b.budgeted.minus(b.actual).gte(0) ? 'ON_TRACK' : 'OVER_BUDGET'
    }));
    return successResponse(res, formatted);
  } catch (error) { next(error); }
};

exports.getFixedVsVariable = async (req, res, next) => {
  try {
    const data = await getFixedVsVariable(req.user.id, parseInt(req.query.months) || 6);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getDailySpending = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await getDailySpending(req.user.id, month, year);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getSubscriptionSpending = async (req, res, next) => {
  try {
    const data = await getSubscriptionSpending(req.user.id, parseInt(req.query.months) || 6);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getCostOfLiving = async (req, res, next) => {
  try {
    const data = await getCostOfLivingTrend(req.user.id, parseInt(req.query.months) || 12);
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getSavingsProgress = async (req, res, next) => {
  try {
    const data = await getSavingsProgress(req.user.id);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
