// src/api/budgetAPI.js
import axios from './axios';

export const budgetAPI = {
  // Get all budgets with optional filters
  getBudgets: async (params = {}) => {
    return await axios.get('/budgets', { params });
  },

  // Get single budget
  getBudget: async (id) => {
    return await axios.get(`/budgets/${id}`);
  },

  // Create budget
  createBudget: async (data) => {
    return await axios.post('/budgets', data);
  },

  // Update budget
  updateBudget: async (id, data) => {
    return await axios.put(`/budgets/${id}`, data);
  },

  // Delete budget
  deleteBudget: async (id) => {
    return await axios.delete(`/budgets/${id}`);
  },

  // Get budget summary for a period
  getBudgetSummary: async (year, month) => {
    return await axios.get(`/budgets/summary/${year}/${month}`);
  },

  // Get budget vs actual comparison
  getBudgetComparison: async (year, month) => {
    return await axios.get(`/budgets/comparison/${year}/${month}`);
  }
};