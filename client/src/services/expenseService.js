import api from './api';
export const expenseService = {
  getExpenses: (params) => api.get('/expenses', { params }),
  addExpense: (data) => api.post('/expenses', data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`)
};
