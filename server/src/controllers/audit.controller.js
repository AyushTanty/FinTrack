const { getAuditLogs } = require('../services/audit.service');
const { successResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const { page, limit, entity } = req.query;
    const data = await getAuditLogs(req.user.id, parseInt(page) || 1, parseInt(limit) || 50, entity);
    return successResponse(res, data);
  } catch (error) { next(error); }
};
