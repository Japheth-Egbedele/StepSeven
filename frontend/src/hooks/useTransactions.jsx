// Transaction Hook with Pagination
import { useState, useEffect } from 'react';
import { transactionAPI } from '../api/transactionAPI';

const isYyyyMmDd = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

const normalizeTransactionFilters = (filters) => {
  const next = { ...(filters || {}) };

  if (isYyyyMmDd(next.startDate)) {
    next.startDate = `${next.startDate}T00:00:00.000Z`;
  }
  if (isYyyyMmDd(next.endDate)) {
    next.endDate = `${next.endDate}T23:59:59.999Z`;
  }

  return next;
};

export const useTransactions = (filters = {}, page = 1, limit = 50) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [page, JSON.stringify(filters)]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const normalizedFilters = normalizeTransactionFilters(filters);
      const response = await transactionAPI.getTransactions({ ...normalizedFilters, page, limit });
      setTransactions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (data) => {
    await transactionAPI.createTransaction(data);
    fetchTransactions();
  };

  const updateTransaction = async (id, data) => {
    await transactionAPI.updateTransaction(id, data);
    fetchTransactions();
  };

  const deleteTransaction = async (id) => {
    await transactionAPI.deleteTransaction(id);
    fetchTransactions();
  };

  return {
    transactions,
    pagination,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchTransactions
  };
};