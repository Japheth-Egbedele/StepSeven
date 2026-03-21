// src/hooks/useFetch.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for fetching data from API
 * @param {Function} apiFunction - API function to call
 * @param {Array} dependencies - Dependencies for re-fetching
 * @param {boolean} immediate - Whether to fetch immediately
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFetch = (apiFunction, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Custom hook for mutations (POST, PUT, DELETE)
 * @param {Function} apiFunction - API function to call
 * @returns {Object} { mutate, loading, error, data }
 */
export const useMutation = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return {
    mutate,
    loading,
    error,
    data
  };
};