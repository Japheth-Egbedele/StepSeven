// src/pages/Accounts.jsx
import { useState } from 'react';
import { useAccounts } from '../context/AccountContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatMoney, parseMoneyInput, isValidMoneyInput } from '../utils/moneyUtils';
import '../styles/Accounts.css';

const Accounts = () => {
  const { accounts, assets, liabilities, createAccount, updateAccount, deleteAccount, loading } = useAccounts();
  const { currency } = useCurrency();

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ASSET',
    subType: 'BANK',
    balance: '',
    isEmergencyFund: false,
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Account name is required');
      return;
    }

    if (!isValidMoneyInput(formData.balance)) {
      setFormError('Please enter a valid balance');
      return;
    }

    setSubmitting(true);

    try {
      const accountData = {
        name: formData.name.trim(),
        type: formData.type,
        subType: formData.subType,
        balance: parseMoneyInput(formData.balance, currency.subunitToUnit),
        isEmergencyFund: formData.isEmergencyFund,
        description: formData.description.trim()
      };

      if (editingAccount) {
        await updateAccount(editingAccount._id, accountData);
      } else {
        await createAccount(accountData);
      }

      handleCloseModal();
    } catch (error) {
      setFormError(error.message || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      subType: account.subType || 'BANK',
      balance: (account.balance / currency.subunitToUnit).toFixed(2),
      isEmergencyFund: account.isEmergencyFund || false,
      description: account.description || ''
    });
  };

  const handleDelete = async (accountId) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteAccount(accountId);
    } catch (error) {
      alert(error.message || 'Failed to delete account');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'ASSET',
      subType: 'BANK',
      balance: '',
      isEmergencyFund: false,
      description: ''
    });
    setFormError('');
  };

  const renderAccountCard = (account) => (
    <div key={account._id} className="account-card">
      <div className="account-card-body">
        <div className="account-header">
          <div>
            <h3>{account.name}</h3>
            <span className={`account-type-badge ${account.type.toLowerCase()}`}>
              {account.type}
            </span>
          </div>
          <div className="account-actions">
            <button onClick={() => handleEdit(account)} className="btn-icon" title="Edit">
              ✏️
            </button>
            <button onClick={() => handleDelete(account._id)} className="btn-icon" title="Delete">
              🗑️
            </button>
          </div>
        </div>

        <div className="account-balance-section">
          <p className="balance-label">Current Balance</p>
          <p className="balance-amount" style={{
            color: account.balance >= 0 ? '#10B981' : '#EF4444'
          }}>
            {formatMoney(account.balance, currency.symbol, currency.subunitToUnit)}
          </p>
        </div>

        {account.description && (
          <p className="account-description">{account.description}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="accounts-loading">
        <div className="spinner"></div>
        <p>Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="accounts-page">
      <header className="page-header">
        <div>
          <h1>Accounts</h1>
          <p className="page-subtitle">Manage your bank accounts and track balances</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          ➕ Add Account
        </button>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card assets">
          <h3>Total Assets</h3>
          <p className="summary-amount">
            {formatMoney(assets.reduce((sum, a) => sum + a.balance, 0), currency.symbol, currency.subunitToUnit)}
          </p>
          <span className="summary-count">{assets.length} accounts</span>
        </div>
        <div className="summary-card liabilities">
          <h3>Total Liabilities</h3>
          <p className="summary-amount">
            {formatMoney(liabilities.reduce((sum, l) => sum + l.balance, 0), currency.symbol, currency.subunitToUnit)}
          </p>
          <span className="summary-count">{liabilities.length} accounts</span>
        </div>
      </div>

      {/* Assets Section */}
      {assets.length > 0 && (
        <section className="accounts-section">
          <h2>Assets</h2>
          <div className="accounts-grid">
            {assets.map(renderAccountCard)}
          </div>
        </section>
      )}

      {/* Liabilities Section */}
      {liabilities.length > 0 && (
        <section className="accounts-section">
          <h2>Liabilities</h2>
          <div className="accounts-grid">
            {liabilities.map(renderAccountCard)}
          </div>
        </section>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="empty-state-large">
          <div className="empty-icon">🏦</div>
          <h2>No Accounts Yet</h2>
          <p>Create your first account to start tracking your finances</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Your First Account
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAccount ? 'Edit Account' : 'Add New Account'}</h2>
              <button onClick={handleCloseModal} className="btn-close">×</button>
            </div>

            <form onSubmit={handleSubmit} className="account-form">
              {formError && (
                <div className="form-error">{formError}</div>
              )}

              <div className="form-group">
                <label htmlFor="name">Account Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., GTBank Savings, PalmPay"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Account Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="ASSET">Asset (Cash, Bank, Savings)</option>
                  <option value="LIABILITY">Liability (Loan, Credit Card)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subType">Sub-Type *</label>
                <select
                  id="subType"
                  name="subType"
                  value={formData.subType}
                  onChange={handleInputChange}
                  required
                >
                  {formData.type === 'ASSET' ? (
                    <>
                      <option value="CASH">Cash (Wallet, Physical)</option>
                      <option value="BANK">Bank / Mobile Money</option>
                      <option value="INVESTMENT">Investment</option>
                    </>
                  ) : (
                    <>
                      <option value="LOAN">Loan</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="balance">Current Balance *</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">{currency.symbol}</span>
                  <input
                    type="text"
                    id="balance"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                {formData.type === 'LIABILITY' && (
                  <small className="form-hint">Enter the amount you owe</small>
                )}
              </div>

              {/* Emergency fund flag — only for ASSET accounts */}
              {formData.type === 'ASSET' && (
                <div className="form-group form-group-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isEmergencyFund"
                      checked={formData.isEmergencyFund || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        isEmergencyFund: e.target.checked
                      }))}
                    />
                    <span>This is my Emergency Fund account</span>
                  </label>
                  <small className="form-hint">
                    Marks this account for Baby Steps tracking
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">Notes (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Any notes about this account..."
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;