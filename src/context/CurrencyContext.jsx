import React, { createContext, useState, useContext, useEffect } from 'react';

const CurrencyContext = createContext();

// Currency symbols and conversion rates (you can update these as needed)
export const currencyConfig = {
  USD: {
    symbol: '$',
    name: 'US Dollar',
    code: 'USD'
  },
  EUR: {
    symbol: '€',
    name: 'Euro',
    code: 'EUR'
  },
  INR: {
    symbol: '₹',
    name: 'Indian Rupee',
    code: 'INR'
  }
};

export const CurrencyProvider = ({ children }) => {
  // Initialize currency from localStorage or default to USD
  const [currency, setCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem("siteCurrency");
    return savedCurrency || "USD";
  });

  // Save to localStorage whenever currency changes
  useEffect(() => {
    localStorage.setItem("siteCurrency", currency);
  }, [currency]);

  // Helper function to get currency symbol
  const getCurrencySymbol = (curr = currency) => {
    return currencyConfig[curr]?.symbol || '$';
  };

  // Helper function to format price with currency
  const formatPrice = (priceObj, curr = currency) => {
    if (!priceObj || typeof priceObj !== 'object') {
      // Fallback for old price format (single number)
      return `${getCurrencySymbol(curr)}${priceObj || 0}`;
    }

    // Check if currency-specific price exists
    const currencyPrice = priceObj[curr];
    if (currencyPrice && (currencyPrice.price > 0 || currencyPrice.discountPrice > 0)) {
      const displayPrice = currencyPrice.discountPrice || currencyPrice.price;
      return `${getCurrencySymbol(curr)}${displayPrice}`;
    }

    // Fallback to USD if current currency not available
    if (curr !== 'USD' && priceObj.USD && (priceObj.USD.price > 0 || priceObj.USD.discountPrice > 0)) {
      const displayPrice = priceObj.USD.discountPrice || priceObj.USD.price;
      return `$${displayPrice}`;
    }

    return `${getCurrencySymbol(curr)}0`;
  };

  // Helper function to get price value for calculations
  const getPriceValue = (product, curr = currency) => {
    // Handle new multi-currency format
    if (product.prices && typeof product.prices === 'object') {
      const currencyPrice = product.prices[curr];
      // Check if the selected currency has a price set (not zero)
      if (currencyPrice && (currencyPrice.price > 0 || currencyPrice.discountPrice > 0)) {
        return currencyPrice.discountPrice || currencyPrice.price;
      }
      // Fallback to USD if selected currency has no price
      if (curr !== 'USD' && product.prices.USD && (product.prices.USD.price > 0 || product.prices.USD.discountPrice > 0)) {
        return product.prices.USD.discountPrice || product.prices.USD.price;
      }
    }

    // Handle old format (backward compatibility) - use default price/discountPrice fields
    return product.discountPrice || product.price || 0;
  };

  const value = {
    currency,
    setCurrency,
    getCurrencySymbol,
    formatPrice,
    getPriceValue,
    currencyConfig
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
