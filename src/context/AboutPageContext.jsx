import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useApiCache } from './ApiCacheContext';

export const AboutPageContext = createContext(null);

export function AboutPageProvider({ children }) {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchCached, getCached } = useApiCache();
  const fetchedRef = useRef(false); // Prevent duplicate fetches

  useEffect(() => {
    // Prevent duplicate fetches
    if (fetchedRef.current) {
      return;
    }

    const fetchAboutData = async () => {
      // Use new optimized endpoint: /api/pages/about
      const endpoint = '/api/pages/about';
      
      // Check cache first
      const cached = getCached(endpoint);
      if (cached && cached.data) {
        setAboutData(cached.data);
        setLoading(false);
        fetchedRef.current = true;
        return;
      }

      try {
        setLoading(true);
        setError(null);
        fetchedRef.current = true;
        
        // Use cached fetch to prevent duplicates
        const result = await fetchCached(endpoint);
        if (result.data) {
          setAboutData(result.data);
        } else {
          throw result.error || new Error('Failed to fetch about data');
        }
      } catch (err) {
        console.error('Error fetching about page data:', err);
        setError(err);
        // Set empty structure on error to prevent crashes
        setAboutData({
          cms: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, [fetchCached, getCached]);

  return (
    <AboutPageContext.Provider value={{ aboutData, loading, error }}>
      {children}
    </AboutPageContext.Provider>
  );
}

export function useAboutPageData() {
  const context = useContext(AboutPageContext);
  if (!context) {
    throw new Error('useAboutPageData must be used within AboutPageProvider');
  }
  return context;
}

