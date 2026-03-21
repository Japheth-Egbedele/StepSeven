// src/api/babyStepAPI.js
import axios from './axios';

export const babyStepAPI = {
  // Get current baby step progress
  getProgress: async () => {
    return await axios.get('/baby-steps/progress');
  },

  // Update baby step progress
  updateProgress: async (data) => {
    return await axios.put('/baby-steps/progress', data);
  },

  // Get debt snowball data
  getDebtSnowball: async () => {
    return await axios.get('/baby-steps/debt-snowball');
  },

  // Get emergency fund progress
  getEmergencyFund: async () => {
    return await axios.get('/baby-steps/emergency-fund');
  },

  // Mark step as complete
  completeStep: async (stepNumber) => {
    return await axios.post(`/baby-steps/complete/${stepNumber}`);
  }
};