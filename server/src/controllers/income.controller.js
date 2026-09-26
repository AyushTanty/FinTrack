const { createIncome, listIncome, updateIncome, deleteIncome } = require('../services/income.service');
const { successResponse } = require('../utils/apiResponse');

exports.create = async (req, res, next) => {
  try {
    const data = await createIncome(req.user.id, req.body);
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};
exports.list = async (req, res, next) => {
  try {
    const data = await listIncome(req.user.id, req.query);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const data = await updateIncome(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    await deleteIncome(req.user.id, req.params.id);
    return successResponse(res, { deleted: true });
  } catch (error) { next(error); }
};
