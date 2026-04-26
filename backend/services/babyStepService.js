const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Progress = require('../models/Progress');
const User = require('../models/User');
const DateUtils = require('../utils/dateUtils');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class BabyStepService {
  /**
   * Calculate and update user's current Baby Step
   */
  static async calculateCurrentStep(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let progress = await Progress.findOne({ user: userObjectId });

    if (!progress) {
      progress = new Progress({ user: userObjectId });
    }

    const accounts = await Account.find({ user: userObjectId, isActive: true });

    // ─── STEP 1: Starter Emergency Fund ──────────────────────────────────────
    // Detects by isEmergencyFund flag first, falls back to name for legacy accounts
    const emergencyAccounts = accounts.filter(acc =>
      acc.type === 'ASSET' &&
      (acc.subType === 'BANK' || acc.subType === 'CASH') &&
      (acc.isEmergencyFund === true || acc.name.toLowerCase().includes('emergency'))
    );

    const emergencyTotal = emergencyAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    progress.step1.currentAmount = emergencyTotal;

    if (emergencyTotal >= progress.step1.targetAmount && !progress.step1.completed) {
      progress.step1.completed = true;
      progress.step1.completedDate = new Date().toISOString();
      progress.currentStep = Math.max(progress.currentStep, 2);
      logger.info(`User ${userId} completed Baby Step 1!`);
    }

    // ─── STEP 2: Debt Snowball ────────────────────────────────────────────────
    const liabilityAccounts = accounts.filter(acc =>
      acc.type === 'LIABILITY' &&
      acc.subType !== 'INITIAL_BALANCE'
    );

    const sortedDebts = liabilityAccounts
      .map(acc => ({
        accountId: acc._id,
        name: acc.name,
        originalBalance: acc.loanDetails?.originalAmount || acc.balance,
        currentBalance: acc.balance,
        minimumPayment: acc.loanDetails?.minimumPayment || 0,
        isPaidOff: acc.balance <= 0
      }))
      .sort((a, b) => a.currentBalance - b.currentBalance)
      .map((debt, index) => ({ ...debt, order: index + 1 }));

    progress.step2.debts = sortedDebts;
    progress.step2.totalDebtRemaining = sortedDebts.reduce((sum, d) => sum + d.currentBalance, 0);
    progress.step2.totalDebtOriginal = sortedDebts.reduce((sum, d) => sum + d.originalBalance, 0);

    if (
      progress.step1.completed &&
      progress.step2.totalDebtRemaining === 0 &&
      sortedDebts.length > 0 &&
      !progress.step2.completed
    ) {
      progress.step2.completed = true;
      progress.step2.completedDate = new Date().toISOString();
      progress.currentStep = Math.max(progress.currentStep, 3);
      logger.info(`User ${userId} completed Baby Step 2!`);
    }

    // ─── STEP 3: Full Emergency Fund (3–6 months expenses) ───────────────────
    if (progress.step2.completed) {
      const avgMonthlyExpense = await this.calculateAverageMonthlyExpense(userId);
      progress.step3.targetAmount = avgMonthlyExpense * progress.step3.monthsOfExpenses;
      progress.step3.currentAmount = emergencyTotal;

      if (
        progress.step3.targetAmount > 0 &&
        emergencyTotal >= progress.step3.targetAmount &&
        !progress.step3.completed
      ) {
        progress.step3.completed = true;
        progress.step3.completedDate = new Date().toISOString();
        progress.currentStep = Math.max(progress.currentStep, 4);
        logger.info(`User ${userId} completed Baby Step 3!`);
      }
    }

    progress.lastCalculated = new Date().toISOString();
    await progress.save();

    return progress;
  }

  /**
   * Calculate average monthly expense from last 6 months
   * Fixed: userId must be cast to ObjectId for aggregation pipeline
   */
  static async calculateAverageMonthlyExpense(userId) {
    const sixMonthsAgo = DateUtils.subMonths(new Date(), 6).toISOString();
    const now = new Date().toISOString();

    const result = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId), // ← was: userId (string) — bug fixed
          type: 'EXPENSE',
          date: { $gte: sixMonthsAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: '$amount' }
        }
      }
    ]);

    if (result.length === 0) return 0;
    return Math.round(result[0].totalExpense / 6);
  }

  /**
   * Get Gazelle Intensity metrics + Days Ahead
   * daysAhead = total liquid assets ÷ daily burn rate
   */
  static async getGazelleIntensity(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const user = await User.findById(userObjectId).select(
      'preferences.burnRateDailySubunits preferences.burnRateWeeklySubunits preferences.burnRateMonthlySubunits preferences.burnRateTimeframe'
    );

    const liquidAccounts = await Account.find({
      user: userObjectId,
      type: 'ASSET',
      subType: { $in: ['CASH', 'BANK'] },
      isActive: true
    });

    const totalLiquid = liquidAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    const startOfCurrentMonth = DateUtils.startOfMonth(new Date()).toISOString();
    const now = new Date().toISOString();

    const transactions = await Transaction.find({
      user: userObjectId,
      date: { $gte: startOfCurrentMonth, $lte: now },
      type: { $in: ['INCOME', 'EXPENSE'] }
    });

    const monthlyIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const unallocated = monthlyIncome - monthlyExpense;

    // Days Ahead: how long current liquid assets cover daily expenses
    const avgMonthlyExpense = await this.calculateAverageMonthlyExpense(userId);
    const prefs = user?.preferences || {};
    const timeframe = (prefs.burnRateTimeframe || 'daily');

    const manualDaily = prefs.burnRateDailySubunits;
    const manualWeekly = prefs.burnRateWeeklySubunits;
    const manualMonthly = prefs.burnRateMonthlySubunits;

    const resolveDailyBurnRate = () => {
      if (timeframe === 'weekly' && Number.isInteger(manualWeekly) && manualWeekly > 0) {
        return manualWeekly / 7;
      }
      if (timeframe === 'monthly' && Number.isInteger(manualMonthly) && manualMonthly > 0) {
        return manualMonthly / 30;
      }
      if (Number.isInteger(manualDaily) && manualDaily > 0) {
        return manualDaily;
      }
      return (avgMonthlyExpense > 0 ? (avgMonthlyExpense / 30) : 0);
    };

    const dailyBurnRate = resolveDailyBurnRate();
    const daysAhead = dailyBurnRate > 0 ? Math.floor(totalLiquid / dailyBurnRate) : 0;

    return {
      totalLiquid,
      monthlyIncome,
      monthlyExpense,
      unallocated,
      avgMonthlyExpense,
      dailyBurnRate: Math.round(dailyBurnRate),
      daysAhead,
      burnRateTimeframe: timeframe,
      shouldThrowAtDebt: unallocated > 0
    };
  }

  /**
   * Get smallest unpaid debt for snowball focus
   */
  static async getSmallestDebt(userId) {
    const progress = await Progress.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!progress || progress.step2.debts.length === 0) return null;

    return progress.step2.debts
      .filter(d => !d.isPaidOff)
      .sort((a, b) => a.currentBalance - b.currentBalance)[0] || null;
  }
}

module.exports = BabyStepService;