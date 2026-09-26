const { deleteCategory } = require('../services/category.service');
const prisma = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const data = await prisma.category.findMany({ where: { userId: req.user.id } });
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.create = async (req, res, next) => {
  try {
    const data = await prisma.category.create({ data: { ...req.body, userId: req.user.id } });
    return successResponse(res, data, 201);
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Category not found', 404);
    const data = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, data);
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    await deleteCategory(req.user.id, req.params.id);
    return successResponse(res, { deleted: true });
  } catch (error) { 
    if (error.status === 409) return res.status(409).json({ success: false, error: error.message, details: error.details });
    next(error); 
  }
};
