import api from './api';

export const recurringExpenseService = {
  getExpenses: (params) => api.get('/recurring-expenses', { params }),
  list: (params) => api.get('/recurring-expenses', { params }),
  addExpense: (data) => api.post('/recurring-expenses', data),
  add: (data) => api.post('/recurring-expenses', data),
  updateExpense: (id, data) => api.put(`/recurring-expenses/${id}`, data),
  update: (id, data) => api.put(`/recurring-expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/recurring-expenses/${id}`),
  deactivate: (id) => api.put(`/recurring-expenses/${id}`, { isActive: false })
};
