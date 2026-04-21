// Fast 3-Click Transaction Entry
import React, { useState, useEffect } from 'react';
import { useAccountContext } from '../../context/AccountContext';
import { useCurrency } from '../../context/CurrencyContext';
import { transactionAPI } from '../../api/transactionAPI';
import { categoryAPI } from '../../api/categoryAPI';
import '../../styles/components/TransactionForm.css';
import { useToasts } from '../../context/ToastContext';

const TransactionForm = ({ initialData = null, onSuccess, onCancel }) => {
  const { accounts } = useAccountContext();
  const { toSubunits, currency } = useCurrency();
  const { pushToast } = useToasts();

  const [type, setType] = useState(initialData?.type || 'EXPENSE');
  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount / currency.subunitToUnit : '');
  const [account, setAccount] = useState(initialData?.account?._id || '');
  const [category, setCategory] = useState(initialData?.category?._id || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    // Prevent invalid state: category must match the current type.
    setCategory('');
  }, [type]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll({ type });
      const cats = Array.isArray(response) ? response : (response?.data || []);
      setCategories(cats);
    } catch (err) {
      setCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const amountSubunits = toSubunits(parseFloat(amount));
      if (!Number.isInteger(amountSubunits) || amountSubunits <= 0) {
        throw new Error('Enter an amount greater than zero');
      }

      const transactionData = {
        type,
        amount: amountSubunits,
        account,
        category,
        date: new Date(date).toISOString(),
        description,
        notes
      };

      if (initialData) {
        await transactionAPI.updateTransaction(initialData._id, transactionData);
      } else {
        await transactionAPI.createTransaction(transactionData);
      }

      if (onSuccess) onSuccess();
      pushToast({ type: 'success', title: initialData ? 'Transaction updated' : 'Transaction created' });
    } catch (err) {
      setError(err.message);
      pushToast({ type: 'error', title: 'Transaction failed', message: err.message || 'Transaction failed' });
    } finally {
      setLoading(false);
    }
  };

  const assetAccounts = accounts.filter(acc => acc.type === 'ASSET' && acc.isActive);

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>{initialData ? 'Edit Transaction' : 'New Transaction'}</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Transaction Type */}
      <div className="form-group type-selector">
        <label>Type</label>
        <div className="type-buttons">
          <button
            type="button"
            className={`type-btn ${type === 'INCOME' ? 'active income' : ''}`}
            onClick={() => setType('INCOME')}
          >
            💰 Income
          </button>
          <button
            type="button"
            className={`type-btn ${type === 'EXPENSE' ? 'active expense' : ''}`}
            onClick={() => setType('EXPENSE')}
          >
            💸 Expense
          </button>
        </div>
      </div>

      {/* Amount - Large Input for Fast Entry */}
      <div className="form-group">
        <label>Amount *</label>
        <div className="amount-input-group">
          <span className="currency-symbol">{currency.symbol}</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            className="amount-input"
            autoFocus
          />
        </div>
      </div>

      {/* Account Dropdown */}
      <div className="form-group">
        <label>Account *</label>
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          required
          className="form-select"
        >
          <option value="">Select Account</option>
          {assetAccounts.map(acc => (
            <option key={acc._id} value={acc._id}>
              {acc.name} - {acc.subType}
            </option>
          ))}
        </select>
      </div>

      {/* Category Dropdown */}
      <div className="form-group">
        <label>Category *</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="form-select"
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="form-group">
        <label>Date *</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="form-input"
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this for?"
          className="form-input"
          maxLength={500}
        />
      </div>

      {/* Notes (Collapsible) */}
      <details className="form-group">
        <summary>Additional Notes</summary>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional details..."
          className="form-textarea"
          rows={3}
          maxLength={1000}
        />
      </details>

      {/* Action Buttons */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;