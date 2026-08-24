'use client';
import React from 'react';
import styles from '../aiSnapDashboard.module.scss';
import { ActivityIcon, TrendingUpIcon, TrendingDownIcon } from './AiSnapIcons';

export default function LiveIndicatorsGrid({ liveIndicators, marketAssessment }) {
    const rsi = liveIndicators?.rsi || { period: 14, label: 'Neutral', value: 38.73 };
    const macd = liveIndicators?.macd || { label: 'Bearish', value: -0.0021 };
    const atr = liveIndicators?.atr || { period: 14, label: 'Low Volatility', value: 0.0045 };
    const ema = liveIndicators?.ema || { period: 50, label: 'Mixed', value: 0.8077 };

    const getIndicatorBadgeStyle = (label = '') => {
        const l = String(label).toLowerCase();
        if (l.includes('bull') || l.includes('high') || l.includes('overbought')) return styles.badgeGreen;
        if (l.includes('bear') || l.includes('low') || l.includes('oversold')) return styles.badgeRed;
        return styles.badgeAmber;
    };

    return (
        <div className={styles.liveIndicatorsSection}>
            <div className={styles.sectionHeaderRow}>
                <div className={styles.sectionTitleWrap}>
                    <ActivityIcon size={18} className={styles.sectionTitleIcon} />
                    <h3>Live Indicators & Market Assessment</h3>
                </div>
                {marketAssessment?.strength && (
                    <span className={styles.strengthBadge}>
                        Market Strength: <strong>{marketAssessment.strength}</strong> ({marketAssessment.momentum || 'Normal'} Momentum)
                    </span>
                )}
            </div>

            <div className={styles.indicatorsGrid}>
                {/* RSI Card */}
                <div className={styles.indicatorCard}>
                    <div className={styles.indicatorCardTop}>
                        <span className={styles.indicatorName}>RSI ({rsi.period || 14})</span>
                        <span className={`${styles.statusBadge} ${getIndicatorBadgeStyle(rsi.label)}`}>
                            {rsi.label}
                        </span>
                    </div>
                    <div className={styles.indicatorValue}>{rsi.value}</div>
                    <div className={styles.indicatorBarTrack}>
                        <div
                            className={styles.indicatorBarFill}
                            style={{
                                width: `${Math.min(Math.max(rsi.value, 0), 100)}%`,
                                backgroundColor: rsi.value >= 70 ? '#EF4444' : rsi.value <= 30 ? '#10B981' : '#3B82F6'
                            }}
                        />
                    </div>
                </div>

                {/* MACD Card */}
                <div className={styles.indicatorCard}>
                    <div className={styles.indicatorCardTop}>
                        <span className={styles.indicatorName}>MACD Histogram</span>
                        <span className={`${styles.statusBadge} ${getIndicatorBadgeStyle(macd.label)}`}>
                            {macd.label}
                        </span>
                    </div>
                    <div className={styles.indicatorValue}>{macd.value}</div>
                    <div className={styles.indicatorSubLabel}>Signal Line Histogram Crossover</div>
                </div>

                {/* ATR Card */}
                <div className={styles.indicatorCard}>
                    <div className={styles.indicatorCardTop}>
                        <span className={styles.indicatorName}>ATR ({atr.period || 14})</span>
                        <span className={`${styles.statusBadge} ${getIndicatorBadgeStyle(atr.label)}`}>
                            {atr.label}
                        </span>
                    </div>
                    <div className={styles.indicatorValue}>{atr.value}</div>
                    <div className={styles.indicatorSubLabel}>Average True Range Volatility</div>
                </div>

                {/* EMA Card */}
                <div className={styles.indicatorCard}>
                    <div className={styles.indicatorCardTop}>
                        <span className={styles.indicatorName}>EMA ({ema.period || 50})</span>
                        <span className={`${styles.statusBadge} ${getIndicatorBadgeStyle(ema.label)}`}>
                            {ema.label}
                        </span>
                    </div>
                    <div className={styles.indicatorValue}>{ema.value}</div>
                    <div className={styles.indicatorSubLabel}>Exponential Moving Average</div>
                </div>
            </div>
        </div>
    );
}
