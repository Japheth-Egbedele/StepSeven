// src/api/babyStepAPI.js
import axios from './axios';

export const babyStepAPI = {
  // Get current baby step progress
  getProgress: async () => {
    return await axios.get('/babysteps/progress');
  },

  // Update baby step progress
  updateProgress: async (data) => {
    return await axios.put('/babysteps/progress', data);
  },

  // Get debt snowball data
  getDebtSnowball: async () => {
    return await axios.get('/babysteps/debt-snowball');
  },

  // Get emergency fund progress
  getEmergencyFund: async () => {
    return await axios.get('/babysteps/emergency-fund');
  },

  // Mark step as complete
  completeStep: async (stepNumber) => {
    return await axios.post(`/babysteps/complete/${stepNumber}`);
  }
};