'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import styles from './languageToggle.module.scss';

/* High-resolution SVG Flag Icons */
const USFlag = ({ width = 20, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <g fillRule="evenodd">
      <path fill="#bd3d44" d="M0 0h640v480H0z"/>
      <path stroke="#fff" strokeWidth="36.9" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/>
      <rect width="256" height="258.5" fill="#192f5d"/>
      <g fill="#fff">
        <circle cx="32" cy="24" r="8"/><circle cx="96" cy="24" r="8"/><circle cx="160" cy="24" r="8"/><circle cx="224" cy="24" r="8"/>
        <circle cx="64" cy="48" r="8"/><circle cx="128" cy="48" r="8"/><circle cx="192" cy="48" r="8"/>
        <circle cx="32" cy="72" r="8"/><circle cx="96" cy="72" r="8"/><circle cx="160" cy="72" r="8"/><circle cx="224" cy="72" r="8"/>
        <circle cx="64" cy="96" r="8"/><circle cx="128" cy="96" r="8"/><circle cx="192" cy="96" r="8"/>
        <circle cx="32" cy="120" r="8"/><circle cx="96" cy="120" r="8"/><circle cx="160" cy="120" r="8"/><circle cx="224" cy="120" r="8"/>
        <circle cx="64" cy="144" r="8"/><circle cx="128" cy="144" r="8"/><circle cx="192" cy="144" r="8"/>
        <circle cx="32" cy="168" r="8"/><circle cx="96" cy="168" r="8"/><circle cx="160" cy="168" r="8"/><circle cx="224" cy="168" r="8"/>
        <circle cx="64" cy="192" r="8"/><circle cx="128" cy="192" r="8"/><circle cx="192" cy="192" r="8"/>
        <circle cx="32" cy="216" r="8"/><circle cx="96" cy="216" r="8"/><circle cx="160" cy="216" r="8"/><circle cx="224" cy="216" r="8"/>
        <circle cx="64" cy="240" r="8"/><circle cx="128" cy="240" r="8"/><circle cx="192" cy="240" r="8"/>
      </g>
    </g>
  </svg>
);

const UAEFlag = ({ width = 20, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <path fill="#00732f" d="M0 0h640v160H0z"/>
    <path fill="#fff" d="M0 160h640v160H0z"/>
    <path fill="#000" d="M0 320h640v160H0z"/>
    <path fill="#ff0000" d="M0 0h160v480H0z"/>
  </svg>
);

const PHFlag = ({ width = 20, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <path fill="#0038a8" d="M0 0h640v240H0z"/>
    <path fill="#ce1126" d="M0 240h640v240H0z"/>
    <path fill="#fff" d="M0 0l277.1 240L0 480z"/>
    <circle cx="80" cy="240" r="32" fill="#fcd116"/>
    <g fill="#fcd116">
      <circle cx="80" cy="240" r="14"/>
      <path d="M80 185l6 25h-12zM80 295l6-25h-12zM135 240l-25 6v-12zM25 240l25 6v-12z"/>
      <circle cx="35" cy="65" r="10"/>
      <circle cx="35" cy="415" r="10"/>
      <circle cx="215" cy="240" r="10"/>
    </g>
  </svg>
);

const renderFlag = (code, width = 20, height = 14) => {
  switch (code) {
    case 'ar':
      return <UAEFlag width={width} height={height} />;
    case 'ph':
      return <PHFlag width={width} height={height} />;
    case 'en':
    default:
      return <USFlag width={width} height={height} />;
  }
};

export default function LanguageToggle({ className = '', light = false }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  const getLanguageLabel = (lang) => {
    switch (lang) {
      case 'ar':
        return 'العربية';
      case 'ph':
        return 'Filipino';
      case 'en':
      default:
        return 'English';
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'ph', label: 'Filipino' },
  ];

  return (
    <div className={`${styles.wrapper} ${className}`} ref={wrapperRef}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.toggleButton} ${light ? styles.toggleButtonLight : ''}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <span className={styles.activeFlagIcon}>
          {renderFlag(language, 20, 14)}
        </span>
        
        <span className={styles.label}>
          {getLanguageLabel(language)}
        </span>

        <motion.span
          className={styles.chevronIcon}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdownMenu}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`${styles.dropdownOption} ${language === item.code ? styles.activeOption : ''}`}
                onClick={() => handleSelectLanguage(item.code)}
              >
                <div className={styles.optionContent}>
                  {renderFlag(item.code, 20, 14)}
                  <span>{item.label}</span>
                </div>
                {language === item.code && (
                  <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
