import api from './api';
export const savingsService = {
  listGoals: () => api.get('/savings'),
  addGoal: (data) => api.post('/savings', data),
  updateGoal: (id, data) => api.put(`/savings/${id}`, data),
  deleteGoal: (id) => api.delete(`/savings/${id}`),
  addContribution: (id, data) => api.post(`/savings/${id}/contributions`, data),
  getContributions: (id) => api.get(`/savings/${id}/contributions`)
};
