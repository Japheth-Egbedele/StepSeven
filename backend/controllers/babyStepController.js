const BabyStepService = require('../services/babyStepService');
const Progress = require('../models/Progress');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class BabyStepController {

  // ─── Progress & Core ──────────────────────────────────────────────────────

  static async getProgress(req, res) {
    try {
      const progress = await BabyStepService.calculateCurrentStep(req.user.id);
      res.json({ success: true, data: progress });
    } catch (error) {
      logger.error('Get progress error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update user-configurable progress settings
   * Body: { step1TargetAmount: <kobo integer> }
   * e.g. ₦125,000 → send 12500000
   */
  static async updateProgress(req, res) {
    try {
      const userId = req.user.id;
      const { step1TargetAmount, step3MonthsOfExpenses } = req.body;

      let progress = await Progress.findOne({ user: new mongoose.Types.ObjectId(userId) });
      if (!progress) {
        progress = new Progress({ user: new mongoose.Types.ObjectId(userId) });
      }

      if (step1TargetAmount !== undefined) {
        if (!Number.isInteger(step1TargetAmount) || step1TargetAmount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'step1TargetAmount must be a positive integer in kobo (e.g. ₦125,000 = 12500000)'
          });
        }
        progress.step1.targetAmount = step1TargetAmount;
      }

      if (step3MonthsOfExpenses !== undefined) {
        if (![3, 4, 5, 6].includes(step3MonthsOfExpenses)) {
          return res.status(400).json({
            success: false,
            message: 'step3MonthsOfExpenses must be between 3 and 6'
          });
        }
        progress.step3.monthsOfExpenses = step3MonthsOfExpenses;
      }

      await progress.save();

      // Recalculate with new targets
      const updated = await BabyStepService.calculateCurrentStep(userId);
      res.json({ success: true, data: updated });
    } catch (error) {
      logger.error('Update progress error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async completeStep(req, res) {
    try {
      // Manual step completion is intentionally restricted —
      // steps auto-complete based on real account data.
      res.status(403).json({
        success: false,
        message: 'Steps complete automatically when targets are met. Update your accounts to reflect real progress.'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── Emergency Fund ───────────────────────────────────────────────────────

  static async getEmergencyFund(req, res) {
    try {
      const progress = await BabyStepService.calculateCurrentStep(req.user.id);
      const { currentAmount, targetAmount, completed, completedDate } = progress.step1;
      const percentage = targetAmount > 0
        ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
        : 0;

      res.json({
        success: true,
        data: {
          currentAmount,
          targetAmount,
          percentage,
          completed,
          completedDate: completedDate || null,
          remaining: Math.max(0, targetAmount - currentAmount)
        }
      });
    } catch (error) {
      logger.error('Emergency fund error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ─── Debt Snowball ────────────────────────────────────────────────────────

  static async getDebtSnowball(req, res) {
    try {
      const userId = req.user.id;
      const progress = await Progress.findOne({ user: new mongoose.Types.ObjectId(userId) });

      if (!progress || progress.step2.debts.length === 0) {
        return res.json({
          success: true,
          data: {
            debts: [],
            totalDebtRemaining: 0,
            totalDebtOriginal: 0,
            completed: false,
            message: 'No debts tracked yet'
          }
        });
      }

      res.json({
        success: true,
        data: {
          debts: progress.step2.debts,
          totalDebtRemaining: progress.step2.totalDebtRemaining,
          totalDebtOriginal: progress.step2.totalDebtOriginal,
          completed: progress.step2.completed,
          completedDate: progress.step2.completedDate || null
        }
      });
    } catch (error) {
      logger.error('Debt snowball error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSmallestDebt(req, res) {
    try {
      const smallestDebt = await BabyStepService.getSmallestDebt(req.user.id);
      if (!smallestDebt) {
        return res.json({
          success: true,
          data: null,
          message: 'No active debts — you\'re debt free! 🎉'
        });
      }
      res.json({ success: true, data: smallestDebt });
    } catch (error) {
      logger.error('Smallest debt error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ─── Gazelle Intensity & Days Ahead ──────────────────────────────────────

  static async getGazelleIntensity(req, res) {
    try {
      const metrics = await BabyStepService.getGazelleIntensity(req.user.id);
      res.json({ success: true, data: metrics });
    } catch (error) {
      logger.error('Gazelle intensity error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Standalone Days Ahead endpoint — the headline dashboard metric
   * Returns: how many days your liquid assets cover at your average daily burn rate
   */
  static async getDaysAhead(req, res) {
    try {
      const metrics = await BabyStepService.getGazelleIntensity(req.user.id);
      res.json({
        success: true,
        data: {
          daysAhead: metrics.daysAhead,
          totalLiquid: metrics.totalLiquid,
          dailyBurnRate: metrics.dailyBurnRate,
          avgMonthlyExpense: metrics.avgMonthlyExpense
        }
      });
    } catch (error) {
      logger.error('Days ahead error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = BabyStepController;