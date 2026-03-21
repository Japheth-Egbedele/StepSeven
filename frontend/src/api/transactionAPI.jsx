// src/api/transactionAPI.js
import axios from './axios';

export const transactionAPI = {
  // Get transactions with optional filters and pagination
  getTransactions: async (params = {}) => {
    return await axios.get('/transactions', { params });
  },

  // Get single transaction
  getTransaction: async (id) => {
    return await axios.get(`/transactions/${id}`);
  },

  // Create transaction
  createTransaction: async (data) => {
    return await axios.post('/transactions', data);
  },

  // Update transaction
  updateTransaction: async (id, data) => {
    return await axios.put(`/transactions/${id}`, data);
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    return await axios.delete(`/transactions/${id}`);
  },

  // Get recent transactions
  getRecentTransactions: async (limit = 10) => {
    return await axios.get('/transactions', { 
      params: { limit, sort: '-date' } 
    });
  }
};