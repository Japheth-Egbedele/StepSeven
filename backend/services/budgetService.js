const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const DateUtils = require('../utils/dateUtils');

class BudgetService {
  /**
   * Update spent amount for a budget
   */
  static async updateBudgetSpent(userId, categoryId, periodKey) {
    const budget = await Budget.findOne({
      user: userId,
      category: categoryId,
      periodKey,
      isActive: true
    });

    if (!budget) return;

    const { startDate, endDate } = this.getPeriodDates(periodKey);

    const result = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          category: categoryId,
          type: 'EXPENSE',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    budget.spent = result.length > 0 ? result[0].totalSpent : 0;
    await budget.save();

    return budget;
  }

  /**
   * Get period dates from periodKey
   */
  static getPeriodDates(periodKey) {
    // Monthly: YYYY-MM
    if (/^\d{4}-\d{2}$/.test(periodKey)) {
      const [year, month] = periodKey.split('-');
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0)).toISOString();
      const endDate = DateUtils.endOfMonth(new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1))).toISOString();
      return { startDate, endDate };
    }

    // Weekly: YYYY-Www (ISO week)
    const weeklyMatch = /^(\d{4})-W(\d{2})$/.exec(periodKey);
    if (weeklyMatch) {
      const isoYear = parseInt(weeklyMatch[1]);
      const isoWeek = parseInt(weeklyMatch[2]);

      // ISO week 1 is the week containing Jan 4th.
      const jan4 = new Date(Date.UTC(isoYear, 0, 4));
      const week1Start = DateUtils.startOfWeek(jan4);
      const start = new Date(week1Start);
      start.setUTCDate(start.getUTCDate() + (isoWeek - 1) * 7);

      const end = DateUtils.endOfWeek(start);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }

    // Fallback: treat unknown keys as current month
    const now = new Date();
    const fallbackKey = DateUtils.getMonthlyPeriodKey(now);
    return this.getPeriodDates(fallbackKey);
  }

  /**
   * Process carry-over from previous period
   */
  static async processCarryOver(userId, periodKey) {
    const [year, month] = periodKey.split('-');
    const prevMonth = parseInt(month) === 1 ? 12 : parseInt(month) - 1;
    const prevYear = parseInt(month) === 1 ? parseInt(year) - 1 : parseInt(year);
    const prevPeriodKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const prevBudgets = await Budget.find({
      user: userId,
      periodKey: prevPeriodKey,
      isActive: true,
      'carryOver.enabled': true
    });

    const currentBudgets = await Budget.find({
      user: userId,
      periodKey,
      isActive: true
    });

    const updates = [];

    for (const prevBudget of prevBudgets) {
      const remaining = prevBudget.amount - prevBudget.spent;
      
      if (remaining > 0) {
        const currentBudget = currentBudgets.find(
          b => b.category.equals(prevBudget.category)
        );

        if (currentBudget) {
          currentBudget.carryOver.amount = remaining;
          await currentBudget.save();
          updates.push({
            category: prevBudget.category,
            carriedOver: remaining
          });
        }
      }
    }

    return updates;
  }
}

module.exports = BudgetService;
