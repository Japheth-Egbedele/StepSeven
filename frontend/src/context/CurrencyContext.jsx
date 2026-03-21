// src/context/CurrencyContext.jsx
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

  const value = {
    currency,
    setCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};