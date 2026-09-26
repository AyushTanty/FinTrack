const { getDashboardData } = require('../services/dashboardService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

async function getDashboard(req, res, next) {
  try {
    const { month, year } = req.query;
    if (!month || !year) return errorResponse(res, 'Month and year required', 400);
    
    const data = await getDashboardData(req.user.id, parseInt(month), parseInt(year));
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
