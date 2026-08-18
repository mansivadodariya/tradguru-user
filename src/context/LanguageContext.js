'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getTranslation } from '@/locales';

const LanguageContext = createContext({
  language: 'en',
  dir: 'ltr',
  isRTL: false,
  isPending: false,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key, fallback) => fallback || key,
  tDynamic: (item, keyEn, keyAr) => '',
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('app_language');
      if (storedLang === 'ar' || storedLang === 'en' || storedLang === 'ph') {
        setLanguageState(storedLang);
        document.documentElement.setAttribute('lang', storedLang);
        document.documentElement.setAttribute('dir', storedLang === 'ar' ? 'rtl' : 'ltr');
      } else {
        document.documentElement.setAttribute('lang', 'en');
        document.documentElement.setAttribute('dir', 'ltr');
      }
    } catch (e) {
      console.warn('Could not read language from localStorage:', e);
    }
  }, []);

  const setLanguage = useCallback((lang) => {
    if (lang !== 'en' && lang !== 'ar' && lang !== 'ph') return;
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : language === 'ar' ? 'ph' : 'en');
  }, [language, setLanguage]);

  const t = useCallback((key, fallback = '') => {
    return getTranslation(language, key, fallback);
  }, [language]);

  /** Helper to translate dynamic backend data objects (e.g. backend fields with _en / _ar / _ph) */
  const tDynamic = useCallback((item, fieldEn = 'title', fieldAr, fieldPh) => {
    if (!item) return '';
    const arKey = fieldAr || `${fieldEn}_ar`;
    const phKey = fieldPh || `${fieldEn}_ph`;
    if (language === 'ar' && item[arKey]) return item[arKey];
    if (language === 'ph' && item[phKey]) return item[phKey];
    return item[fieldEn] || item[arKey] || item[phKey] || '';
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, dir, isRTL, isPending: false, setLanguage, toggleLanguage, t, tDynamic }}>
      <motion.div
        key={language}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}
        style={{ width: '100%', minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


