// src/utils/moneyUtils.js

/**
 * Converts subunits (kobo/cents) to decimal string
 * @param {number} subunits - Amount in subunits (e.g., 123456 kobo)
 * @param {number} subunitToUnit - Conversion factor (100 for NGN/USD)
 * @returns {string} Decimal string (e.g., "1234.56")
 */
export const subunitsToDecimal = (subunits, subunitToUnit = 100) => {
  if (subunits === null || subunits === undefined) return '0.00';
  const decimal = subunits / subunitToUnit;
  return decimal.toFixed(2);
};

/**
 * Converts decimal string to subunits (kobo/cents)
 * @param {string|number} decimal - Decimal amount (e.g., "1234.56" or 1234.56)
 * @param {number} subunitToUnit - Conversion factor (100 for NGN/USD)
 * @returns {number} Amount in subunits (e.g., 123456)
 */
export const decimalToSubunits = (decimal, subunitToUnit = 100) => {
  if (!decimal || decimal === '') return 0;
  const numericValue = typeof decimal === 'string' ? parseFloat(decimal) : decimal;
  if (isNaN(numericValue)) return 0;
  return Math.round(numericValue * subunitToUnit);
};

/**
 * Formats subunits to currency display string
 * @param {number} subunits - Amount in subunits
 * @param {string} symbol - Currency symbol (e.g., "₦", "$")
 * @param {number} subunitToUnit - Conversion factor
 * @param {boolean} showSymbol - Whether to show currency symbol
 * @returns {string} Formatted currency (e.g., "₦1,234.56")
 */
export const formatMoney = (subunits, symbol = '₦', subunitToUnit = 100, showSymbol = true) => {
  const decimal = subunitsToDecimal(subunits, subunitToUnit);
  const formatted = parseFloat(decimal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return showSymbol ? `${symbol}${formatted}` : formatted;
};

/**
 * Parses user input string to subunits
 * @param {string} input - User input (e.g., "1,234.56" or "1234.56")
 * @param {number} subunitToUnit - Conversion factor
 * @returns {number} Amount in subunits
 */
export const parseMoneyInput = (input, subunitToUnit = 100) => {
  if (!input) return 0;
  const cleaned = input.toString().replace(/[^\d.-]/g, '');
  return decimalToSubunits(cleaned, subunitToUnit);
};

/**
 * Validates money input
 * @param {string} input - User input
 * @returns {boolean} Whether input is valid
 */
export const isValidMoneyInput = (input) => {
  if (!input || input === '') return false;
  const cleaned = input.toString().replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return !isNaN(num) && num >= 0;
};

/**
 * Formats money for input field (without symbol)
 * @param {number} subunits - Amount in subunits
 * @param {number} subunitToUnit - Conversion factor
 * @returns {string} Decimal string for input
 */
export const formatForInput = (subunits, subunitToUnit = 100) => {
  return subunitsToDecimal(subunits, subunitToUnit);
};

/**
 * Calculate percentage of amount
 * @param {number} subunits - Amount in subunits
 * @param {number} percentage - Percentage (e.g., 15 for 15%)
 * @returns {number} Result in subunits
 */
export const calculatePercentage = (subunits, percentage) => {
  return Math.round((subunits * percentage) / 100);
};

/**
 * Add two amounts in subunits safely
 * @param {number} amount1 - First amount in subunits
 * @param {number} amount2 - Second amount in subunits
 * @returns {number} Sum in subunits
 */
export const addMoney = (amount1, amount2) => {
  return (amount1 || 0) + (amount2 || 0);
};

/**
 * Subtract two amounts in subunits safely
 * @param {number} amount1 - First amount in subunits
 * @param {number} amount2 - Second amount in subunits
 * @returns {number} Difference in subunits
 */
export const subtractMoney = (amount1, amount2) => {
  return (amount1 || 0) - (amount2 || 0);
};