// src/api/accountAPI.js
import axios from './axios';

export const accountAPI = {
  // Get all accounts for current user
  getAccounts: async () => {
    return await axios.get('/accounts');
  },

  // Get single account by ID
  getAccount: async (id) => {
    return await axios.get(`/accounts/${id}`);
  },

  // Create new account
  createAccount: async (data) => {
    return await axios.post('/accounts', data);
  },

  // Update account
  updateAccount: async (id, data) => {
    return await axios.put(`/accounts/${id}`, data);
  },

  // Delete account
  deleteAccount: async (id) => {
    return await axios.delete(`/accounts/${id}`);
  },

  // Get account balance
  getAccountBalance: async (id) => {
    return await axios.get(`/accounts/${id}/balance`);
  },

  // Get net worth (sum of all account balances)
  getNetWorth: async () => {
    return await axios.get('/accounts/summary/net-worth');
  }
};