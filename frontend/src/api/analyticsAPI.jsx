// src/api/analyticsAPI.js
import axios from './axios';

export const analyticsAPI = {
  // Get spending by category
  getSpendingByCategory: async (startDate, endDate) => {
    return await axios.get('/analytics/spending-by-category', {
      params: { startDate, endDate }
    });
  },

  // Get income vs expenses trend
  getCashFlowTrend: async (months = 6) => {
    return await axios.get('/analytics/cash-flow', {
      params: { months }
    });
  },

  // Get net worth trend
  getNetWorthTrend: async (months = 12) => {
    return await axios.get('/analytics/net-worth-trend', {
      params: { months }
    });
  },

  // Get spending trends
  getSpendingTrends: async (year, month) => {
    return await axios.get('/analytics/spending-trends', {
      params: { year, month }
    });
  },

  // Get monthly summary
  getMonthlySummary: async (year, month) => {
    return await axios.get('/analytics/monthly-summary', {
      params: { year, month }
    });
  }
};