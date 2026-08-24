'use client';
import React, { useState } from 'react';
import styles from '../aiSnapDashboard.module.scss';
import { ActivityIcon, ChevronDownIcon } from './AiSnapIcons';

export default function IndicatorPivotTabs({ trendIndicators, momentumIndicators, volatilityIndicators, pivotPoints }) {
    const [activeTab, setActiveTab] = useState('trend');

    const defaultTrend = trendIndicators || {
        "SMA_10": { "value": 0.80824, "action": "Bullish" },
        "EMA_20": { "value": 0.80038, "action": "Bullish" },
        "EMA_50": { "value": 0.80770, "action": "Mixed" }
    };

    const defaultMomentum = momentumIndicators || {
        "RSI (14)": { "value": 64.63, "action": "Neutral" },
        "Stoch_K": { "value": 0.90, "action": "Oversold" },
        "MACD (12,26,9)": { "value": -0.0021, "action": "Bearish" }
    };

    const defaultVolatility = volatilityIndicators || {
        "ATR (14)": { "value": 0.0045, "action": "Normal" },
        "Bollinger Upper": { "value": 0.8124, "action": "Resistance" },
        "Bollinger Lower": { "value": 0.7985, "action": "Support" }
    };

    const defaultPivots = pivotPoints || {
        standard: { P: 0.80825, R1: 0.81299, S1: 0.79854, R2: 0.81966, S2: 0.7918 },
        fibonacci: { P: 0.80825, R1: 0.81180, S1: 0.80470, R2: 0.81530, S2: 0.80120 },
        camarilla: { P: 0.80825, R1: 0.80950, S1: 0.80700, R2: 0.81100, S2: 0.80550 },
        woodie: { P: 0.80830, R1: 0.81310, S1: 0.79860, R2: 0.81970, S2: 0.79190 }
    };

    const getActionBadgeClass = (action = '') => {
        const a = String(action).toLowerCase();
        if (a.includes('bull') || a.includes('overbought')) return styles.badgeGreen;
        if (a.includes('bear') || a.includes('oversold')) return styles.badgeRed;
        return styles.badgeAmber;
    };

    const renderIndicatorTable = (dataObj) => {
        if (!dataObj || typeof dataObj !== 'object') return null;
        const entries = Object.entries(dataObj);

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.breakdownTable}>
                    <thead>
                        <tr>
                            <th>Indicator / Metric</th>
                            <th>Value</th>
                            <th>Action / Condition</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(([name, item]) => {
                            const val = typeof item === 'object' ? item.value : item;
                            const act = typeof item === 'object' ? item.action : '—';
                            return (
                                <tr key={name}>
                                    <td className={styles.tableNameCell}>{name}</td>
                                    <td className={styles.tableValCell}>{val}</td>
                                    <td>
                                        <span className={`${styles.actionTableBadge} ${getActionBadgeClass(act)}`}>
                                            {act}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPivotTable = (pivotsObj) => {
        if (!pivotsObj || typeof pivotsObj !== 'object') return null;
        const types = Object.keys(pivotsObj);

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.breakdownTable}>
                    <thead>
                        <tr>
                            <th>Pivot Formula</th>
                            <th>S2</th>
                            <th>S1</th>
                            <th className={styles.pivotMainHeader}>P (Pivot)</th>
                            <th>R1</th>
                            <th>R2</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map((typeKey) => {
                            const row = pivotsObj[typeKey] || {};
                            return (
                                <tr key={typeKey}>
                                    <td className={styles.tableNameCell}>{typeKey.toUpperCase()}</td>
                                    <td className={styles.supportCell}>{row.S2 || row.s2 || '—'}</td>
                                    <td className={styles.supportCell}>{row.S1 || row.s1 || '—'}</td>
                                    <td className={styles.pivotMainCell}>{row.P || row.p || '—'}</td>
                                    <td className={styles.resistanceCell}>{row.R1 || row.r1 || '—'}</td>
                                    <td className={styles.resistanceCell}>{row.R2 || row.r2 || '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className={styles.indicatorPivotSection}>
            <div className={styles.sectionHeaderRow}>
                <ActivityIcon size={18} className={styles.sectionTitleIcon} />
                <h3>Technical Indicators & Pivot Point Breakdown</h3>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabNavRow}>
                <button
                    type="button"
                    className={`${styles.tabNavBtn} ${activeTab === 'trend' ? styles.tabNavActive : ''}`}
                    onClick={() => setActiveTab('trend')}
                >
                    Trend Indicators
                </button>
                <button
                    type="button"
                    className={`${styles.tabNavBtn} ${activeTab === 'momentum' ? styles.tabNavActive : ''}`}
                    onClick={() => setActiveTab('momentum')}
                >
                    Momentum
                </button>
                <button
                    type="button"
                    className={`${styles.tabNavBtn} ${activeTab === 'volatility' ? styles.tabNavActive : ''}`}
                    onClick={() => setActiveTab('volatility')}
                >
                    Volatility
                </button>
                <button
                    type="button"
                    className={`${styles.tabNavBtn} ${activeTab === 'pivots' ? styles.tabNavActive : ''}`}
                    onClick={() => setActiveTab('pivots')}
                >
                    Pivot Points
                </button>
            </div>

            {/* Tab Body */}
            <div className={styles.tabContentCard}>
                {activeTab === 'trend' && renderIndicatorTable(defaultTrend)}
                {activeTab === 'momentum' && renderIndicatorTable(defaultMomentum)}
                {activeTab === 'volatility' && renderIndicatorTable(defaultVolatility)}
                {activeTab === 'pivots' && renderPivotTable(defaultPivots)}
            </div>
        </div>
    );
}
