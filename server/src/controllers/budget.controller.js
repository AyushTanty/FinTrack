const { upsertBudget, updateBudget, listBudgets } = require('../services/budget.service');
const { getBudgetVsActual } = require('../analytics/budgetVsActual');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return errorResponse(res, 'Month and year required', 400);
    const data = await listBudgets(req.user.id, month, year);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.vsActual = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return errorResponse(res, 'Month and year required', 400);
    const data = await getBudgetVsActual(req.user.id, parseInt(month), parseInt(year));
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.upsert = async (req, res, next) => {
  try {
    const data = await upsertBudget(req.user.id, req.body);
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const data = await updateBudget(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
