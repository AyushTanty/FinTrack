const { createPurchase, listPurchases, updatePurchase, deletePurchase, convertPurchase } = require('../services/plannedPurchase.service');
const { calculateTrueAvailableMoney } = require('../analytics/tamCalc');
const { calculateSafeDailyBudget } = require('../analytics/dailyBudgetCalc');
const { getDaysRemainingInMonth, getISTNow } = require('../utils/dateHelpers');
const Decimal = require('decimal.js');
const { successResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const data = await listPurchases(req.user.id, req.query.status, req.query.priority);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.create = async (req, res, next) => {
  try {
    const data = await createPurchase(req.user.id, req.body);
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const data = await updatePurchase(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    await deletePurchase(req.user.id, req.params.id);
    return successResponse(res, { deleted: true });
  } catch (error) { next(error); }
};
exports.convert = async (req, res, next) => {
  try {
    const data = await convertPurchase(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.simulate = async (req, res, next) => {
  try {
    const amount = new Decimal(req.query.amount || 0);
    const today = getISTNow();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();
    const tamBefore = await calculateTrueAvailableMoney(req.user.id, m, y);
    const sdbBefore = await calculateSafeDailyBudget(req.user.id, m, y);
    
    const daysRemaining = getDaysRemainingInMonth(m, y);
    const tamAfter = tamBefore.minus(amount);
    const sdbAfter = tamAfter.lte(0) ? new Decimal(0) : tamAfter.dividedBy(daysRemaining).floor();
    
    return successResponse(res, {
      simulatedAmount: amount.toNumber(),
      before: { flexibleMoney: tamBefore.toNumber(), dailyBudget: sdbBefore.toNumber() },
      after: { flexibleMoney: tamAfter.toNumber(), dailyBudget: sdbAfter.toNumber() },
      difference: {
        flexibleMoney: tamBefore.minus(tamAfter).toNumber(),
        dailyBudget: sdbBefore.minus(sdbAfter).toNumber()
      }
    });
  } catch (error) { next(error); }
};

