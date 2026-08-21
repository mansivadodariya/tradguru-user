'use client';

import React, { useState, useMemo } from 'react';
import styles from '../aiAssistant.module.scss';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/components/toast';

export const AVAILABLE_INDICATORS = [
    {
        id: 'ema',
        name: 'Exponential Moving Average',
        category: 'overlays',
        categoryLabel: 'Main Overlay',
        tag: 'EMA',
        dotColor: '#FFD600',
        searchTerms: ['ema', 'exponential moving average', 'ema 20', 'ema 50', 'ema 100', 'ema 200', 'moving average'],
    },
    {
        id: 'sma',
        name: 'Simple Moving Average',
        category: 'overlays',
        categoryLabel: 'Main Overlay',
        tag: 'SMA',
        dotColor: '#00E5FF',
        searchTerms: ['sma', 'simple moving average', 'sma 20', 'sma 50', 'sma 100', 'sma 200', 'moving average', 'ma'],
    },
    {
        id: 'bollinger',
        name: 'Bollinger Bands',
        category: 'overlays',
        categoryLabel: 'Main Overlay',
        tag: 'BB',
        dotColor: 'rgba(41, 121, 255, 0.9)',
        searchTerms: ['bb', 'bollinger bands', 'volatility bands'],
    },
    {
        id: 'pivot',
        name: 'Pivot Points Standard',
        category: 'overlays',
        categoryLabel: 'Main Overlay',
        tag: 'PIVOT',
        dotColor: '#FFD600',
        searchTerms: ['pivot', 'pivot points', 'pivot points standard', 'support resistance'],
    },
    {
        id: 'rsi',
        name: 'Relative Strength Index',
        category: 'subpanes',
        categoryLabel: 'Sub-Pane',
        tag: 'RSI',
        dotColor: '#AA00FF',
        searchTerms: ['rsi', 'relative strength index', 'momentum oscillator'],
    },
    {
        id: 'macd',
        name: 'Moving Average Convergence Divergence',
        category: 'subpanes',
        categoryLabel: 'Sub-Pane',
        tag: 'MACD',
        dotColor: '#00E5FF',
        searchTerms: ['macd', 'moving average convergence divergence', 'trend oscillator'],
    },
    {
        id: 'stochastic',
        name: 'Stochastic Oscillator',
        category: 'subpanes',
        categoryLabel: 'Sub-Pane',
        tag: 'STOCH',
        dotColor: '#00E5FF',
        searchTerms: ['stochastic', 'stoch', 'stochastic oscillator', 'momentum'],
    },
];

