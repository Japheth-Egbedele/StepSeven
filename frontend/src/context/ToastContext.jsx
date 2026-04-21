import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export const useToasts = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts must be used within ToastProvider');
  return ctx;
};

const DEFAULT_TTL_MS = 4500;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    const id = toast.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const ttlMs = toast.ttlMs ?? DEFAULT_TTL_MS;

    const next = { id, type: toast.type || 'info', title: toast.title || '', message: toast.message || '' };
    setToasts((prev) => [next, ...prev].slice(0, 5));

    if (ttlMs > 0) {
      window.setTimeout(() => removeToast(id), ttlMs);
    }
  }, [removeToast]);

  const value = useMemo(() => ({
    toasts,
    pushToast,
    removeToast
  }), [toasts, pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

