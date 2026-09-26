import api from './api';
export const dashboardService = {
  getDashboard: (month, year) => api.get('/dashboard', { params: { month, year } }),
  getAvailableMoney: (month, year) => api.get('/dashboard/available-money', { params: { month, year } }),
};