export default function IndicatorsModal({
    isOpen,
    onClose,
    activeIndicators,
    movingAverages = [],
    onAddMA,
    onToggleIndicator,
    isDark = true,
}) {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'overlays', 'subpanes'

    const filteredIndicators = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return AVAILABLE_INDICATORS.filter((item) => {
            const matchesCategory =
                selectedCategory === 'all' || item.category === selectedCategory;
            const matchesQuery =
                !query ||
                item.name.toLowerCase().includes(query) ||
                item.tag.toLowerCase().includes(query) ||
                item.searchTerms.some((term) => term.toLowerCase().includes(query));
            return matchesCategory && matchesQuery;
        });
    }, [searchQuery, selectedCategory]);

    const isIndicatorActive = (id) => {
        if (id === 'ema') {
            return Boolean(movingAverages.some((m) => m.type === 'EMA' && m.visible));
        }
        if (id === 'sma') {
            return Boolean(movingAverages.some((m) => m.type === 'SMA' && m.visible));
        }
        return Boolean(activeIndicators?.[id]);
    };

    const totalActiveCount = useMemo(() => {
        const activeOverlayCount = Object.keys(activeIndicators || {}).filter((k) => activeIndicators[k]).length;
        const activeMACount = movingAverages ? movingAverages.filter((m) => m.visible).length : 0;
        return activeOverlayCount + activeMACount;
    }, [activeIndicators, movingAverages]);

    const handleIndicatorClick = (indicatorId) => {
        const currentlyActive = isIndicatorActive(indicatorId);

        if (indicatorId === 'ema') {
            if (currentlyActive) {
                if (onAddMA) onAddMA('EMA_TOGGLE');
            } else {
                if (totalActiveCount >= 3) {
                    toast('Maximum 3 indicators can be selected at a time');
                    return;
                }
                if (onAddMA) onAddMA('EMA');
            }
        } else if (indicatorId === 'sma') {
            if (currentlyActive) {
                if (onAddMA) onAddMA('SMA_TOGGLE');
            } else {
                if (totalActiveCount >= 3) {
                    toast('Maximum 3 indicators can be selected at a time');
                    return;
                }
                if (onAddMA) onAddMA('SMA');
            }
        } else {
            if (!currentlyActive && totalActiveCount >= 3) {
                toast('Maximum 3 indicators can be selected at a time');
                return;
            }
            if (onToggleIndicator) {
                onToggleIndicator(indicatorId);
            }
        }
        // Modal remains open on row click as requested
    };

    if (!isOpen) return null;

    return (
        <div className={styles.indicatorsModalOverlay} onClick={onClose}>
            <div
                className={`${styles.indicatorsModalCard} ${!isDark ? styles.lightModal : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Top Header */}
                <div className={styles.indicatorsModalHeader}>
                    <div className={styles.headerTitleGroup}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.headerIcon}
                        >
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        <h3>{t('aiAssistant.indicatorsModalTitle', 'Indicators, Metrics & Strategies')}</h3>
                    </div>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        title="Close (Esc)"
                    >
                        ✕
                    </button>
                </div>

                {/* Search Bar */}
                <div className={styles.indicatorsSearchBarArea}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={styles.searchIcon}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder={t('aiAssistant.searchIndicatorsPlaceholder', 'Search indicators (e.g. EMA 20, RSI, Bollinger)...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.indicatorsSearchInput}
                        autoFocus
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className={styles.clearSearchBtn}
                            onClick={() => setSearchQuery('')}
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Modal Main Body (Sidebar + Flat Text List) */}
                <div className={styles.indicatorsModalBody}>
                    {/* Left Sidebar Categories */}
                    <div className={styles.indicatorsSidebar}>
                        <button
                            type="button"
                            className={`${styles.sidebarTabBtn} ${selectedCategory === 'all' ? styles.activeTab : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            <span>{t('aiAssistant.allIndicators', 'All Indicators')}</span>
                            <span className={styles.tabCountBadge}>{AVAILABLE_INDICATORS.length}</span>
                        </button>

                        <button
                            type="button"
                            className={`${styles.sidebarTabBtn} ${selectedCategory === 'overlays' ? styles.activeTab : ''}`}
                            onClick={() => setSelectedCategory('overlays')}
                        >
                            <span>{t('aiAssistant.mainOverlays', 'Main Overlays')}</span>
                            <span className={styles.tabCountBadge}>4</span>
                        </button>

                        <button
                            type="button"
                            className={`${styles.sidebarTabBtn} ${selectedCategory === 'subpanes' ? styles.activeTab : ''}`}
                            onClick={() => setSelectedCategory('subpanes')}
                        >
                            <span>{t('aiAssistant.subPanes', 'Sub-Panes')}</span>
                            <span className={styles.tabCountBadge}>3</span>
                        </button>
                    </div>

                    {/* Right Content Area: TradingView Flat Text List */}
                    <div className={styles.indicatorsListArea}>
                        {filteredIndicators.length === 0 ? (
                            <div className={styles.noIndicatorsFound}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <h4>No indicators found</h4>
                                <p>No indicators matching "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className={styles.indicatorsFlatList}>
                                {filteredIndicators.map((item) => {
                                    const active = isIndicatorActive(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            className={`${styles.indicatorListItemRow} ${active ? styles.indicatorRowActive : ''}`}
                                            onClick={() => handleIndicatorClick(item.id)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className={styles.rowLeftContent}>
                                                <span className={styles.indicatorRowName}>
                                                    {item.name}
                                                </span>
                                            </div>

                                                <div className={styles.rowRightContent}>
                                                    <span className={styles.indicatorCategoryTag}>
                                                        {item.categoryLabel}
                                                    </span>
                                                    {active && (
                                                        <span className={styles.indicatorActiveBadge} title="Active on chart">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
