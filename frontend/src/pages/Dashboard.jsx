import { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { useCurrency } from '../context/CurrencyContext';
import { transactionAPI } from '../api/transactionAPI';
import { formatMoney } from '../utils/moneyUtils';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { netWorth, totalAssets, totalLiabilities, accounts, loading: accountsLoading } = useAccounts();
    const { currency } = useCurrency();
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    useEffect(() => {
        const fetchRecentTransactions = async () => {
            setTransactionsLoading(true);
            try {
                const data = await transactionAPI.getRecentTransactions(10);
                // Ensure we extract the array from the response object
                const list = Array.isArray(data) ? data : (data?.transactions || []);
                setRecentTransactions(list);
            } catch (error) {
                console.error('Error fetching recent transactions:', error);
                setRecentTransactions([]); // FORCE empty array on failure
            } finally {
                setTransactionsLoading(false);
            }
        };

        fetchRecentTransactions();
    }, []);

    const getTransactionTypeColor = (type) => {
        switch (type) {
            case 'INCOME': return '#10B981';
            case 'EXPENSE': return '#EF4444';
            case 'TRANSFER': return '#3B82F6';
            default: return '#6B7280';
        }
    };

    if (accountsLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Dashboard</h1>
                <p className="dashboard-subtitle">Welcome back! Here's your financial overview.</p>
            </header>

            {/* Net Worth Section */}
            <div className="stats-grid">
                <div className="stat-card net-worth-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Net Worth</h3>
                        <p className="stat-value" style={{
                            color: netWorth >= 0 ? '#10B981' : '#EF4444'
                        }}>
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
                        <p className="stat-value">
                            {formatMoney(totalLiabilities, currency.symbol, currency.subunitToUnit)}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🏦</div>
                    <div className="stat-content">
                        <h3>Accounts</h3>
                        <p className="stat-value">{accounts.length}</p>
                    </div>
                </div>
            </div>

            {/* Accounts Overview */}
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
                                        {account.type}
                                    </span>
                                </div>
                                <p className="account-balance">
                                    {formatMoney(account.balance, currency.symbol, currency.subunitToUnit)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Recent Transactions */}
            <section className="dashboard-section">
                <div className="section-header">
                    <h2>Recent Transactions</h2>
                    <a href="/transactions" className="view-all-link">View All →</a>
                </div>
                <div className="transactions-list">
                    {transactionsLoading ? (
                        <div className="loading-mini">Loading transactions...</div>
                    ) : Array.isArray(recentTransactions) && recentTransactions.length === 0 ? (
                        <div className="empty-state">
                            <p>No transactions yet. Start tracking your finances!</p>
                        </div>
                    ) : Array.isArray(recentTransactions) ? (
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
                                        {/* Added optional chaining ?. to account */}
                                        {transaction.account?.name || 'Unknown Account'} • {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="transaction-amount" style={{
                                    color: getTransactionTypeColor(transaction.type)
                                }}>
                                    {transaction.type === 'EXPENSE' ? '-' : '+'}
                                    {formatMoney(transaction.amount, currency.symbol, currency.subunitToUnit)}
                                </div>
                            </div>
                        ))
                    ) : null}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="dashboard-section">
                <h2>Quick Actions</h2>
                <div className="quick-actions">
                    <a href="/transactions?action=create" className="action-button primary">
                        <span>➕</span>
                        <span>Add Transaction</span>
                    </a>
                    <a href="/accounts?action=create" className="action-button">
                        <span>🏦</span>
                        <span>New Account</span>
                    </a>
                    <a href="/budgets" className="action-button">
                        <span>📊</span>
                        <span>Manage Budgets</span>
                    </a>
                    <a href="/baby-steps" className="action-button">
                        <span>🪜</span>
                        <span>Baby Steps</span>
                    </a>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;