import axios from './axios';

export const analyticsAPI = {
  // ✅ fixed slug: was /analytics/spending-by-category
  getExpensesByCategory: async (startDate, endDate) => {
    return await axios.get('/analytics/expenses-by-category', {
      params: { startDate, endDate }
    });
  },

  // ✅ fixed slug: was /analytics/cash-flow
  getMonthlyCashFlow: async (months = 6) => {
    return await axios.get('/analytics/monthly-cashflow', {
      params: { months }
    });
  },

  // ✅ fixed slug: was /analytics/net-worth-trend (hyphen vs no hyphen)
  getNetWorthTrend: async (months = 6) => {
    return await axios.get('/analytics/networth-trend', {
      params: { months }
    });
  },

  // ✅ correct
  getSpendingTrends: async (weeks = 8, categoryId = null) => {
    return await axios.get('/analytics/spending-trends', {
      params: { weeks, ...(categoryId && { categoryId }) }
    });
  },

  // ✅ new — budget vs actual for current period
  getBudgetComparison: async (periodKey = null, period = 'MONTHLY') => {
    return await axios.get('/analytics/budget-comparison', {
      params: { period, ...(periodKey && { periodKey }) }
    });
  }
  // getMonthlySummary removed — endpoint does not exist on backend
};