import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useApiCache } from './ApiCacheContext';

export const HomePageContext = createContext(null);

export function HomePageProvider({ children }) {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchCached, getCached } = useApiCache();
  const fetchedRef = useRef(false); // Prevent duplicate fetches

  useEffect(() => {
    // Prevent duplicate fetches
    if (fetchedRef.current) {
      return;
    }

    const fetchHomeData = async () => {
      // Use new optimized endpoint: /api/pages/home
      const endpoint = '/api/pages/home';
      
      // Check cache first
      const cached = getCached(endpoint);
      if (cached && cached.data) {
        setHomeData(cached.data);
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
          setHomeData(result.data);
        } else {
          throw result.error || new Error('Failed to fetch home data');
        }
      } catch (err) {
        console.error('Error fetching home page data:', err);
        setError(err);
        // Set empty structure on error to prevent crashes
        setHomeData({
          cms: {},
          picks: [],
          testimonials: [],
          teachers: [],
          homeSlides: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [fetchCached, getCached]);

  return (
    <HomePageContext.Provider value={{ homeData, loading, error }}>
      {children}
    </HomePageContext.Provider>
  );
}

export function useHomePageData() {
  const context = useContext(HomePageContext);
  if (!context) {
    throw new Error('useHomePageData must be used within HomePageProvider');
  }
  return context;
}

