// src/pages/Settings.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import '../styles/Settings.css';
import { parseMoneyInput, isValidMoneyInput } from '../utils/moneyUtils';

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', subunitToUnit: 100 },
  { code: 'USD', symbol: '$', name: 'US Dollar', subunitToUnit: 100 },
  { code: 'EUR', symbol: '€', name: 'Euro', subunitToUnit: 100 },
  { code: 'GBP', symbol: '£', name: 'British Pound', subunitToUnit: 100 }
];

const Settings = () => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });
  const [currencyData, setCurrencyData] = useState({
    code: user?.currency?.code || 'NGN'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const [burnRateDaily, setBurnRateDaily] = useState(() => {
    const subunits = user?.preferences?.burnRateDailySubunits || 0;
    const unit = user?.currency?.subunitToUnit || 100;
    return subunits > 0 ? (subunits / unit).toFixed(2) : '';
  });

  const [burnRateWeekly, setBurnRateWeekly] = useState(() => {
    const subunits = user?.preferences?.burnRateWeeklySubunits || 0;
    const unit = user?.currency?.subunitToUnit || 100;
    return subunits > 0 ? (subunits / unit).toFixed(2) : '';
  });

  const [burnRateMonthly, setBurnRateMonthly] = useState(() => {
    const subunits = user?.preferences?.burnRateMonthlySubunits || 0;
    const unit = user?.currency?.subunitToUnit || 100;
    return subunits > 0 ? (subunits / unit).toFixed(2) : '';
  });

  const [burnRateTimeframe, setBurnRateTimeframe] = useState(() => {
    return user?.preferences?.burnRateTimeframe || 'daily';
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put('/users/profile', profileData);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleBurnRateUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (burnRateDaily && !isValidMoneyInput(burnRateDaily)) {
        throw new Error('Please enter a valid daily burn rate amount');
      }
      if (burnRateWeekly && !isValidMoneyInput(burnRateWeekly)) {
        throw new Error('Please enter a valid weekly burn rate amount');
      }
      if (burnRateMonthly && !isValidMoneyInput(burnRateMonthly)) {
        throw new Error('Please enter a valid monthly burn rate amount');
      }

      const subunitToUnit = user?.currency?.subunitToUnit || 100;
      const burnRateDailySubunits = burnRateDaily
        ? parseMoneyInput(burnRateDaily, subunitToUnit)
        : 0;
      const burnRateWeeklySubunits = burnRateWeekly
        ? parseMoneyInput(burnRateWeekly, subunitToUnit)
        : 0;
      const burnRateMonthlySubunits = burnRateMonthly
        ? parseMoneyInput(burnRateMonthly, subunitToUnit)
        : 0;

      await axios.put('/users/profile', {
        preferences: {
          burnRateDailySubunits,
          burnRateWeeklySubunits,
          burnRateMonthlySubunits,
          burnRateTimeframe
        }
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Burn rate updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update burn rate' });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const selectedCurrency = CURRENCIES.find(c => c.code === currencyData.code);
      await axios.put('/users/currency', {
        currency: {
          code: selectedCurrency.code,
          symbol: selectedCurrency.symbol,
          subunitToUnit: selectedCurrency.subunitToUnit
        }
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Currency updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update currency' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setMessage({ type: 'error', text: 'Password must contain at least one uppercase letter' });
      return;
    }
    if (!/[0-9]/.test(passwordData.newPassword)) {
      setMessage({ type: 'error', text: 'Password must contain at least one number' });
      return;
    }

    setLoading(true);

    try {
      await axios.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return;
    }

    if (!confirm('This is your last warning. Are you absolutely sure?')) {
      return;
    }

    try {
      await axios.delete('/users/account');
      logout();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
    }
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </header>

      <div className="settings-container">
        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`tab ${activeTab === 'currency' ? 'active' : ''}`}
            onClick={() => setActiveTab('currency')}
          >
            💱 Currency
          </button>
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button
            className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            📈 Metrics
          </button>
          <button 
            className={`tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            ⚠️ Danger Zone
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {message.text && (
            <div className={`settings-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Information</h2>
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Currency Tab */}
          {activeTab === 'currency' && (
            <div className="settings-section">
              <h2>Currency Settings</h2>
              <p className="section-description">
                Change your default currency. This affects how amounts are displayed throughout the app.
              </p>
              <form onSubmit={handleCurrencyUpdate}>
                <div className="form-group">
                  <label>Preferred Currency</label>
                  <select
                    value={currencyData.code}
                    onChange={(e) => setCurrencyData({ code: e.target.value })}
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name} ({curr.code})
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Currency'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Change Password</h2>
              <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                      <small>Min 8 characters, one uppercase, one number</small>                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="settings-section">
              <h2>Burn Rate</h2>
              <p className="section-description">
                Set custom burn rates (daily/weekly/monthly) and choose which one drives “Days Ahead”.
                Leave amounts empty to use auto-calculated values.
              </p>
              <form onSubmit={handleBurnRateUpdate}>
                <div className="form-group">
                  <label>Use for Days Ahead</label>
                  <select
                    value={burnRateTimeframe}
                    onChange={(e) => setBurnRateTimeframe(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Daily burn rate</label>
                  <input
                    type="text"
                    value={burnRateDaily}
                    onChange={(e) => setBurnRateDaily(e.target.value)}
                    placeholder="0.00"
                  />
                  <small>Example: 2500.00</small>
                </div>

                <div className="form-group">
                  <label>Weekly burn rate</label>
                  <input
                    type="text"
                    value={burnRateWeekly}
                    onChange={(e) => setBurnRateWeekly(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Monthly burn rate</label>
                  <input
                    type="text"
                    value={burnRateMonthly}
                    onChange={(e) => setBurnRateMonthly(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Burn Rate'}
                </button>
              </form>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="settings-section danger-zone">
              <h2>Danger Zone</h2>
              <div className="danger-card">
                <div>
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <button onClick={handleDeleteAccount} className="btn-danger">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;