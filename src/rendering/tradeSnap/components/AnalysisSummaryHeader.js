'use client';
import React from 'react';
import styles from '../aiSnapDashboard.module.scss';
import { ClockIcon, TrendingUpIcon, TrendingDownIcon, ActivityIcon, CheckCircle2Icon } from './AiSnapIcons';

export default function AnalysisSummaryHeader({ symbol, timeframe, currentPrice, volume, change, isChartValid, onOpenTimeframeModal }) {
    const isChangePositive = typeof change === 'string' ? !change.startsWith('-') : change >= 0;
    const formattedPrice = currentPrice ? (typeof currentPrice === 'number' ? `$${currentPrice.toFixed(4)}` : currentPrice) : '$0.8010';

    return (
        <div className={styles.summaryHeaderGrid}>
            {/* Top Bar: Symbol Title + Timeframe + Validation Badge */}
            <div className={styles.symbolBadgeWrap}>
                <h1 className={styles.symbolTitle}>{symbol || 'USDCHF'}</h1>
                <button
                    type="button"
                    className={styles.timeframePill}
                    onClick={onOpenTimeframeModal}
                    title="Click to change analysis timeframe horizon"
                >
                    <ClockIcon size={13} /> {timeframe || '15M'}
                </button>
                {isChartValid !== undefined && (
                    <span className={`${styles.validChartBadge} ${isChartValid ? styles.validGreen : styles.validRed}`}>
                        <CheckCircle2Icon size={12} /> {isChartValid ? 'Valid Chart' : 'Invalid Chart'}
                    </span>
                )}
            </div>

            {/* Middle Focus Block: Current Price */}
            <div className={styles.priceHeroBlock}>
                <div className={styles.priceHeroLabel}>CURRENT ASSET PRICE</div>
                <div className={styles.priceHeroValueRow}>
                    <span className={styles.priceHeroMainVal}>{formattedPrice}</span>
                    <span className={styles.liveStatusTag}>
                        <span className={styles.livePulseDot} /> LIVE
                    </span>
                </div>
            </div>

            {/* Bottom Metrics Row: Uniform 3-Box Grid */}
            <div className={styles.summaryMetricsGrid}>
                <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>VOLUME</span>
                    <span className={styles.metricVal}>{volume || '—'}</span>
                </div>

                <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>24H CHANGE</span>
                    <div className={`${styles.changeBadge} ${isChangePositive ? styles.changeGreen : styles.changeRed}`}>
                        {isChangePositive ? <TrendingUpIcon size={13} /> : <TrendingDownIcon size={13} />}
                        <span>{change || '-0.04%'}</span>
                    </div>
                </div>

                <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>MARKET FREQUENCY</span>
                    <span className={styles.metricVal}>
                        <ActivityIcon size={14} /> Realtime AI
                    </span>
                </div>
            </div>
        </div>
    );
}
