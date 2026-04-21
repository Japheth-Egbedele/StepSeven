const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const LedgerService = require('../services/ledgerService');
const logger = require('../utils/logger');

class TransferController {
  /**
   * Create transfer
   * POST /api/transactions/transfer
   */
  static async createTransfer(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { amount, fromAccount, toAccount, date, description, notes } = req.body;
      const userId = req.user.id;

      // Validate amount - frontend already sends kobo/subunits
      const amountInSubunits = Math.round(Math.abs(parseFloat(amount)));

      // Validate both accounts
      const [sourceAccount, destinationAccount] = await Promise.all([
        Account.findOne({ _id: fromAccount, user: userId }).session(session),
        Account.findOne({ _id: toAccount, user: userId }).session(session)
      ]);

      if (!sourceAccount || !destinationAccount) {
        throw new Error('One or both accounts not found or unauthorized');
      }

      if (fromAccount === toAccount) {
        throw new Error('Cannot transfer to the same account');
      }

      // Check sufficient balance
      if (sourceAccount.type === 'ASSET' && sourceAccount.balance < amountInSubunits) {
        throw new Error('Insufficient balance in source account');
      }

      // Create transfer transaction
      const transfer = new Transaction({
        user: userId,
        type: 'TRANSFER',
        amount: amountInSubunits,
        fromAccount,
        toAccount,
        date: date || new Date().toISOString(),
        description,
        notes
      });

      await transfer.save({ session });

      // Execute transfer via ledger
      await LedgerService.recordTransfer(fromAccount, toAccount, transfer.amount, session);

      await session.commitTransaction();

      await transfer.populate(['fromAccount', 'toAccount']);

      logger.info(`Created transfer ${transfer._id} for user ${userId}`);

      res.status(201).json({
        success: true,
        data: transfer
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Create transfer error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Update transfer
   * PUT /api/transactions/transfer/:id
   */
  static async updateTransfer(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Find existing transfer
      const existingTransfer = await Transaction.findOne({
        _id: id,
        user: userId,
        type: 'TRANSFER'
      }).session(session);

      if (!existingTransfer) {
        throw new Error('Transfer not found or unauthorized');
      }

      // Reverse old transfer
      await LedgerService.reverseTransaction(existingTransfer, session);

      // Validate new amount - frontend already sends kobo/subunits
      if (updates.amount) {
        updates.amount = Math.round(Math.abs(parseFloat(updates.amount)));
      }

      // Validate new accounts
      if (updates.fromAccount || updates.toAccount) {
        const fromAccountId = updates.fromAccount || existingTransfer.fromAccount;
        const toAccountId = updates.toAccount || existingTransfer.toAccount;

        if (fromAccountId.toString() === toAccountId.toString()) {
          throw new Error('Cannot transfer to the same account');
        }

        const [sourceAccount, destinationAccount] = await Promise.all([
          Account.findOne({ _id: fromAccountId, user: userId }).session(session),
          Account.findOne({ _id: toAccountId, user: userId }).session(session)
        ]);

        if (!sourceAccount || !destinationAccount) {
          throw new Error('One or both new accounts not found or unauthorized');
        }
      }

      // Apply updates
      Object.keys(updates).forEach(key => {
        existingTransfer[key] = updates[key];
      });

      await existingTransfer.save({ session });

      // Apply new transfer
      await LedgerService.recordTransfer(
        existingTransfer.fromAccount,
        existingTransfer.toAccount,
        existingTransfer.amount,
        session
      );

      await session.commitTransaction();

      await existingTransfer.populate(['fromAccount', 'toAccount']);

      logger.info(`Updated transfer ${id} for user ${userId}`);

      res.json({
        success: true,
        data: existingTransfer
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Update transfer error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete transfer
   * DELETE /api/transactions/transfer/:id
   */
  static async deleteTransfer(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const userId = req.user.id;

      const transfer = await Transaction.findOne({
        _id: id,
        user: userId,
        type: 'TRANSFER'
      }).session(session);

      if (!transfer) {
        throw new Error('Transfer not found or unauthorized');
      }

      // Reverse transfer
      await LedgerService.reverseTransaction(transfer, session);

      // Delete transfer
      await Transaction.deleteOne({ _id: id }).session(session);

      await session.commitTransaction();

      logger.info(`Deleted transfer ${id} for user ${userId}`);

      res.json({
        success: true,
        message: 'Transfer deleted successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Delete transfer error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    } finally {
      session.endSession();
    }
  }
}

module.exports = TransferController;