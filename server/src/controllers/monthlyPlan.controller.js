const { rolloverPlan } = require('../services/monthlyPlan.service');
const prisma = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const where = { userId: req.user.id };
    if (month && year) { where.month = parseInt(month); where.year = parseInt(year); }
    const data = await prisma.monthlyPlan.findMany({ where });
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.create = async (req, res, next) => {
  try {
    const data = await prisma.monthlyPlan.create({ data: { ...req.body, userId: req.user.id } });
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.monthlyPlan.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Plan not found', 404);
    const data = await prisma.monthlyPlan.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.rollover = async (req, res, next) => {
  try {
    const data = await rolloverPlan(req.user.id, req.params.id, req.body.allocations);
    return successResponse(res, data);
  } catch (error) {
    if (error.status === 409) return errorResponse(res, error.message, 409);
    next(error);
  }
};
