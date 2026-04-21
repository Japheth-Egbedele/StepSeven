const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Budget = require('../models/Budget');
const DateUtils = require('../utils/dateUtils');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class AnalyticsController {

  // ─── Existing: Expenses By Category ──────────────────────────────────────

  static async getExpensesByCategory(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const start = startDate || DateUtils.subMonths(new Date(), 1).toISOString();
      const end = endDate || new Date().toISOString();

      const result = await Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            type: 'EXPENSE',
            date: { $gte: start, $lte: end }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: '$categoryInfo' },
        {
          $group: {
            _id: '$category',
            categoryName: { $first: '$categoryInfo.name' },
            categoryIcon: { $first: '$categoryInfo.icon' },
            categoryColor: { $first: '$categoryInfo.color' },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      const total = result.reduce((sum, item) => sum + item.totalAmount, 0);
      const dataWithPercentages = result.map(item => ({
        ...item,
        percentage: total > 0 ? parseFloat(((item.totalAmount / total) * 100).toFixed(2)) : 0
      }));

      res.json({ success: true, data: dataWithPercentages, total, period: { start, end } });
    } catch (error) {
      logger.error('Expenses by category error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ─── Existing: Monthly Cash Flow ──────────────────────────────────────────

  static async getMonthlyCashFlow(req, res) {
    try {
      const userId = req.user.id;
      const { months = 6 } = req.query;

      const startDate = DateUtils.subMonths(new Date(), parseInt(months)).toISOString();
      const endDate = new Date().toISOString();

      const result = await Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            type: { $in: ['INCOME', 'EXPENSE'] },
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $addFields: { yearMonth: { $substr: ['$date', 0, 7] } }
        },
        {
          $group: {
            _id: { yearMonth: '$yearMonth', type: '$type' },
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: '$_id.yearMonth',
            income: {
              $sum: { $cond: [{ $eq: ['$_id.type', 'INCOME'] }, '$totalAmount', 0] }
            },
            expense: {
              $sum: { $cond: [{ $eq: ['$_id.type', 'EXPENSE'] }, '$totalAmount', 0] }
            }
          }
        },
        {
          $addFields: {
            netCashFlow: { $subtract: ['$income', '$expense'] },
            savingsRate: {
              $cond: [
                { $gt: ['$income', 0] },
                {
                  $multiply: [
                    { $divide: [{ $subtract: ['$income', '$expense'] }, '$income'] },
                    100
                  ]
                },
                0
              ]
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({ success: true, data: result, period: { start: startDate, end: endDate } });
    } catch (error) {
      logger.error('Cash flow error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ─── NEW: Net Worth Trend ─────────────────────────────────────────────────
  /**
   * Reconstructs historical net worth by working backwards from current state.
   * Strategy:
   *  1. Get current net worth from live account balances
   *  2. Get monthly net cash flow (income - expense) for last N months
   *  3. Walk backwards: netWorth[month] = netWorth[month+1] - netCashFlow[month+1]
   *
   * Query param: ?months=6 (default 6, max 24)
   */
  static async getNetWorthTrend(req, res) {
    try {
      const userId = req.user.id;
      const months = Math.min(parseInt(req.query.months) || 6, 24);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Step 1 — current net worth from live account balances
      const accounts = await Account.find({
        user: userObjectId,
        isActive: true,
        includeInTotal: true
      });

      let currentAssets = 0;
      let currentLiabilities = 0;

      accounts.forEach(acc => {
        if (acc.type === 'ASSET') currentAssets += acc.balance;
        else if (acc.type === 'LIABILITY') currentLiabilities += acc.balance;
      });

      const currentNetWorth = currentAssets - currentLiabilities;

      // Step 2 — monthly net cash flow over the window
      const startDate = DateUtils.subMonths(new Date(), months).toISOString();
      const endDate = new Date().toISOString();

      const cashFlowByMonth = await Transaction.aggregate([
        {
          $match: {
            user: userObjectId,
            type: { $in: ['INCOME', 'EXPENSE'] },
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $addFields: { yearMonth: { $substr: ['$date', 0, 7] } }
        },
        {
          $group: {
            _id: { yearMonth: '$yearMonth', type: '$type' },
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: '$_id.yearMonth',
            income: {
              $sum: { $cond: [{ $eq: ['$_id.type', 'INCOME'] }, '$totalAmount', 0] }
            },
            expense: {
              $sum: { $cond: [{ $eq: ['$_id.type', 'EXPENSE'] }, '$totalAmount', 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Step 3 — build the month list (fill gaps with 0 flow)
      const monthMap = {};
      cashFlowByMonth.forEach(m => {
        monthMap[m._id] = m.income - m.expense;
      });

      // Generate ordered list of YYYY-MM strings for the window
      const monthKeys = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = DateUtils.subMonths(new Date(), i);
        const key = d.toISOString().substring(0, 7);
        monthKeys.push(key);
      }

      // Step 4 — walk backwards from current net worth
      // currentNetWorth is end-of-this-month value
      // For each past month: past_netWorth = current - sum(all flows after that month)
      const trend = [];
      let runningNetWorth = currentNetWorth;

      // Walk from most recent to oldest, then reverse
      const reversed = [...monthKeys].reverse();
      for (const key of reversed) {
        trend.unshift({
          month: key,
          netWorth: runningNetWorth,
          assets: currentAssets, // note: simplified — full asset history needs event sourcing
          liabilities: currentLiabilities,
          netCashFlow: monthMap[key] || 0
        });
        runningNetWorth -= (monthMap[key] || 0);
      }

      res.json({
        success: true,
        data: trend,
        current: {
          netWorth: currentNetWorth,
          assets: currentAssets,
          liabilities: currentLiabilities
        },
        period: { start: startDate, end: endDate }
      });
    } catch (error) {
      logger.error('Net worth trend error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ─── NEW: Budget Comparison ───────────────────────────────────────────────
  /**
   * Budgeted vs actual spending for the current period.
   * Query params:
   *   ?periodKey=2025-01  (YYYY-MM for monthly, YYYY-Www for weekly)
   *   ?period=MONTHLY     (default MONTHLY)
   */
  static async getBudgetComparison(req, res) {
    try {
      const userId = req.user.id;
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const period = (req.query.period || 'MONTHLY').toUpperCase();

      // Default periodKey to current month if not provided
      const now = new Date();
      const defaultPeriodKey = now.toISOString().substring(0, 7); // YYYY-MM
      const periodKey = req.query.periodKey || defaultPeriodKey;

      // Derive date range from periodKey
      let startDate, endDate;

      if (period === 'MONTHLY') {
        // periodKey format: YYYY-MM
        const [year, month] = periodKey.split('-').map(Number);
        startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
        endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
      } else {
        // WEEKLY — periodKey format: YYYY-Www
        // Fall back to current week
        startDate = DateUtils.startOfWeek(now).toISOString();
        endDate = DateUtils.endOfWeek(now).toISOString();
      }

      // Fetch all active budgets for this period
      const budgets = await Budget.find({
        user: userObjectId,
        periodKey,
        isActive: true
      }).populate('category', 'name icon color type');

      if (budgets.length === 0) {
        return res.json({
          success: true,
          data: [],
          summary: { totalBudgeted: 0, totalSpent: 0, totalRemaining: 0 },
          period: { key: periodKey, start: startDate, end: endDate }
        });
      }

      // Get actual spending per category in this period
      const categoryIds = budgets.map(b => b.category._id);

      const actualSpending = await Transaction.aggregate([
        {
          $match: {
            user: userObjectId,
            type: 'EXPENSE',
            category: { $in: categoryIds },
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        }
      ]);

      // Build lookup map: categoryId → actual spending
      const spendingMap = {};
      actualSpending.forEach(s => {
        spendingMap[s._id.toString()] = {
          totalSpent: s.totalSpent,
          transactionCount: s.transactionCount
        };
      });

      // Merge budgets with actuals
      const comparison = budgets.map(budget => {
        const catId = budget.category._id.toString();
        const actual = spendingMap[catId] || { totalSpent: 0, transactionCount: 0 };
        const budgetedAmount = budget.amount + (budget.carryOver?.enabled ? budget.carryOver.amount : 0);
        const remaining = budgetedAmount - actual.totalSpent;
        const percentageUsed = budgetedAmount > 0
          ? parseFloat(((actual.totalSpent / budgetedAmount) * 100).toFixed(1))
          : 0;

        return {
          budgetId: budget._id,
          category: budget.category,
          budgetedAmount,
          carryOverAmount: budget.carryOver?.enabled ? budget.carryOver.amount : 0,
          spent: actual.totalSpent,
          remaining,
          percentageUsed,
          transactionCount: actual.transactionCount,
          isOverBudget: actual.totalSpent > budgetedAmount,
          status: percentageUsed >= 100
            ? 'OVER'
            : percentageUsed >= 80
              ? 'WARNING'
              : 'OK'
        };
      });

      // Sort: over budget first, then by percentage used desc
      comparison.sort((a, b) => {
        if (a.isOverBudget !== b.isOverBudget) return a.isOverBudget ? -1 : 1;
        return b.percentageUsed - a.percentageUsed;
      });

      const totalBudgeted = comparison.reduce((sum, c) => sum + c.budgetedAmount, 0);
      const totalSpent = comparison.reduce((sum, c) => sum + c.spent, 0);

      res.json({
        success: true,
        data: comparison,
        summary: {
          totalBudgeted,
          totalSpent,
          totalRemaining: totalBudgeted - totalSpent,
          overBudgetCount: comparison.filter(c => c.isOverBudget).length,
          warningCount: comparison.filter(c => c.status === 'WARNING').length
        },
        period: { key: periodKey, start: startDate, end: endDate }
      });
    } catch (error) {
      logger.error('Budget comparison error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ─── NEW: Spending Trends ─────────────────────────────────────────────────
  /**
   * Weekly spending breakdown for the last N weeks, grouped by category.
   * Useful for spotting which categories are creeping up over time.
   * Query params:
   *   ?weeks=8        (default 8)
   *   ?categoryId=xxx (optional — filter to one category)
   */
  static async getSpendingTrends(req, res) {
    try {
      const userId = req.user.id;
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const weeks = Math.min(parseInt(req.query.weeks) || 8, 26);
      const { categoryId } = req.query;

      const startDate = DateUtils.subWeeks(new Date(), weeks).toISOString();
      const endDate = new Date().toISOString();

      const matchStage = {
        user: userObjectId,
        type: 'EXPENSE',
        date: { $gte: startDate, $lte: endDate }
      };

      if (categoryId) {
        matchStage.category = new mongoose.Types.ObjectId(categoryId);
      }

      const result = await Transaction.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: '$categoryInfo' },
        {
          // ISO week: YYYY-Www  e.g. 2025-W03
          $addFields: {
            isoYear: { $isoWeekYear: { $dateFromString: { dateString: '$date' } } },
            isoWeek: { $isoWeek: { $dateFromString: { dateString: '$date' } } }
          }
        },
        {
          $group: {
            _id: {
              isoYear: '$isoYear',
              isoWeek: '$isoWeek',
              categoryId: '$category',
              categoryName: '$categoryInfo.name',
              categoryColor: '$categoryInfo.color',
              categoryIcon: '$categoryInfo.icon'
            },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: {
              isoYear: '$_id.isoYear',
              isoWeek: '$_id.isoWeek'
            },
            weekLabel: {
              $first: {
                $concat: [
                  { $toString: '$_id.isoYear' },
                  '-W',
                  {
                    $cond: [
                      { $lt: ['$_id.isoWeek', 10] },
                      { $concat: ['0', { $toString: '$_id.isoWeek' }] },
                      { $toString: '$_id.isoWeek' }
                    ]
                  }
                ]
              }
            },
            categories: {
              $push: {
                categoryId: '$_id.categoryId',
                categoryName: '$_id.categoryName',
                categoryColor: '$_id.categoryColor',
                categoryIcon: '$_id.categoryIcon',
                totalAmount: '$totalAmount',
                transactionCount: '$transactionCount'
              }
            },
            weekTotal: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.isoYear': 1, '_id.isoWeek': 1 } }
      ]);

      // Rolling average: 4-week moving average of weekly total
      const totals = result.map(w => w.weekTotal);
      const withMovingAvg = result.map((week, i) => {
        const window = totals.slice(Math.max(0, i - 3), i + 1);
        const movingAvg = Math.round(window.reduce((a, b) => a + b, 0) / window.length);
        return { ...week, movingAvg };
      });

      res.json({
        success: true,
        data: withMovingAvg,
        period: { start: startDate, end: endDate, weeks }
      });
    } catch (error) {
      logger.error('Spending trends error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = AnalyticsController;