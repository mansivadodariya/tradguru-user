'use client';

import React, { useState } from 'react';
import styles from './TickerSearchDropdown.module.scss';
import { SYMBOL_DATABASE, normalizeSymbol } from '@/rendering/aiAssistant/TradingViewChartPane';
import SymbolIcon from '@/components/SymbolIcon';
import { useLanguage } from '@/context/LanguageContext';

export default function TickerSearchDropdown({
  selectedSymbol = 'XAU/USD',
  onSelectSymbol,
  onClose,
  position = 'bottom', // 'bottom' or 'top'
  isDark = true,
  allowNoPair = false,
}) {
  const { t } = useLanguage();
  const [tickerSearch, setTickerSearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');

  const filteredSymbols = SYMBOL_DATABASE.filter((item) => {
    if (!allowNoPair && (item.symbol === 'No Pair' || item.symbol.toLowerCase().includes('no pair'))) {
      return false;
    }
    const matchesCategory = activeCategoryTab === 'all' || item.category === activeCategoryTab;
    const rawQuery = tickerSearch.trim().toLowerCase();
    const cleanQuery = rawQuery.replace(/[^a-z0-9]/g, '');
    const cleanSymbol = (item.symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = (item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchesQuery =
      !rawQuery ||
      item.symbol.toLowerCase().includes(rawQuery) ||
      (item.name && item.name.toLowerCase().includes(rawQuery)) ||
      (cleanQuery && (cleanSymbol.includes(cleanQuery) || cleanName.includes(cleanQuery)));

    return matchesCategory && matchesQuery;
  });

  return (
    <div
      className={`${styles.tickerSearchDropdownMenu} ${position === 'top' ? styles.positionTop : styles.positionBottom} ${!isDark ? styles.lightTheme : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Input Box */}
      <div className={styles.searchBoxArea}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={t('aiAssistant.searchTicker', 'Search ticker...')}
          value={tickerSearch}
          onChange={(e) => setTickerSearch(e.target.value)}
          className={styles.tickerSearchInput}
          autoFocus
        />
      </div>

      {/* Category Filter Tabs */}
      <div className={styles.categoryTabsBar}>
        {[
          { id: 'all', label: t('aiAssistant.all', 'All') },
          { id: 'forex', label: t('aiAssistant.forex', 'Forex') },
          { id: 'crypto', label: t('aiAssistant.crypto', 'Crypto') },
          { id: 'commodities', label: t('aiAssistant.commodities', 'Commodities') },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.categoryTabBtn} ${activeCategoryTab === tab.id ? styles.activeTab : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveCategoryTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ticker Item List */}
      <div className={styles.tickerListScrollArea}>
        {filteredSymbols.length === 0 ? (
          <div className={styles.noSymbolsFound}>{t('aiAssistant.noTickersFound', 'No tickers matching')} "{tickerSearch}"</div>
        ) : (
          filteredSymbols.map((item) => {
            const isActive = selectedSymbol === item.symbol || normalizeSymbol(selectedSymbol) === normalizeSymbol(item.symbol);
            return (
              <button
                key={item.symbol}
                type="button"
                className={`${styles.tickerMenuItem} ${isActive ? styles.activeTickerItem : ''}`}
                onClick={() => {
                  if (onSelectSymbol) onSelectSymbol(item.symbol);
                  if (onClose) onClose();
                }}
              >
                <div className={styles.symbolItemLeft}>
                  <SymbolIcon symbol={item.symbol} size={18} />
                  <span className={styles.tickerSymbolTitle}>{item.symbol}</span>
                </div>
                {isActive && <span className={styles.tickerCheckmark}>✓</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
