import api from './api';

export const subscriptionService = {
  getSubscriptions: (params) => api.get('/subscriptions', { params }),
  list: (params) => api.get('/subscriptions', { params }),
  addSubscription: (data) => api.post('/subscriptions', data),
  add: (data) => api.post('/subscriptions', data),
  updateSubscription: (id, data) => api.put(`/subscriptions/${id}`, data),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  deleteSubscription: (id) => api.delete(`/subscriptions/${id}`),
  delete: (id) => api.delete(`/subscriptions/${id}`),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
  reactivate: (id) => api.post(`/subscriptions/${id}/reactivate`),
  getUsage: (id, p1, p2) => {
    if (typeof p1 === 'object') {
      return api.get(`/subscriptions/${id}/usage`, { params: p1 });
    }
    const params = {};
    if (p1 !== undefined) params.month = p1;
    if (p2 !== undefined) params.year = p2;
    return api.get(`/subscriptions/${id}/usage`, { params });
  },
  logUsage: (id, data) => api.post(`/subscriptions/${id}/usage`, data),
  updateUsage: (id, date, data) => api.put(`/subscriptions/${id}/usage/${date}`, data),
  getSummary: (id, params) => api.get(`/subscriptions/${id}/summary`, { params })
};
