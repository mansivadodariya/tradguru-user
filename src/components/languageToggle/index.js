'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import styles from './languageToggle.module.scss';

/* High-resolution SVG Flag Icons */
const USFlag = ({ width = 22, height = 15 }) => (
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

const UAEFlag = ({ width = 22, height = 15 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <path fill="#00732f" d="M0 0h640v160H0z"/>
    <path fill="#fff" d="M0 160h640v160H0z"/>
    <path fill="#000" d="M0 320h640v160H0z"/>
    <path fill="#ff0000" d="M0 0h160v480H0z"/>
  </svg>
);

const MoroccoFlag = ({ width = 22, height = 15 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <rect width="640" height="480" fill="#c1272d"/>
    <path
      d="M320 120 L357.6 235.8 L479.4 235.8 L380.9 307.4 L418.5 423.2 L320 351.6 L221.5 423.2 L259.1 307.4 L160.6 235.8 L282.4 235.8 Z"
      fill="none"
      stroke="#006233"
      strokeWidth="20"
      strokeLinejoin="miter"
    />
  </svg>
);

const SpainFlag = ({ width = 22, height = 15 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <rect width="640" height="480" fill="#c60b1e"/>
    <rect width="640" height="240" y="120" fill="#ffc400"/>
    <g transform="translate(135, 170) scale(0.55)">
      <circle cx="80" cy="80" r="45" fill="#c60b1e" opacity="0.9"/>
      <rect x="65" y="45" width="30" height="70" fill="#ffc400" rx="4"/>
    </g>
  </svg>
);

const RussiaFlag = ({ width = 22, height = 15 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <rect width="640" height="160" fill="#ffffff"/>
    <rect width="640" height="160" y="160" fill="#0039a6"/>
    <rect width="640" height="160" y="320" fill="#d52b1e"/>
  </svg>
);

const ChinaFlag = ({ width = 22, height = 15 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <rect width="640" height="480" fill="#de2910"/>
    <polygon fill="#ffde00" points="120,60 137,112 192,112 148,144 165,196 120,164 75,196 92,144 48,112 103,112"/>
    <polygon fill="#ffde00" points="240,40 245,55 260,55 248,64 252,78 240,70 228,78 232,64 220,55 235,55" transform="rotate(23 240 60)"/>
    <polygon fill="#ffde00" points="280,90 285,105 300,105 288,114 292,128 280,120 268,128 272,114 260,105 275,105" transform="rotate(45 280 110)"/>
    <polygon fill="#ffde00" points="280,160 285,175 300,175 288,184 292,198 280,190 268,198 272,184 260,175 275,175" transform="rotate(10 280 180)"/>
    <polygon fill="#ffde00" points="240,220 245,235 260,235 248,244 252,258 240,250 228,258 232,244 220,235 235,235" transform="rotate(-20 240 240)"/>
  </svg>
);

const VietnamFlag = ({ width = 22, height = 15 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <rect width="640" height="480" fill="#da251d"/>
    <polygon fill="#ffff00" points="320,80 367,225 520,225 397,314 444,459 320,370 196,459 243,314 120,225 273,225"/>
  </svg>
);

const IndonesiaFlag = ({ width = 22, height = 15 }) => (
  <svg width={width} height={height} viewBox="0 0 640 480" className={styles.flagSvg}>
    <rect width="640" height="240" fill="#e70011"/>
    <rect width="640" height="240" y="240" fill="#ffffff"/>
  </svg>
);

const PHFlag = ({ width = 22, height = 15 }) => (
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

export const renderFlag = (code, width = 22, height = 15) => {
  switch (code) {
    case 'ar':
      return <UAEFlag width={width} height={height} />;
    case 'ma':
      return <MoroccoFlag width={width} height={height} />;
    case 'es':
      return <SpainFlag width={width} height={height} />;
    case 'ru':
      return <RussiaFlag width={width} height={height} />;
    case 'zh':
      return <ChinaFlag width={width} height={height} />;
    case 'vi':
      return <VietnamFlag width={width} height={height} />;
    case 'id':
      return <IndonesiaFlag width={width} height={height} />;
    case 'ph':
      return <PHFlag width={width} height={height} />;
    case 'en':
    default:
      return <USFlag width={width} height={height} />;
  }
};

export const supportedLanguagesList = [
  { code: 'en', country: 'Global / US', label: 'English', nativeName: 'English' },
  { code: 'ar', country: 'UAE', label: 'Arabic', nativeName: 'العربية' },
  { code: 'ma', country: 'Morocco', label: 'Moroccan Arabic', nativeName: 'الدارجة المغربية' },
  { code: 'es', country: 'Spain', label: 'Spanish', nativeName: 'Español' },
  { code: 'ru', country: 'Russia', label: 'Russian', nativeName: 'Русский' },
  { code: 'zh', country: 'China', label: 'Chinese (Mandarin)', nativeName: '中文 (普通话)' },
  { code: 'vi', country: 'Vietnam', label: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', country: 'Indonesia', label: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia' },
  { code: 'ph', country: 'Philippines', label: 'Filipino', nativeName: 'Filipino' },
];

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

  const currentLangObj = supportedLanguagesList.find((l) => l.code === language) || supportedLanguagesList[0];

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
          {renderFlag(language, 22, 15)}
        </span>
        
        <span className={styles.label}>
          {currentLangObj.nativeName}
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
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.dropdownHeader}>
              <div className={styles.dropdownHeaderLeft}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>Select Language</span>
              </div>
              <span className={styles.badge}>{supportedLanguagesList.length} Regions</span>
            </div>

            <div className={styles.dropdownGrid}>
              {supportedLanguagesList.map((item) => {
                const isActive = language === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    className={`${styles.dropdownOption} ${isActive ? styles.activeOption : ''}`}
                    onClick={() => handleSelectLanguage(item.code)}
                  >
                    <div className={styles.optionContent}>
                      <span className={styles.flagWrapper}>
                        {renderFlag(item.code, 22, 15)}
                      </span>
                      <div className={styles.textGroup}>
                        <span className={styles.countryLabel}>{item.country}</span>
                        <span className={styles.nativeLabel}>{item.nativeName}</span>
                      </div>
                    </div>

                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={styles.checkIconWrapper}
                      >
                        <svg className={styles.checkIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
