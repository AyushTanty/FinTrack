import api from './api';
export const budgetService = {
  getBudgets: (params) => api.get('/budgets', { params }),
  setBudget: (data) => api.post('/budgets', data),
  updateBudget: (id, data) => api.put(`/budgets/${id}`, data),
  getBudgetVsActual: (params) => api.get('/budgets/vs-actual', { params })
};
