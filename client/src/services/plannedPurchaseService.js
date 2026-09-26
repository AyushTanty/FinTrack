import api from './api';

export const plannedPurchaseService = {
  getPurchases: (params) => api.get('/planned-purchases', { params }),
  list: (status, priority) => api.get('/planned-purchases', { params: { status, priority } }),
  addPurchase: (data) => api.post('/planned-purchases', data),
  updatePurchase: (id, data) => api.put(`/planned-purchases/${id}`, data),
  deletePurchase: (id) => api.delete(`/planned-purchases/${id}`),
  convertPurchase: (id, data) => api.post(`/planned-purchases/${id}/convert`, data),
  convert: (id, data) => api.post(`/planned-purchases/${id}/convert`, data),
  simulate: (amount) => api.get('/planned-purchases/simulate', { params: { amount } })
};
