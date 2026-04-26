// src/pages/BabySteps.jsx
import { useMemo, useState } from 'react';
import { useBabySteps } from '../context/BabyStepContext';
import { useAccounts } from '../context/AccountContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatMoney } from '../utils/moneyUtils';
import '../styles/BabySteps.css';

const BABY_STEPS = [
  { number: 1, title: '$1,000 Emergency Fund', icon: '🚨', description: 'Save $1,000 for emergencies' },
  { number: 2, title: 'Pay Off All Debt', icon: '💳', description: 'Use the debt snowball method' },
  { number: 3, title: '3-6 Months Expenses', icon: '🛡️', description: 'Fully funded emergency fund' },
  { number: 4, title: 'Invest 15% for Retirement', icon: '📈', description: 'Build long-term wealth' },
  { number: 5, title: "Save for Children's College", icon: '🎓', description: 'Education funding' },
  { number: 6, title: 'Pay Off Your Home', icon: '🏠', description: 'Become completely debt-free' },
  { number: 7, title: 'Build Wealth & Give', icon: '💰', description: 'Live generously and leave a legacy' }
];

const BabySteps = () => {
  const { currency } = useCurrency();
  const { accounts, updateAccount, refreshAccounts } = useAccounts();
  const { 
    currentStep, 
    emergencyFund, 
    debtSnowball, 
    loading, 
    completeStep, 
    getStepProgress,
    isStepCompleted,
    isStepCurrent
  } = useBabySteps();

  const eligibleEmergencyAccounts = useMemo(() => {
    return (Array.isArray(accounts) ? accounts : [])
      .filter(acc =>
        acc.isActive !== false &&
        acc.type === 'ASSET' &&
        (acc.subType === 'BANK' || acc.subType === 'CASH')
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [accounts]);

  const currentEmergencyAccountId = useMemo(() => {
    const current = eligibleEmergencyAccounts.find(a => a.isEmergencyFund === true);
    return current?._id || '';
  }, [eligibleEmergencyAccounts]);

  const [emergencyAccountId, setEmergencyAccountId] = useState('');
  const [savingEmergencyAccount, setSavingEmergencyAccount] = useState(false);

  const saveEmergencyFundAccount = async () => {
    if (!emergencyAccountId) return;
    setSavingEmergencyAccount(true);
    try {
      const updates = [];
      for (const acc of eligibleEmergencyAccounts) {
        const shouldBeEmergency = acc._id === emergencyAccountId;
        if ((acc.isEmergencyFund === true) !== shouldBeEmergency) {
          updates.push(updateAccount(acc._id, { isEmergencyFund: shouldBeEmergency }));
        }
      }
      await Promise.all(updates);
      await refreshAccounts();
      alert('Emergency fund account updated.');
    } catch (error) {
      alert(error.message || 'Failed to update emergency fund account');
    } finally {
      setSavingEmergencyAccount(false);
    }
  };

  const handleCompleteStep = async (stepNumber) => {
    if (!confirm(`Mark Baby Step ${stepNumber} as complete?`)) return;
    
    try {
      await completeStep(stepNumber);
    } catch (error) {
      alert(error.message || 'Failed to complete step');
    }
  };

  const renderStepCard = (step) => {
    const status = isStepCompleted(step.number) ? 'completed' : 
                   isStepCurrent(step.number) ? 'current' : 'upcoming';
    const stepProgress = getStepProgress(step.number);
    
    return (
      <div key={step.number} className={`step-card ${status}`}>
        <div className="step-icon">{step.icon}</div>
        <div className="step-content">
          <div className="step-number">Step {step.number}</div>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          
          {status === 'current' && step.number === 1 && stepProgress && (
            <div className="step-progress">
              <div className="progress-info">
                <span>Progress: {formatMoney(stepProgress.current, currency.symbol, currency.subunitToUnit)}</span>
                <span>Goal: {formatMoney(stepProgress.goal, currency.symbol, currency.subunitToUnit)}</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${Math.min(stepProgress.percentage, 100)}%` }}
                />
              </div>
              <div className="progress-percentage">
                {stepProgress.percentage.toFixed(0)}% Complete
              </div>
            </div>
          )}
          
          {status === 'current' && step.number === 2 && stepProgress && (
            <div className="step-progress">
              <div className="debt-summary">
                <div className="debt-stat">
                  <span className="debt-label">Total Debt</span>
                  <span className="debt-value">{formatMoney(stepProgress.totalDebt, currency.symbol, currency.subunitToUnit)}</span>
                </div>
                <div className="debt-stat">
                  <span className="debt-label">Paid Off</span>
                  <span className="debt-value" style={{ color: '#10B981' }}>
                    {formatMoney(stepProgress.paidOff, currency.symbol, currency.subunitToUnit)}
                  </span>
                </div>
              </div>
              {stepProgress.debts && stepProgress.debts.length > 0 && (
                <div className="debt-list">
                  <h4>Snowball Order:</h4>
                  {stepProgress.debts.slice(0, 3).map((debt, idx) => (
                    <div key={idx} className="debt-item">
                      <span>{debt.name}</span>
                      <span>{formatMoney(debt.balance, currency.symbol, currency.subunitToUnit)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {status === 'current' && step.number === 3 && stepProgress && (
            <div className="step-progress">
              <div className="progress-info">
                <span>Current: {formatMoney(stepProgress.current, currency.symbol, currency.subunitToUnit)}</span>
                <span>Goal: {formatMoney(stepProgress.goal, currency.symbol, currency.subunitToUnit)}</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${Math.min(stepProgress.percentage, 100)}%` }}
                />
              </div>
              <div className="progress-percentage">
                {stepProgress.percentage.toFixed(0)}% Complete
              </div>
            </div>
          )}
          
          {status === 'completed' && (
            <div className="step-completed">
              <span className="check-icon">✓</span>
              <span>Completed!</span>
            </div>
          )}
          
          {status === 'current' && (
            <button 
              onClick={() => handleCompleteStep(step.number)}
              className="btn-complete-step"
            >
              Mark as Complete
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="baby-steps-loading">
        <div className="spinner"></div>
        <p>Loading your progress...</p>
      </div>
    );
  }

  return (
    <div className="baby-steps-page">
      <header className="page-header">
        <div>
          <h1>Baby Steps Journey</h1>
          <p className="page-subtitle">Your path to financial freedom - Dave Ramsey's proven plan</p>
        </div>
      </header>

      {/* BabySteps settings */}
      {eligibleEmergencyAccounts.length > 0 && (
        <div className="motivation-card" style={{ marginTop: 0 }}>
          <h3>🏦 BabySteps Account</h3>
          <p>
            Choose which account counts as your Emergency Fund for Baby Step tracking.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={emergencyAccountId || currentEmergencyAccountId}
              onChange={(e) => setEmergencyAccountId(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 10 }}
            >
              <option value="" disabled>Select an account</option>
              {eligibleEmergencyAccounts.map(acc => (
                <option key={acc._id} value={acc._id}>
                  {acc.name}{acc.isEmergencyFund ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <button
              className="btn-complete-step"
              onClick={saveEmergencyFundAccount}
              disabled={savingEmergencyAccount || !(emergencyAccountId && emergencyAccountId !== currentEmergencyAccountId)}
            >
              {savingEmergencyAccount ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="journey-progress">
        <h2>You are on Step {currentStep}</h2>
        <div className="progress-tracker">
          {BABY_STEPS.map((step, idx) => (
            <div key={step.number} className="progress-step">
              <div className={`progress-dot ${
                isStepCompleted(step.number) ? 'completed' : 
                isStepCurrent(step.number) ? 'current' : 'upcoming'
              }`}>
                {step.number}
              </div>
              {idx < BABY_STEPS.length - 1 && (
                <div className={`progress-line ${isStepCompleted(step.number) ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Steps Grid */}
      <div className="steps-grid">
        {BABY_STEPS.map(renderStepCard)}
      </div>

      {/* Motivational Section */}
      <div className="motivation-card">
        <h3>💪 Keep Going!</h3>
        <p>
          {currentStep === 1 && "You're building your foundation! Every dollar saved is a step toward security."}
          {currentStep === 2 && "Attack that debt with gazelle intensity! You're on your way to freedom."}
          {currentStep === 3 && "Great job! Now build that bulletproof emergency fund."}
          {currentStep >= 4 && currentStep <= 6 && "You're building wealth! Keep investing and stay focused."}
          {currentStep === 7 && "You did it! Now live, give, and leave a legacy."}
        </p>
      </div>
    </div>
  );
};

export default BabySteps;