const Account = require('../models/Account');
const LedgerService = require('../services/ledgerService');
const PaginationService = require('../services/paginationService');
const MoneyUtils = require('../utils/moneyUtils');
const logger = require('../utils/logger');

class AccountController {
  /**
   * Get all accounts for the authenticated user
   * GET /api/accounts
   */
  static async getAll(req, res) {
    try {
      const userId = req.user.id;
      const { type, subType, includeInactive } = req.query;

      // Build filter
      const filter = { user: userId };
      if (type) filter.type = type.toUpperCase();
      if (subType) filter.subType = subType.toUpperCase();
      if (!includeInactive) filter.isActive = true;

      const accounts = await Account.find(filter).sort({ order: 1, createdAt: 1 });

      // Group accounts by type
      const grouped = {
        assets: accounts.filter(acc => acc.type === 'ASSET'),
        liabilities: accounts.filter(acc => acc.type === 'LIABILITY'),
        equity: accounts.filter(acc => acc.type === 'EQUITY')
      };

      // Calculate totals
      const totals = await LedgerService.calculateNetWorth(userId);

      logger.info(`Fetched ${accounts.length} accounts for user ${userId}`);

      res.json({
        success: true,
        data: accounts,
        grouped,
        totals,
        count: accounts.length
      });
    } catch (error) {
      logger.error('Get all accounts error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get a single account by ID
   * GET /api/accounts/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const account = await Account.findOne({
        _id: id,
        user: userId
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      logger.info(`Fetched account ${id} for user ${userId}`);

      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error('Get account by ID error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Create a new account
   * POST /api/accounts
   */
  static async create(req, res) {
    try {
      const userId = req.user.id;
      const {
        name,
        type,
        subType,
        balance = 0,
        includeInTotal = true,
        currency,
        icon,
        color,
        isEmergencyFund = false,
        creditCardDetails,
        loanDetails,
        notes
      } = req.body;

      // Validate and convert balance
      let balanceInSubunits = 0;
      if (balance && balance !== 0) {
        const balanceNum = parseFloat(balance);
        if (balanceNum < 0) {
          return res.status(400).json({
            success: false,
            message: 'Balance cannot be negative'
          });
        }
        // Frontend already sends kobo/subunits, just ensure it's an integer
        balanceInSubunits = Math.round(Math.abs(balanceNum));
      }

      const accountData = {
        user: userId,
        name,
        type: type.toUpperCase(),
        subType: subType.toUpperCase(),
        balance: balanceInSubunits,
        includeInTotal,
        currency: currency || req.user.currency.code,
        icon,
        color,
        isEmergencyFund: !!isEmergencyFund,
        notes
      };

      // Add type-specific details
      if (subType.toUpperCase() === 'CREDIT_CARD' && creditCardDetails) {
        accountData.creditCardDetails = {
          creditLimit: MoneyUtils.toSubunits(Math.abs(parseFloat(creditCardDetails.creditLimit || 0))),
          billingCycleDay: creditCardDetails.billingCycleDay,
          statementDate: creditCardDetails.statementDate,
          dueDate: creditCardDetails.dueDate
        };
      }

      if (subType.toUpperCase() === 'LOAN' && loanDetails) {
        accountData.loanDetails = {
          originalAmount: MoneyUtils.toSubunits(Math.abs(parseFloat(loanDetails.originalAmount || 0))),
          interestRate: loanDetails.interestRate,
          minimumPayment: MoneyUtils.toSubunits(Math.abs(parseFloat(loanDetails.minimumPayment || 0))),
          startDate: loanDetails.startDate,
          endDate: loanDetails.endDate
        };
      }

      const account = await Account.create(accountData);

      logger.info(`Created account ${account.name} (${account.type}) for user ${userId} with balance ${balanceInSubunits}`);

      res.status(201).json({
        success: true,
        data: account,
        message: 'Account created successfully'
      });
    } catch (error) {
      logger.error('Create account error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update an account
   * PUT /api/accounts/:id
   * NOTE: Balance cannot be updated directly - use transactions
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Prevent direct balance updates
      if (updates.balance !== undefined) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update balance directly. Use transactions to modify balance.'
        });
      }

      // Prevent changing user
      delete updates.user;
      delete updates.createdAt;

      // Convert monetary values if present
      if (updates.creditCardDetails?.creditLimit) {
        updates.creditCardDetails.creditLimit = MoneyUtils.toSubunits(Math.abs(parseFloat(updates.creditCardDetails.creditLimit)));
      }

      if (updates.loanDetails) {
        if (updates.loanDetails.originalAmount) {
          updates.loanDetails.originalAmount = MoneyUtils.toSubunits(Math.abs(parseFloat(updates.loanDetails.originalAmount)));
        }
        if (updates.loanDetails.minimumPayment) {
          updates.loanDetails.minimumPayment = MoneyUtils.toSubunits(Math.abs(parseFloat(updates.loanDetails.minimumPayment)));
        }
      }

      const account = await Account.findOneAndUpdate(
        { _id: id, user: userId },
        updates,
        { new: true, runValidators: true }
      );

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      logger.info(`Updated account ${id} for user ${userId}`);

      res.json({
        success: true,
        data: account,
        message: 'Account updated successfully'
      });
    } catch (error) {
      logger.error('Update account error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete an account (soft delete)
   * DELETE /api/accounts/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const account = await Account.findOne({ _id: id, user: userId });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Check if account has balance
      if (account.balance !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete account with non-zero balance. Please transfer funds first.'
        });
      }

      // Soft delete
      account.isActive = false;
      await account.save();

      logger.info(`Deleted account ${id} for user ${userId}`);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Delete account error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get account balance
   * GET /api/accounts/:id/balance
   */
  static async getBalance(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const account = await Account.findOne({
        _id: id,
        user: userId
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      const balanceFormatted = MoneyUtils.format(
        account.balance,
        req.user.currency.symbol,
        req.user.currency.subunitToUnit
      );

      res.json({
        success: true,
        data: {
          accountId: account._id,
          accountName: account.name,
          balance: account.balance,
          balanceFormatted,
          currency: account.currency
        }
      });
    } catch (error) {
      logger.error('Get balance error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get net worth summary
   * GET /api/accounts/summary/networth
   */
  static async getNetWorth(req, res) {
    try {
      const userId = req.user.id;

      const totals = await LedgerService.calculateNetWorth(userId);

      const formatted = {
        assets: MoneyUtils.format(totals.assets, req.user.currency.symbol, req.user.currency.subunitToUnit),
        liabilities: MoneyUtils.format(totals.liabilities, req.user.currency.symbol, req.user.currency.subunitToUnit),
        netWorth: MoneyUtils.format(Math.abs(totals.netWorth), req.user.currency.symbol, req.user.currency.subunitToUnit)
      };

      res.json({
        success: true,
        data: {
          assets: totals.assets,
          liabilities: totals.liabilities,
          netWorth: totals.netWorth,
          formatted
        }
      });
    } catch (error) {
      logger.error('Get net worth error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AccountController;
