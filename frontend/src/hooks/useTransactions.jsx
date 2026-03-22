// Transaction Hook with Pagination
import { useState, useEffect } from 'react';
import { transactionAPI } from '../api/transactionAPI';

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
      const response = await transactionAPI.getTransactions({ ...filters, page, limit });
      setTransactions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (data) => {
    await transactionAPI.create(data);
    fetchTransactions();
  };

  const updateTransaction = async (id, data) => {
    await transactionAPI.update(id, data);
    fetchTransactions();
  };

  const deleteTransaction = async (id) => {
    await transactionAPI.delete(id);
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