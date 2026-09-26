const { createRecurringExpense, listRecurringExpenses, updateRecurringExpense, disableRecurringExpense } = require('../services/recurringExpense.service');
const { successResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const data = await listRecurringExpenses(req.user.id);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.create = async (req, res, next) => {
  try {
    const data = await createRecurringExpense(req.user.id, req.body);
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const data = await updateRecurringExpense(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    await disableRecurringExpense(req.user.id, req.params.id);
    return successResponse(res, { disabled: true });
  } catch (error) { next(error); }
};
