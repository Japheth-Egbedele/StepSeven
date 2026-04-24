import { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { useCurrency } from '../context/CurrencyContext';
import { transactionAPI } from '../api/transactionAPI';
import { babyStepAPI } from '../api/babyStepAPI';
import { analyticsAPI } from '../api/analyticsAPI';
import { formatMoney } from '../utils/moneyUtils';
import '../styles/Dashboard.css';

const DAILY_LIMIT_KOBO = 500000; // ₦5,000 in kobo — wants alert threshold

const Dashboard = () => {
  const { netWorth, totalAssets, totalLiabilities, accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const { currency } = useCurrency();

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [daysAhead, setDaysAhead] = useState(null);
  const [spendingAlert, setSpendingAlert] = useState(null);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    fetchRecentTransactions();
    fetchMetrics();
  }, []);

  const fetchRecentTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const data = await transactionAPI.getRecentTransactions(10);
      const list = Array.isArray(data) ? data : (data?.transactions || data?.data || []);
      setRecentTransactions(list);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      setRecentTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [daysRes, spendingRes] = await Promise.all([
        babyStepAPI.getDaysAhead(),
        analyticsAPI.getExpensesByCategory(startOfMonth, now.toISOString())
      ]);

      setDaysAhead(daysRes?.data || null);

      // Check Wants spending this month
      const spendingData = spendingRes?.data || [];
      const wantsCategory = spendingData.find(c =>
        c.categoryName?.toLowerCase().includes('want')
      );

      if (wantsCategory) {
        const dayOfMonth = now.getDate();
        const dailyAvg = wantsCategory.totalAmount / dayOfMonth;
        if (dailyAvg > DAILY_LIMIT_KOBO) {
          setSpendingAlert({
            category: wantsCategory.categoryName,
            totalAmount: wantsCategory.totalAmount,
            dailyAvg,
            daysIntoMonth: dayOfMonth
          });
        }
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'INCOME': return '#10B981';
      case 'EXPENSE': return '#EF4444';
      case 'TRANSFER': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getDaysAheadStatus = (days) => {
    if (days >= 90) return { color: '#10B981', label: 'Excellent' };
    if (days >= 30) return { color: '#F59E0B', label: 'Okay' };
    if (days >= 7)  return { color: '#F97316', label: 'Low' };
    return { color: '#EF4444', label: 'Critical' };
  };

  if (accountsLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const daysStatus = daysAhead ? getDaysAheadStatus(daysAhead.daysAhead) : null;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Your financial command center</p>
      </header>

      {accountsError && (
        <div className="spending-alert" role="status">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>Can’t load your data</strong>
            <p>
              {accountsError}. If you’re on mobile, this is usually an authentication/cookie issue — try logging out and back in.
            </p>
          </div>
        </div>
      )}

      {/* ── Spending Leak Alert ── */}
      {spendingAlert && (
        <div className="spending-alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>Spending Leak Detected</strong>
            <p>
              Your <strong>{spendingAlert.category}</strong> spending is averaging{' '}
              <strong>{formatMoney(Math.round(spendingAlert.dailyAvg), currency.symbol, currency.subunitToUnit)}/day</strong>{' '}
              this month — above your ₦5,000 daily limit.{' '}
              Total: {formatMoney(spendingAlert.totalAmount, currency.symbol, currency.subunitToUnit)} over {spendingAlert.daysIntoMonth} days.
            </p>
          </div>
          <button className="alert-dismiss" onClick={() => setSpendingAlert(null)}>×</button>
        </div>
      )}

      {/* ── Top Stats ── */}
      <div className="stats-grid">
        {/* Days Ahead — hero metric */}
        <div className="stat-card days-ahead-card">
          {metricsLoading ? (
            <div className="stat-loading">Loading...</div>
          ) : daysAhead ? (
            <>
              <div className="days-ahead-number" style={{ color: daysStatus.color }}>
                {daysAhead.daysAhead}
              </div>
              <div className="days-ahead-label">Days Ahead</div>
              <div className="days-ahead-status" style={{ color: daysStatus.color }}>
                {daysStatus.label}
              </div>
              <div className="days-ahead-sub">
                Burn rate: {formatMoney(daysAhead.dailyBurnRate, currency.symbol, currency.subunitToUnit)}/day
              </div>
            </>
          ) : (
            <>
              <div className="days-ahead-number" style={{ color: '#9CA3AF' }}>—</div>
              <div className="days-ahead-label">Days Ahead</div>
              <div className="days-ahead-sub">Add transactions to calculate</div>
            </>
          )}
        </div>

        <div className="stat-card net-worth-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Net Worth</h3>
            <p className="stat-value" style={{ color: netWorth >= 0 ? '#10B981' : '#EF4444' }}>
              {formatMoney(netWorth, currency.symbol, currency.subunitToUnit)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Total Assets</h3>
            <p className="stat-value">
              {formatMoney(totalAssets, currency.symbol, currency.subunitToUnit)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <h3>Total Liabilities</h3>
            <p className="stat-value" style={{ color: totalLiabilities > 0 ? '#EF4444' : '#10B981' }}>
              {formatMoney(totalLiabilities, currency.symbol, currency.subunitToUnit)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Liquid Assets breakdown (for Days Ahead context) ── */}
      {daysAhead && (
        <div className="liquid-context">
          <span className="liquid-label">💧 Liquid assets:</span>
          <span className="liquid-amount">
            {formatMoney(daysAhead.totalLiquid, currency.symbol, currency.subunitToUnit)}
          </span>
          <span className="liquid-sep">·</span>
          <span className="liquid-label">Monthly burn:</span>
          <span className="liquid-amount">
            {formatMoney(daysAhead.avgMonthlyExpense, currency.symbol, currency.subunitToUnit)}
          </span>
        </div>
      )}

      {/* ── Accounts Overview ── */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Your Accounts</h2>
          <a href="/accounts" className="view-all-link">View All →</a>
        </div>
        <div className="accounts-grid">
          {accounts.length === 0 ? (
            <div className="empty-state">
              <p>No accounts yet. <a href="/accounts">Create your first account</a></p>
            </div>
          ) : (
            accounts.slice(0, 6).map(account => (
              <div key={account._id} className="account-card-mini">
                <div className="account-card-header">
                  <h4>{account.name}</h4>
                  <span className={`account-type-badge ${account.type.toLowerCase()}`}>
                    {account.subType}
                  </span>
                </div>
                <p className="account-balance" style={{
                  color: account.balance >= 0 ? '#111827' : '#EF4444'
                }}>
                  {formatMoney(account.balance, currency.symbol, currency.subunitToUnit)}
                </p>
                {account.isEmergencyFund && (
                  <span className="emergency-badge">🛡 Emergency Fund</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Recent Transactions ── */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <a href="/transactions" className="view-all-link">View All →</a>
        </div>
        <div className="transactions-list">
          {transactionsLoading ? (
            <div className="loading-mini">Loading transactions...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet. <a href="/transactions">Log your first transaction</a></p>
            </div>
          ) : (
            recentTransactions.map(transaction => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-icon" style={{
                  backgroundColor: `${getTransactionTypeColor(transaction.type)}20`,
                  color: getTransactionTypeColor(transaction.type)
                }}>
                  {transaction.type === 'INCOME' ? '↓' : transaction.type === 'EXPENSE' ? '↑' : '⇄'}
                </div>
                <div className="transaction-details">
                  <h4>{transaction.description || transaction.category?.name || 'Transaction'}</h4>
                  <p className="transaction-meta">
                    {transaction.account?.name || transaction.fromAccount?.name || 'Account'}{' '}
                    · {transaction.date ? new Date(transaction.date).toLocaleDateString('en-NG') : 'N/A'}
                  </p>
                </div>
                <div className="transaction-amount" style={{
                  color: getTransactionTypeColor(transaction.type)
                }}>
                  {transaction.type === 'EXPENSE' ? '−' : transaction.type === 'INCOME' ? '+' : ''}
                  {formatMoney(transaction.amount, currency.symbol, currency.subunitToUnit)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <a href="/transactions?action=create" className="action-button primary">
            <span>➕</span><span>Add Transaction</span>
          </a>
          <a href="/transactions?action=transfer" className="action-button">
            <span>🔄</span><span>Transfer</span>
          </a>
          <a href="/accounts" className="action-button">
            <span>🏦</span><span>Accounts</span>
          </a>
          <a href="/baby-steps" className="action-button">
            <span>🪜</span><span>Baby Steps</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;