import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState({
    code: 'NGN',
    symbol: '₦',
    subunitToUnit: 100
  });

  useEffect(() => {
    if (user?.currency) {
      setCurrency({
        code: user.currency.code || 'NGN',
        symbol: user.currency.symbol || '₦',
        subunitToUnit: user.currency.subunitToUnit || 100
      });
    }
  }, [user]);

  const toSubunits = (decimalAmount) => {
    if (!decimalAmount || isNaN(decimalAmount)) return 0;
    return Math.round(parseFloat(decimalAmount) * currency.subunitToUnit);
  };

  const fromSubunits = (subunitAmount) => {
    if (!subunitAmount || isNaN(subunitAmount)) return 0;
    return subunitAmount / currency.subunitToUnit;
  };

  // Add this function before the `value` object
  const formatMoney = (subunits) => {
    if (subunits === null || subunits === undefined || isNaN(subunits)) return `${currency.symbol}0.00`;
    const amount = subunits / currency.subunitToUnit;
    return `${currency.symbol}${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const value = {
    currency,
    setCurrency,
    toSubunits,
    formatMoney   // ← was missing entirely
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};