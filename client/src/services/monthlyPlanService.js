import api from './api';
export const monthlyPlanService = {
  getPlans: (params) => api.get('/monthly-plans', { params }),
  createPlan: (data) => api.post('/monthly-plans', data),
  updatePlan: (id, data) => api.put(`/monthly-plans/${id}`, data),
  rollover: (id) => api.post(`/monthly-plans/${id}/rollover`)
};
