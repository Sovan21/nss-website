"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, defaultLocale, supportedLocales } from '../locales';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(defaultLocale);
  const [mounted, setMounted] = useState(false);

  // Initialize locale from localStorage on client-side
  useEffect(() => {
    const savedLocale = localStorage.getItem('nss_locale');
    if (savedLocale && supportedLocales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    } else {
      // Try to detect user browser language
      const browserLang = navigator.language?.split('-')[0];
      if (browserLang && supportedLocales.includes(browserLang)) {
        setLocaleState(browserLang);
      }
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale) => {
    if (supportedLocales.includes(newLocale)) {
      setLocaleState(newLocale);
      localStorage.setItem('nss_locale', newLocale);
      // Optional: change document lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    }
  };

  // The translation function t()
  const t = (key) => {
    const dictionary = translations[locale] || translations[defaultLocale];
    let value = dictionary[key];
    
    // Fallback to English if key is missing in active language
    if (value === undefined && locale !== defaultLocale) {
      value = translations[defaultLocale][key];
    }
    
    // Fallback to key itself if not found anywhere
    return value !== undefined ? value : key;
  };

  // Simple parser to handle bold formatting like <strong> or <b> inside locales
  const tHtml = (key) => {
    const rawText = t(key);
    // Return formatted string for use in dangerouslySetInnerHTML or structured text
    return rawText;
  };

  // Avoid hydration mismatch by serving default locale on server rendering
  const contextValue = {
    locale: mounted ? locale : defaultLocale,
    setLocale,
    t,
    tHtml,
    supportedLocales,
    isReady: mounted
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
