import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // CHANGE 1: Initialize state by checking localStorage first
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem("siteLanguage");
    return savedLanguage || "Spanish"; // Default to Spanish if nothing is saved
  });

  // CHANGE 2: Save to localStorage whenever the language changes
  useEffect(() => {
    localStorage.setItem("siteLanguage", language);
  }, [language]);

  // Helper function to get translated text
  const t = (path) => {
    const keys = path.split('.');
    let current = translations[language];
    
    // Safety check: if translation file is missing keys, avoid crashing
    if (!current) {
        console.warn(`Language ${language} missing in translations.js`);
        return path;
    }

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation missing for ${language}: ${path}`);
        return path; 
      }
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);