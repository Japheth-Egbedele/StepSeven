const Budget = require('../models/Budget');
const BudgetService = require('../services/budgetService');
const DateUtils = require('../utils/dateUtils');
const MoneyUtils = require('../utils/moneyUtils');
const logger = require('../utils/logger');

class BudgetController {
  static async getAll(req, res) {
    try {
      const userId = req.user.id;
      const { periodKey } = req.query;

      const filter = { user: userId, isActive: true };
      if (periodKey) filter.periodKey = periodKey;

      const budgets = await Budget.find(filter).populate('category').sort({ createdAt: -1 });

      res.json({
        success: true,
        data: budgets
      });
    } catch (error) {
      logger.error('Get budgets error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async create(req, res) {
    try {
      const userId = req.user.id;
      const { category, amount, period, periodKey, carryOverEnabled } = req.body;

      const periodUpper = (period || 'MONTHLY').toUpperCase();
      const amountInSubunits = Math.round(Math.abs(parseFloat(amount)));
      if (!Number.isInteger(amountInSubunits) || amountInSubunits <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive integer (stored in subunits)' });
      }

      const effectivePeriodKey = periodKey
        || (periodUpper === 'WEEKLY'
          ? DateUtils.getWeeklyPeriodKey(new Date())
          : DateUtils.getMonthlyPeriodKey(new Date()));

      const budget = await Budget.create({
        user: userId,
        category,
        amount: amountInSubunits,
        period: periodUpper,
        periodKey: effectivePeriodKey,
        carryOver: {
          enabled: carryOverEnabled !== undefined ? carryOverEnabled : true,
          amount: 0
        }
      });

      await budget.populate('category');
      logger.info(`Created budget for user ${userId}`);

      res.status(201).json({ success: true, data: budget });
    } catch (error) {
      logger.error('Create budget error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      if (updates.amount !== undefined) {
        const amountInSubunits = Math.round(Math.abs(parseFloat(updates.amount)));
        if (!Number.isInteger(amountInSubunits) || amountInSubunits <= 0) {
          return res.status(400).json({ success: false, message: 'Amount must be a positive integer (stored in subunits)' });
        }
        updates.amount = amountInSubunits;
      }

      if (updates.period) {
        updates.period = updates.period.toUpperCase();
      }

      const budget = await Budget.findOneAndUpdate(
        { _id: id, user: userId },
        updates,
        { new: true, runValidators: true }
      ).populate('category');

      if (!budget) {
        return res.status(404).json({ success: false, message: 'Budget not found' });
      }

      res.json({ success: true, data: budget });
    } catch (error) {
      logger.error('Update budget error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const budget = await Budget.findOne({ _id: id, user: userId });
      if (!budget) {
        return res.status(404).json({ success: false, message: 'Budget not found' });
      }

      budget.isActive = false;
      await budget.save();

      res.json({ success: true, message: 'Budget deleted' });
    } catch (error) {
      logger.error('Delete budget error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSummary(req, res) {
    try {
      const userId = req.user.id;
      const { year, month } = req.params;
      
      // Placeholder logic to prevent crash
      res.status(200).json({ 
        success: true, 
        data: { totalBudgeted: 0, totalSpent: 0 } 
      });
    } catch (error) {
      logger.error('Get summary error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getComparison(req, res) {
    try {
      const userId = req.user.id;
      res.status(200).json({ 
        success: true, 
        data: [] 
      });
    } catch (error) {
      logger.error('Get comparison error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
module.exports = BudgetController;