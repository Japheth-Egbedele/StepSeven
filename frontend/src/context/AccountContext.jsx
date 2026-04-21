import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { accountAPI } from '../api/accountAPI';
import { useAuth } from './AuthContext';

const AccountContext = createContext();

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountProvider');
  }
  return context;
};

// Alias for components expecting useAccountContext
export const useAccountContext = useAccounts;

export const AccountProvider = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]); // Always starts as array
  const [netWorth, setNetWorth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await accountAPI.getAccounts();
      // DEFENSIVE: Ensure we always set an array even if API structure varies
      const data = response?.accounts || response?.data || response || [];
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch accounts');
      setAccounts([]); // Reset to empty array on error to prevent .filter crashes
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchNetWorth = useCallback(async () => {
    if (!user) return;
    try {
      const response = await accountAPI.getNetWorth();
      // Handle the 404/Not Found gracefully
      setNetWorth(response?.netWorth || response?.data?.netWorth || 0);
    } catch (err) {
      console.error('Error fetching net worth:', err);
      setNetWorth(0);
    }
  }, [user]);

  // Combined Refresh
  const refreshAccounts = useCallback(async () => {
    if (!user) return;
    await Promise.allSettled([fetchAccounts(), fetchNetWorth()]);
  }, [fetchAccounts, fetchNetWorth, user]);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // IMPROVEMENT: Use useMemo for derived data. 
  // This prevents recalculating totals on every re-render unless accounts change.
  const totals = useMemo(() => {
    // Safety check: if accounts isn't an array, return defaults
    if (!Array.isArray(accounts)) {
      return { assets: [], liabilities: [], totalAssets: 0, totalLiabilities: 0 };
    }

    const assets = accounts.filter(acc => acc.type === 'ASSET');
    const liabilities = accounts.filter(acc => acc.type === 'LIABILITY');

    const totalAssets = assets.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

    return { assets, liabilities, totalAssets, totalLiabilities };
  }, [accounts]);

  const createAccount = async (accountData) => {
    try {
      const res = await accountAPI.createAccount(accountData);
      const newAcc = res?.account || res?.data || res;
      setAccounts(prev => [...prev, newAcc]);
      fetchNetWorth(); // Fire and forget update
      return newAcc;
    } catch (err) {
      throw new Error(err.message || 'Failed to create account');
    }
  };

  const updateAccount = async (id, updates) => {
    try {
      const res = await accountAPI.updateAccount(id, updates);
      const updated = res?.account || res?.data || res;
      setAccounts(prev => prev.map(acc => (acc._id === id ? updated : acc)));
      fetchNetWorth();
      return updated;
    } catch (err) {
      throw new Error(err.message || 'Failed to update account');
    }
  };

  const deleteAccount = async (id) => {
    try {
      await accountAPI.deleteAccount(id);
      setAccounts(prev => prev.filter(acc => acc._id !== id));
      fetchNetWorth();
    } catch (err) {
      throw new Error(err.message || 'Failed to delete account');
    }
  };

  const value = {
    accounts,
    ...totals, // Spreads assets, liabilities, totalAssets, totalLiabilities
    netWorth,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};