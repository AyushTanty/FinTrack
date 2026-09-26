import api from './api';
export const reportsService = {
  monthlyTrend: (months) => api.get('/reports/monthly-trend', { params: { months } }),
  categoryBreakdown: (month, year) => api.get('/reports/category-breakdown', { params: { month, year } }),
  budgetVsActual: (month, year) => api.get('/reports/budget-vs-actual', { params: { month, year } }),
  fixedVsVariable: (month, year) => api.get('/reports/fixed-vs-variable', { params: { month, year } }),
  savingsProgress: () => api.get('/reports/savings-progress'),
  dailySpending: (month, year) => api.get('/reports/daily-spending', { params: { month, year } }),
  subscriptionSpending: (year) => api.get('/reports/subscription-spending', { params: { year } }),
  costOfLiving: (months) => api.get('/reports/cost-of-living', { params: { months } })
};
