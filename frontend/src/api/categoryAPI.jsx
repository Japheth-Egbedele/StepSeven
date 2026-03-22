import axios from './axios';

export const categoryAPI = {
  // Get all categories, optionally filtered by type (INCOME | EXPENSE)
  getAll: async (params = {}) => {
    return await axios.get('/categories', { params });
  },

  // Get single category
  getOne: async (id) => {
    return await axios.get(`/categories/${id}`);
  },

  // Create category
  create: async (data) => {
    return await axios.post('/categories', data);
  },

  // Update category
  update: async (id, data) => {
    return await axios.put(`/categories/${id}`, data);
  },

  // Delete category
  delete: async (id) => {
    return await axios.delete(`/categories/${id}`);
  }
};