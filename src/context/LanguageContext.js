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

const RTL_LANGUAGES = ['ar', 'ma'];
const SUPPORTED_LANGUAGES = ['en', 'ar', 'ph', 'ma', 'es', 'ru', 'zh', 'vi', 'id'];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('app_language');
      if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
        setLanguageState(storedLang);
        const isRtlLang = RTL_LANGUAGES.includes(storedLang);
        document.documentElement.setAttribute('lang', storedLang);
        document.documentElement.setAttribute('dir', isRtlLang ? 'rtl' : 'ltr');
      } else {
        document.documentElement.setAttribute('lang', 'en');
        document.documentElement.setAttribute('dir', 'ltr');
      }
    } catch (e) {
      console.warn('Could not read language from localStorage:', e);
    }
  }, []);

  const setLanguage = useCallback((lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
    if (typeof document !== 'undefined') {
      const isRtlLang = RTL_LANGUAGES.includes(lang);
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', isRtlLang ? 'rtl' : 'ltr');
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const idx = SUPPORTED_LANGUAGES.indexOf(prev);
      const next = SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
      try {
        localStorage.setItem('app_language', next);
      } catch (_) {}
      if (typeof document !== 'undefined') {
        const isRtlLang = RTL_LANGUAGES.includes(next);
        document.documentElement.setAttribute('lang', next);
        document.documentElement.setAttribute('dir', isRtlLang ? 'rtl' : 'ltr');
      }
      return next;
    });
  }, []);

  const t = useCallback((key, fallback = '') => {
    return getTranslation(language, key, fallback);
  }, [language]);

  /** Helper to translate dynamic backend data objects (e.g. backend fields with _en / _ar / _ph / _es / etc.) */
  const tDynamic = useCallback((item, fieldEn = 'title', fieldAr, fieldPh) => {
    if (!item) return '';
    const localizedKey = `${fieldEn}_${language}`;
    if (item[localizedKey]) return item[localizedKey];
    const arKey = fieldAr || `${fieldEn}_ar`;
    const phKey = fieldPh || `${fieldEn}_ph`;
    if ((language === 'ar' || language === 'ma') && item[arKey]) return item[arKey];
    if (language === 'ph' && item[phKey]) return item[phKey];
    return item[fieldEn] || item[arKey] || item[phKey] || '';
  }, [language]);

  const isRTL = RTL_LANGUAGES.includes(language);
  const dir = isRTL ? 'rtl' : 'ltr';

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


