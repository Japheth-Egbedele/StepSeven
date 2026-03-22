import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api/analyticsAPI';
import { useCurrency } from '../context/CurrencyContext';
import SpendingChart from '../components/Analytics/SpendingChart';
import { formatMoney } from '../utils/moneyUtils';
import '../styles/Analytics.css';

const Analytics = () => {
  const { currency } = useCurrency();
  const [spendingData, setSpendingData] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [netWorthData, setNetWorthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(timeRange), 1);

      const [spending, cashFlow, netWorth] = await Promise.all([
        analyticsAPI.getExpensesByCategory(startDate.toISOString(), now.toISOString()),
        analyticsAPI.getMonthlyCashFlow(parseInt(timeRange)),
        analyticsAPI.getNetWorthTrend(parseInt(timeRange))
      ]);

      setSpendingData(spending.data || []);
      setCashFlowData(cashFlow.data || []);
      setNetWorthData(netWorth.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derive current month summary from cashflow data (last item = most recent month)
  const currentMonth = cashFlowData[cashFlowData.length - 1] || null;
  const totalIncome = currentMonth?.income || 0;
  const totalExpenses = currentMonth?.expense || 0;
  const netCashFlow = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <header className="page-header">
        <div>
          <h1>Financial Analytics</h1>
          <p className="page-subtitle">Visualize your financial journey</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-range-select"
        >
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="12">Last 12 Months</option>
        </select>
      </header>

      {/* Summary Cards — derived from most recent month in cashflow */}
      <div className="analytics-summary">
        <div className="summary-card income">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <h3>Income</h3>
            <p className="summary-value" style={{ color: '#10B981' }}>
              {formatMoney(totalIncome, currency.symbol, currency.subunitToUnit)}
            </p>
            <span className="summary-label">This Month</span>
          </div>
        </div>

        <div className="summary-card expenses">
          <div className="summary-icon">📉</div>
          <div className="summary-content">
            <h3>Expenses</h3>
            <p className="summary-value" style={{ color: '#EF4444' }}>
              {formatMoney(totalExpenses, currency.symbol, currency.subunitToUnit)}
            </p>
            <span className="summary-label">This Month</span>
          </div>
        </div>

        <div className="summary-card net-flow">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Net Cash Flow</h3>
            <p className="summary-value" style={{ color: netCashFlow >= 0 ? '#10B981' : '#EF4444' }}>
              {formatMoney(netCashFlow, currency.symbol, currency.subunitToUnit)}
            </p>
            <span className="summary-label">This Month</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2>Spending by Category</h2>
          <SpendingChart data={spendingData} currency={currency} />
        </div>

        <div className="chart-card">
          <h2>Cash Flow Trend</h2>
          {cashFlowData.length > 0 ? (
            <div className="cash-flow-chart">
              <div className="chart-legend">
                <span><span className="legend-dot income"></span> Income</span>
                <span><span className="legend-dot expense"></span> Expenses</span>
              </div>
              <div className="simple-bar-chart">
                {cashFlowData.map((item, idx) => {
                  const maxIncome = Math.max(...cashFlowData.map(d => d.income), 1);
                  const maxExpense = Math.max(...cashFlowData.map(d => d.expense), 1);
                  return (
                    <div key={idx} className="bar-group">
                      <div className="bars">
                        <div
                          className="bar income-bar"
                          style={{ height: `${(item.income / maxIncome) * 100}%` }}
                          title={formatMoney(item.income, currency.symbol, currency.subunitToUnit)}
                        />
                        <div
                          className="bar expense-bar"
                          style={{ height: `${(item.expense / maxExpense) * 100}%` }}
                          title={formatMoney(item.expense, currency.symbol, currency.subunitToUnit)}
                        />
                      </div>
                      <span className="bar-label">{item._id}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="chart-empty">No cash flow data available</div>
          )}
        </div>

        <div className="chart-card full-width">
          <h2>Net Worth Trend</h2>
          {netWorthData.length > 0 ? (
            <div className="line-chart">
              {netWorthData.map((item, idx) => {
                const maxNW = Math.max(...netWorthData.map(d => Math.abs(d.netWorth)), 1);
                return (
                  <div key={idx} className="line-point">
                    <div
                      className="point"
                      style={{ bottom: `${(item.netWorth / maxNW) * 80}%` }}
                    >
                      <span className="point-tooltip">
                        {formatMoney(item.netWorth, currency.symbol, currency.subunitToUnit)}
                      </span>
                    </div>
                    <span className="point-label">{item.month}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="chart-empty">No net worth data available</div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h2>Financial Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>💡 Top Spending Category</h3>
            <p>
              {spendingData.length > 0
                ? `${spendingData[0]?.categoryName}: ${formatMoney(spendingData[0]?.totalAmount, currency.symbol, currency.subunitToUnit)}`
                : 'No data yet'}
            </p>
          </div>
          <div className="insight-card">
            <h3>📊 This Month</h3>
            <p>
              {totalExpenses > 0
                ? netCashFlow >= 0
                  ? "You're spending less than you earn. Keep it up."
                  : "Spending exceeds income this month. Review your budget."
                : 'No expenses recorded yet'}
            </p>
          </div>
          <div className="insight-card">
            <h3>🎯 Recommendation</h3>
            <p>
              {netCashFlow >= 0
                ? 'Consider increasing your emergency fund or Baby Step contributions.'
                : 'Review your budget and cut unnecessary expenses.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;