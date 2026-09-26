import api from './api';
export const categoryService = {
  getCategories: () => api.get('/categories'),
  addCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};
