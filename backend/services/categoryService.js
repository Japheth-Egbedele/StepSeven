const Category = require('../models/Category');
const logger = require('../utils/logger');

/**
 * Default categories for new users
 */
const DEFAULT_CATEGORIES = {
  INCOME: [
    { name: 'Salary', icon: '💰', color: '#4CAF50' },
    { name: 'Freelance', icon: '💻', color: '#8BC34A' },
    { name: 'Investments', icon: '📈', color: '#009688' },
    { name: 'Allowance', icon: '🧾', color: '#26A69A' },
    { name: 'Gifts', icon: '🎁', color: '#00BCD4' },
    { name: 'Other Income', icon: '💵', color: '#03A9F4' }
  ],
  EXPENSE: [
    { name: 'Food & Dining', icon: '🍔', color: '#FF5722' },
    { name: 'Transportation', icon: '🚗', color: '#FF9800' },
    { name: 'Housing', icon: '🏠', color: '#795548' },
    { name: 'Utilities', icon: '💡', color: '#FFC107' },
    { name: 'Internet', icon: '🌐', color: '#00BCD4' },
    { name: 'Healthcare', icon: '🏥', color: '#E91E63' },
    { name: 'Entertainment', icon: '🎬', color: '#9C27B0' },
    { name: 'Wants', icon: '✨', color: '#F06292' },
    { name: 'Shopping', icon: '🛍️', color: '#673AB7' },
    { name: 'Education', icon: '📚', color: '#3F51B5' },
    { name: 'Personal Care', icon: '✂️', color: '#2196F3' },
    { name: 'Tithes', icon: '🙏', color: '#8D6E63' },
    { name: 'Bank Charges', icon: '🏦', color: '#607D8B' },
    { name: 'Other', icon: '📦', color: '#9E9E9E' }
  ]
};

class CategoryService {
  /**
   * Create default categories for a new user
   * @param {String} userId - User ID
   */
  static async createDefaultCategories(userId) {
    try {
      const categoriesToCreate = [];
      let order = 0;

      // Create income categories
      for (const cat of DEFAULT_CATEGORIES.INCOME) {
        categoriesToCreate.push({
          ...cat,
          type: 'INCOME',
          user: userId,
          order: order++
        });
      }

      // Create expense categories
      for (const cat of DEFAULT_CATEGORIES.EXPENSE) {
        categoriesToCreate.push({
          ...cat,
          type: 'EXPENSE',
          user: userId,
          order: order++
        });
      }

      const created = await Category.insertMany(categoriesToCreate);
      logger.info(`Created ${created.length} default categories for user ${userId}`);
      
      return created;
    } catch (error) {
      logger.error('Error creating default categories:', error);
      throw error;
    }
  }

  /**
   * Check if user has any categories
   * @param {String} userId - User ID
   * @returns {Boolean}
   */
  static async hasCategories(userId) {
    const count = await Category.countDocuments({ user: userId });
    return count > 0;
  }
}

module.exports = CategoryService;
