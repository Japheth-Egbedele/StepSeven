import { useState } from 'react';
import { useAccountContext } from '../../context/AccountContext';
import { useCurrency } from '../../context/CurrencyContext';
import { transactionAPI } from '../../api/transactionAPI';
import { categoryAPI } from '../../api/categoryAPI';
import { useEffect } from 'react';
import '../../styles/components/TransferForm.css';


const TransferForm = ({ onSuccess, onCancel }) => {
  const { accounts } = useAccountContext();
  const { currency } = useCurrency();

  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Fee fields
  const [hasFee, setHasFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeCategories, setFeeCategories] = useState([]);
  const [feeCategory, setFeeCategory] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeAccounts = accounts.filter(a => a.isActive);

  useEffect(() => {
    // Load expense categories for the fee
    categoryAPI.getAll({ type: 'EXPENSE' })
      .then(res => {
        const cats = res?.data || res || [];
        setFeeCategories(cats);
        // Pre-select Bank Charges if it exists
        const bankCharges = cats.find(c =>
          c.name.toLowerCase().includes('bank') || c.name.toLowerCase().includes('charge')
        );
        if (bankCharges) setFeeCategory(bankCharges._id);
      })
      .catch(() => {});
  }, []);

  const validate = () => {
    if (!fromAccount) return 'Select a source account';
    if (!toAccount) return 'Select a destination account';
    if (fromAccount === toAccount) return 'Source and destination must be different';
    if (!amount || parseFloat(amount) <= 0) return 'Enter a valid amount';
    if (hasFee && (!feeAmount || parseFloat(feeAmount) <= 0)) return 'Enter a valid fee amount';
    if (hasFee && !feeCategory) return 'Select a category for the fee';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);

    try {
      const amountKobo = Math.round(parseFloat(amount) * currency.subunitToUnit);
      const transferDate = new Date(date).toISOString();

      // 1 — Create the transfer
      await transactionAPI.createTransfer({
        fromAccount,
        toAccount,
        amount: amountKobo,
        date: transferDate,
        description: description.trim() || `Transfer to account`
      });

      // 2 — If there's a fee, create a separate expense transaction on the source account
      if (hasFee && feeAmount) {
        const feeKobo = Math.round(parseFloat(feeAmount) * currency.subunitToUnit);
        await transactionAPI.createTransaction({
          type: 'EXPENSE',
          amount: feeKobo,
          account: fromAccount,
          category: feeCategory,
          date: transferDate,
          description: `Transfer fee${description ? ` — ${description}` : ''}`
        });
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>🔄 Transfer Money</h2>

      {error && <div className="error-message">{error}</div>}

      {/* From → To */}
      <div className="transfer-accounts">
        <div className="form-group">
          <label>From Account *</label>
          <select
            value={fromAccount}
            onChange={e => setFromAccount(e.target.value)}
            required
            className="form-select"
          >
            <option value="">Select account</option>
            {activeAccounts.map(acc => (
              <option key={acc._id} value={acc._id} disabled={acc._id === toAccount}>
                {acc.name} — {formatBalance(acc.balance, currency)}
              </option>
            ))}
          </select>
        </div>

        <div className="transfer-arrow">→</div>

        <div className="form-group">
          <label>To Account *</label>
          <select
            value={toAccount}
            onChange={e => setToAccount(e.target.value)}
            required
            className="form-select"
          >
            <option value="">Select account</option>
            {activeAccounts.map(acc => (
              <option key={acc._id} value={acc._id} disabled={acc._id === fromAccount}>
                {acc.name} — {formatBalance(acc.balance, currency)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount */}
      <div className="form-group">
        <label>Amount *</label>
        <div className="amount-input-group">
          <span className="currency-symbol">{currency.symbol}</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            className="amount-input"
            autoFocus
          />
        </div>
      </div>

      {/* Date */}
      <div className="form-group">
        <label>Date *</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
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
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. PalmPay top-up"
          className="form-input"
          maxLength={200}
        />
      </div>

      {/* Fee toggle */}
      <div className="fee-toggle">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={hasFee}
            onChange={e => setHasFee(e.target.checked)}
          />
          <span>Include transfer fee / charge</span>
        </label>
      </div>

      {/* Fee fields — only shown when toggled */}
      {hasFee && (
        <div className="fee-section">
          <div className="fee-row">
            <div className="form-group">
              <label>Fee Amount *</label>
              <div className="amount-input-group">
                <span className="currency-symbol">{currency.symbol}</span>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={e => setFeeAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="amount-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Fee Category *</label>
              <select
                value={feeCategory}
                onChange={e => setFeeCategory(e.target.value)}
                className="form-select"
              >
                <option value="">Select category</option>
                {feeCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <small className="form-hint">
            The fee will be logged as a separate expense on the source account
          </small>
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Processing...' : `Transfer ${amount ? currency.symbol + parseFloat(amount || 0).toLocaleString() : ''}`}
        </button>
      </div>
    </form>
  );
};

// Helper — show balance next to account name in dropdown
const formatBalance = (balanceKobo, currency) => {
  return currency.symbol + (balanceKobo / currency.subunitToUnit).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export default TransferForm;