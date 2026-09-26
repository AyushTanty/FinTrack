const { createGoal, listGoals, updateGoal, deleteGoal, cancelGoal, addContribution, getContributions } = require('../services/savings.service');
const { successResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const data = await listGoals(req.user.id);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.create = async (req, res, next) => {
  try {
    const data = await createGoal(req.user.id, req.body);
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const data = await updateGoal(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    await deleteGoal(req.user.id, req.params.id);
    return successResponse(res, { deleted: true });
  } catch (error) { next(error); }
};
exports.addContribution = async (req, res, next) => {
  try {
    const data = await addContribution(req.user.id, req.params.id, req.body);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.getContributions = async (req, res, next) => {
  try {
    const data = await getContributions(req.user.id, req.params.id);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
