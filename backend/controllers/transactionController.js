const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const LedgerService = require('../services/ledgerService');
const BudgetService = require('../services/budgetService');
const PaginationService = require('../services/paginationService');
const DateUtils = require('../utils/dateUtils');
const MoneyUtils = require('../utils/moneyUtils');
const logger = require('../utils/logger');

class TransactionController {
  /**
   * Create transaction (INCOME or EXPENSE)
   * POST /api/transactions
   */
  static async createTransaction(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { type, amount, account, category, date, description, notes, tags } = req.body;
      const userId = req.user.id;

      // Validate amount - frontend already sends kobo/subunits
      const amountInSubunits = Math.round(Math.abs(parseFloat(amount)));

      // Validate ownership
      const accountDoc = await Account.findOne({ _id: account, user: userId }).session(session);
      if (!accountDoc) {
        throw new Error('Account not found or unauthorized');
      }

      const categoryDoc = await Category.findOne({ _id: category, user: userId }).session(session);
      if (!categoryDoc) {
        throw new Error('Category not found or unauthorized');
      }

      // Validate category type matches transaction type
      if (categoryDoc.type !== type) {
        throw new Error(`Category type must be ${type}`);
      }

      // Create transaction
      const transaction = new Transaction({
        user: userId,
        type,
        amount: amountInSubunits,
        account,
        category,
        date: date || new Date().toISOString(),
        description,
        notes,
        tags
      });

      await transaction.save({ session });

      // Update account balance via ledger
      if (type === 'INCOME') {
        await LedgerService.recordIncome(account, transaction.amount, session);
      } else if (type === 'EXPENSE') {
        await LedgerService.recordExpense(account, transaction.amount, session);

        // Update budget spent
        const periodKey = DateUtils.getMonthlyPeriodKey(new Date(date));
        await BudgetService.updateBudgetSpent(userId, category, periodKey);
      }

      await session.commitTransaction();

      // Populate for response
      await transaction.populate(['account', 'category']);

      logger.info(`Created ${type} transaction ${transaction._id} for user ${userId}`);

      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Create transaction error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Update transaction
   * PUT /api/transactions/:id
   */
  static async updateTransaction(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Find existing transaction
      const existingTransaction = await Transaction.findOne({
        _id: id,
        user: userId
      }).session(session);

      if (!existingTransaction) {
        throw new Error('Transaction not found or unauthorized');
      }

      // CRITICAL: Reverse old transaction's effect
      await LedgerService.reverseTransaction(existingTransaction, session);

      // Validate new amount if provided - frontend already sends kobo/subunits
      if (updates.amount) {
        updates.amount = Math.round(Math.abs(parseFloat(updates.amount)));
      }

      // Validate new account if changed
      if (updates.account && updates.account !== existingTransaction.account.toString()) {
        const newAccount = await Account.findOne({
          _id: updates.account,
          user: userId
        }).session(session);
        if (!newAccount) {
          throw new Error('New account not found or unauthorized');
        }
      }

      // Validate new category if changed
      if (updates.category && updates.category !== existingTransaction.category.toString()) {
        const newCategory = await Category.findOne({
          _id: updates.category,
          user: userId
        }).session(session);
        if (!newCategory) {
          throw new Error('New category not found or unauthorized');
        }

        const transactionType = updates.type || existingTransaction.type;
        if (newCategory.type !== transactionType) {
          throw new Error(`Category type must be ${transactionType}`);
        }
      }

      // Apply updates
      Object.keys(updates).forEach(key => {
        existingTransaction[key] = updates[key];
      });

      await existingTransaction.save({ session });

      // Apply new transaction's effect
      const finalType = existingTransaction.type;
      const finalAccount = existingTransaction.account;
      const finalAmount = existingTransaction.amount;

      if (finalType === 'INCOME') {
        await LedgerService.recordIncome(finalAccount, finalAmount, session);
      } else if (finalType === 'EXPENSE') {
        await LedgerService.recordExpense(finalAccount, finalAmount, session);
      }

      await session.commitTransaction();

      await existingTransaction.populate(['account', 'category']);

      logger.info(`Updated transaction ${id} for user ${userId}`);

      res.json({
        success: true,
        data: existingTransaction
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Update transaction error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete transaction
   * DELETE /api/transactions/:id
   */
  static async deleteTransaction(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findOne({
        _id: id,
        user: userId
      }).session(session);

      if (!transaction) {
        throw new Error('Transaction not found or unauthorized');
      }

      // Reverse transaction's effect
      await LedgerService.reverseTransaction(transaction, session);

      // Delete transaction
      await Transaction.deleteOne({ _id: id }).session(session);

      await session.commitTransaction();

      logger.info(`Deleted transaction ${id} for user ${userId}`);

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Delete transaction error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Get transactions with pagination
   * GET /api/transactions
   */
  static async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        type,
        account,
        category,
        startDate,
        endDate,
        search
      } = req.query;

      // Build filter
      const filter = { user: userId };

      if (type) filter.type = type;
      if (account) filter.account = account;
      if (category) filter.category = category;

      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = startDate;
        if (endDate) filter.date.$lte = endDate;
      }

      if (search) {
        filter.$or = [
          { description: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }

      // Create query
      const query = Transaction.find(filter)
        .populate('account', 'name type subType')
        .populate('category', 'name type icon color')
        .populate('fromAccount', 'name type')
        .populate('toAccount', 'name type')
        .sort({ date: -1, createdAt: -1 });

      // Paginate
      const result = await PaginationService.paginate(query, parseInt(page), parseInt(limit));

      res.json(result);
    } catch (error) {
      logger.error('Get transactions error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get single transaction
   * GET /api/transactions/:id
   */
  static async getTransaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findOne({
        _id: id,
        user: userId
      })
        .populate('account')
        .populate('category')
        .populate('fromAccount')
        .populate('toAccount');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Get transaction error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = TransactionController;