import api from './api';
export const incomeService = {
  getIncomes: (params) => api.get('/income', { params }),
  addIncome: (data) => api.post('/income', data),
  updateIncome: (id, data) => api.put(`/income/${id}`, data),
  deleteIncome: (id) => api.delete(`/income/${id}`)
};
