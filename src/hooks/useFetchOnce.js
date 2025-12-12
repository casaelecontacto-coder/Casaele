import { useState, useEffect, useRef } from 'react';
import { apiGet } from '../utils/api';

/**
 * Custom hook to fetch data only once, preventing duplicate API calls
 * Uses a ref to track if fetch is in progress
 * 
 * @param {string} endpoint - API endpoint to fetch
 * @param {object} options - Options object
 * @param {boolean} options.enabled - Whether to fetch (default: true)
 * @param {any} options.initialData - Initial data value
 * @param {function} options.onSuccess - Callback on success
 * @param {function} options.onError - Callback on error
 * @returns {object} { data, loading, error, refetch }
 */
export function useFetchOnce(endpoint, options = {}) {
  const {
    enabled = true,
    initialData = null,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = async () => {
    // Prevent duplicate calls
    if (fetchingRef.current) {
      return;
    }

    if (!endpoint || !enabled) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await apiGet(endpoint);
      if (mountedRef.current) {
        setData(result);
        if (onSuccess) onSuccess(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        if (onError) onError(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [endpoint, enabled]);

  const refetch = () => {
    fetchingRef.current = false;
    fetchData();
  };

  return { data, loading, error, refetch };
}
