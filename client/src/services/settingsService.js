import api from './api';
export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  getAccounts: () => api.get('/settings/accounts'),
  addAccount: (data) => api.post('/settings/accounts', data),
  updateAccount: (id, data) => api.put(`/settings/accounts/${id}`, data)
};
