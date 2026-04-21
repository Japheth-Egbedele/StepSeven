// src/pages/Budgets.jsx
import { useState, useEffect } from 'react';
import { useBudgets } from '../context/BudgetContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatMoney, parseMoneyInput, isValidMoneyInput } from '../utils/moneyUtils';
import '../styles/Budgets.css';
import { categoryAPI } from '../api/categoryAPI';
import { useToasts } from '../context/ToastContext';

const Budgets = () => {
  const { budgets, currentPeriod, summary, comparison, createBudget, updateBudget, deleteBudget, changePeriod, loading } = useBudgets();
  const { currency } = useCurrency();
  const { pushToast } = useToasts();

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'MONTHLY'
  });
  const [formError, setFormError] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryAPI.getAll({ type: 'EXPENSE' })
      .then(res => setCategories(res?.data || res || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    changePeriod({ periodType: currentPeriod.periodType, year: currentPeriod.year, month: currentPeriod.month, cursorDate: currentPeriod.cursorDate });
  }, []);

  const handlePeriodChange = (direction) => {
    const { cursorDate, periodType } = currentPeriod;
    const d = new Date(cursorDate);
    const deltaDays = periodType === 'WEEKLY' ? 7 : 30; // month nav is handled by month/year in context

    if (periodType === 'WEEKLY') {
      d.setUTCDate(d.getUTCDate() + (direction === 'prev' ? -deltaDays : deltaDays));
      changePeriod({ cursorDate: d.toISOString(), periodType: 'WEEKLY' });
      return;
    }

    // MONTHLY
    const { year, month } = currentPeriod;
    let nextYear = year;
    let nextMonth = month;
    if (direction === 'prev') {
      nextMonth--;
      if (nextMonth < 1) { nextMonth = 12; nextYear--; }
    } else {
      nextMonth++;
      if (nextMonth > 12) { nextMonth = 1; nextYear++; }
    }
    changePeriod({ year: nextYear, month: nextMonth, periodType: 'MONTHLY' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.category.trim()) {
      setFormError('Category name is required');
      return;
    }

    if (!isValidMoneyInput(formData.amount)) {
      setFormError('Please enter a valid amount');
      return;
    }

    try {
      const getWeeklyPeriodKey = (date) => {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0);
        const thursday = new Date(d);
        thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
        const isoYear = thursday.getUTCFullYear();
        const yearStart = new Date(Date.UTC(isoYear, 0, 1));
        const week = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
        return `${isoYear}-W${String(week).padStart(2, '0')}`;
      };

      const now = new Date();
      const fallbackMonthlyKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const fallbackWeeklyKey = getWeeklyPeriodKey(now);

      const effectivePeriodKey = formData.period === 'WEEKLY'
        ? (currentPeriod.periodType === 'WEEKLY' ? currentPeriod.periodKey : fallbackWeeklyKey)
        : (currentPeriod.periodType === 'MONTHLY' ? currentPeriod.periodKey : fallbackMonthlyKey);

      const budgetData = {
        category: formData.category.trim(),
        amount: parseMoneyInput(formData.amount, currency.subunitToUnit),
        period: formData.period,
        periodKey: effectivePeriodKey
      };

      if (editingBudget) {
        await updateBudget(editingBudget._id, budgetData);
      } else {
        await createBudget(budgetData);
      }

      handleCloseModal();
      pushToast({ type: 'success', title: editingBudget ? 'Budget updated' : 'Budget created' });
    } catch (error) {
      setFormError(error.message || 'Failed to save budget');
      pushToast({ type: 'error', title: 'Budget failed', message: error.message || 'Failed to save budget' });
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category?.name || budget.category,
      amount: (budget.amount / currency.subunitToUnit).toFixed(2),
      period: budget.period || 'MONTHLY'
    });
    setShowModal(true);
  };

  const handleDelete = async (budgetId) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await deleteBudget(budgetId);
      pushToast({ type: 'success', title: 'Budget deleted' });
    } catch (error) {
      pushToast({ type: 'error', title: 'Delete failed', message: error.message || 'Delete failed' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setFormData({ category: '', amount: '', period: 'MONTHLY' });
    setFormError('');
  };

  const getProgressColor = (percentage) => {
    if (percentage <= 75) return '#10B981';
    if (percentage <= 90) return '#F59E0B';
    return '#EF4444';
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="budgets-loading">
        <div className="spinner"></div>
        <p>Loading budgets...</p>
      </div>
    );
  }

  // Check if budgets is an array; if not, default to 0 to prevent crashing
  const totalBudgeted = Array.isArray(budgets)
    ? budgets.reduce((sum, b) => sum + (Number(b.amount) || Number(b.limit) || 0), 0)
    : 0;

  const totalSpent = Array.isArray(budgets)
    ? budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0)
    : 0;

  const remaining = totalBudgeted - totalSpent;

  return (
    <div className="budgets-page">
      <header className="page-header">
        <div>
          <h1>{currentPeriod.periodType === 'WEEKLY' ? 'Weekly Budgets' : 'Monthly Budgets'}</h1>
          <p className="page-subtitle">Envelope-style budgeting for financial control</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          ➕ Add Budget
        </button>
      </header>

      {/* Period Selector */}
      <div className="period-selector">
        <button onClick={() => handlePeriodChange('prev')} className="btn-icon">←</button>
        <select
          value={currentPeriod.periodType}
          onChange={(e) => changePeriod({ periodType: e.target.value, year: currentPeriod.year, month: currentPeriod.month, cursorDate: currentPeriod.cursorDate })}
          className="form-select"
          style={{ maxWidth: 140 }}
        >
          <option value="MONTHLY">Monthly</option>
          <option value="WEEKLY">Weekly</option>
        </select>
        {currentPeriod.periodType === 'WEEKLY'
          ? <h2>{currentPeriod.periodKey}</h2>
          : <h2>{monthNames[currentPeriod.month - 1]} {currentPeriod.year}</h2>
        }
        <button onClick={() => handlePeriodChange('next')} className="btn-icon">→</button>
      </div>

      {/* Budget Summary */}
      <div className="budget-summary-grid">
        <div className="summary-card">
          <h3>Total Budgeted</h3>
          <p className="summary-amount">{formatMoney(totalBudgeted, currency.symbol, currency.subunitToUnit)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Spent</h3>
          <p className="summary-amount" style={{ color: '#EF4444' }}>
            {formatMoney(totalSpent, currency.symbol, currency.subunitToUnit)}
          </p>
        </div>
        <div className="summary-card">
          <h3>Remaining</h3>
          <p className="summary-amount" style={{ color: remaining >= 0 ? '#10B981' : '#EF4444' }}>
            {formatMoney(remaining, currency.symbol, currency.subunitToUnit)}
          </p>
        </div>
      </div>

      {/* Budget List */}
      <div className="budgets-list">
        {budgets.length === 0 ? (
          <div className="empty-state-large">
            <div className="empty-icon">📊</div>
            <h2>No Budgets Yet</h2>
            <p>Create your first budget to start tracking your spending</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create Your First Budget
            </button>
          </div>
        ) : (
          budgets.map(budget => {
            const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const remaining = budget.amount - budget.spent;

            return (
              <div key={budget._id} className="budget-item">
                <div className="budget-header">
                  <div>
                    <h3>{budget.category?.name || budget.category}</h3>
                    <p className="budget-amounts">
                      <span style={{ color: '#EF4444' }}>
                        {formatMoney(budget.spent, currency.symbol, currency.subunitToUnit)}
                      </span>
                      {' of '}
                      <span>{formatMoney(budget.amount, currency.symbol, currency.subunitToUnit)}</span>
                    </p>
                  </div>
                  <div className="budget-actions">
                    <button onClick={() => handleEdit(budget)} className="btn-icon">✏️</button>
                    <button onClick={() => handleDelete(budget._id)} className="btn-icon">🗑️</button>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: getProgressColor(percentage)
                    }}
                  />
                </div>

                <div className="budget-footer">
                  <span className="budget-percentage">{percentage.toFixed(0)}% used</span>
                  <span className="budget-remaining" style={{ color: remaining >= 0 ? '#10B981' : '#EF4444' }}>
                    {remaining >= 0 ? '' : '-'}
                    {formatMoney(Math.abs(remaining), currency.symbol, currency.subunitToUnit)} remaining
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</h2>
              <button onClick={handleCloseModal} className="btn-close">×</button>
            </div>

            <form onSubmit={handleSubmit} className="budget-form">
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                  className="form-select"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Budget Amount *</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">{currency.symbol}</span>
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="period">Period</label>
                <select
                  id="period"
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;