'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import styles from './languageToggle.module.scss';

export default function LanguageToggle({ className = '', light = false }) {
  const { language, setLanguage } = useLanguage();

  const isEn = language === 'en';
  const targetLang = isEn ? 'ar' : 'en';
  const targetLabel = isEn ? 'العربية' : 'English';

  const toggleLanguage = () => {
    setLanguage(targetLang);
  };

  return (
    <motion.button
      type="button"
      onClick={toggleLanguage}
      className={`${styles.toggleButton} ${light ? styles.toggleButtonLight : ''} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      aria-label={isEn ? 'Switch to Arabic' : 'Switch to English'}
    >
      <motion.span
        className={styles.globeIcon}
        animate={{ rotate: isEn ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z" />
        </svg>
      </motion.span>
      
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={targetLang}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={styles.label}
        >
          {targetLabel}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
