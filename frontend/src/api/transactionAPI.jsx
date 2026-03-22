import axios from './axios';

export const transactionAPI = {
  getTransactions: async (params = {}) => {
    return await axios.get('/transactions', { params });
  },

  getTransaction: async (id) => {
    return await axios.get(`/transactions/${id}`);
  },

  createTransaction: async (data) => {
    return await axios.post('/transactions', data);
  },

  updateTransaction: async (id, data) => {
    return await axios.put(`/transactions/${id}`, data);
  },

  deleteTransaction: async (id) => {
    return await axios.delete(`/transactions/${id}`);
  },

  getRecentTransactions: async (limit = 10) => {
    return await axios.get('/transactions', {
      params: { limit, sort: '-date' }
    });
  },

  // ── Transfer methods (routed through /transactions per transaction.routes.js) ──

  createTransfer: async (data) => {
    // data: { fromAccount, toAccount, amount, date, description, fee?, feeCategory? }
    return await axios.post('/transactions/transfer', data);
  },

  updateTransfer: async (id, data) => {
    return await axios.put(`/transactions/transfer/${id}`, data);
  },

  deleteTransfer: async (id) => {
    return await axios.delete(`/transactions/transfer/${id}`);
  }
};