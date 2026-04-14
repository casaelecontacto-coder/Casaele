import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { apiGet } from '../utils/api';

/**
 * Global API Cache Context
 * Prevents duplicate API calls by caching responses globally
 * Cache entries expire after CACHE_TTL_MS to ensure fresh data
 */
const ApiCacheContext = createContext(null);

const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function ApiCacheProvider({ children }) {
  // Cache storage: { endpoint: { data, loading, error, promise, timestamp } }
  const cacheRef = useRef(new Map());
  const [, forceUpdate] = useState(0);

  /**
   * Fetch data with caching - ensures only one request per endpoint
   */
  const fetchCached = useCallback(async (endpoint, options = {}) => {
    const { forceRefresh = false } = options;

    // Check cache first
    if (!forceRefresh && cacheRef.current.has(endpoint)) {
      const cached = cacheRef.current.get(endpoint);
      const isExpired = cached.timestamp && (Date.now() - cached.timestamp > CACHE_TTL_MS);
      // If already loaded and not expired, return cached data
      if (!isExpired && (cached.data !== null || cached.error)) {
        return cached;
      }
      // If currently loading, wait for the existing promise
      if (cached.promise) {
        return await cached.promise;
      }
    }

    // Create new cache entry
    const cacheEntry = {
      data: null,
      loading: true,
      error: null,
      promise: null,
      timestamp: null
    };

    // Create the fetch promise
    const fetchPromise = (async () => {
      try {
        const data = await apiGet(endpoint);
        cacheEntry.data = data;
        cacheEntry.loading = false;
        cacheEntry.error = null;
        cacheEntry.promise = null;
        cacheEntry.timestamp = Date.now();
        forceUpdate(prev => prev + 1); // Trigger re-render for subscribers
        return cacheEntry;
      } catch (err) {
        cacheEntry.data = null;
        cacheEntry.loading = false;
        cacheEntry.error = err;
        cacheEntry.promise = null;
        forceUpdate(prev => prev + 1);
        return cacheEntry;
      }
    })();

    cacheEntry.promise = fetchPromise;
    cacheRef.current.set(endpoint, cacheEntry);

    return await fetchPromise;
  }, []);

  /**
   * Get cached data synchronously (if available)
   */
  const getCached = useCallback((endpoint) => {
    const cached = cacheRef.current.get(endpoint);
    if (cached && (cached.data !== null || cached.error)) {
      return cached;
    }
    return null;
  }, []);

  /**
   * Clear cache for specific endpoint or all
   */
  const clearCache = useCallback((endpoint = null) => {
    if (endpoint) {
      cacheRef.current.delete(endpoint);
    } else {
      cacheRef.current.clear();
    }
    forceUpdate(prev => prev + 1);
  }, []);

  const value = {
    fetchCached,
    getCached,
    clearCache,
    cache: cacheRef.current
  };

  return (
    <ApiCacheContext.Provider value={value}>
      {children}
    </ApiCacheContext.Provider>
  );
}

export function useApiCache() {
  const context = useContext(ApiCacheContext);
  if (!context) {
    throw new Error('useApiCache must be used within ApiCacheProvider');
  }
  return context;
}

