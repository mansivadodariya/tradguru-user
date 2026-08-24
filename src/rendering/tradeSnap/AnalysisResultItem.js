'use client';
import React from 'react';
import { motion } from 'framer-motion';
import styles from './tradeSnap.module.scss';
import { ClockIcon, TrendUpIcon, TrendDownIcon, ChartIcon, EyeIcon } from './icons';

function formatSymbol(symbol) {
    if (!symbol) return 'Unknown';
    return String(symbol).split(' - ')[0].split(' LTD')[0];
}

function formatValue(val) {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') {
        if (val.price !== undefined) return String(val.price);
        if (val.value !== undefined) return String(val.value);
        if (val.label !== undefined) return String(val.label);
        return String(val.price || val.value || JSON.stringify(val));
    }
    const str = String(val).trim();
    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'nan') return '-';
    return str;
}

/** e.g. future_sell → Future Sell, no_trade → No Trade */
function formatTradeCall(tradeCall) {
    if (!tradeCall) return '—';
    const raw = String(tradeCall).trim();
    if (!raw) return '—';

    return raw
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export default function AnalysisResultItem({ trade, index, onViewDetails }) {
    if (!trade) return null;
    const call = (trade.trade_call || '').toLowerCase();
    const isBuy = call.includes('buy');
    const isSell = call.includes('sell');
    const isNoTrade = call === 'no_trade';
    const confidence = parseInt(trade?.confidence, 10) || 0;

    const confidenceClass =
        confidence >= 70 ? styles.confidenceHigh : confidence >= 40 ? styles.confidenceMid : styles.confidenceLow;

    const ringOffset = 2 * Math.PI * 34 * (1 - confidence / 100);

    return (
        <motion.article
            className={styles.resultCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
        >
            <div className={styles.resultHeader}>
                <div>
                    <div className={styles.resultTitleRow}>
                        <h3>{formatSymbol(trade?.symbol)}</h3>
                        {trade.Trade && (
                            <span className={styles.tradeTypeBadge}>{String(trade.Trade).toUpperCase()}</span>
                        )}
                        <span className={styles.timeframeBadge}>
                            <ClockIcon />
                            {trade?.timeframe}
                        </span>
                    </div>
                    <div
                        className={`${styles.signalPill} ${isBuy ? styles.signalBuy : isSell ? styles.signalSell : styles.signalNeutral}`}
                    >
                        {isBuy && <img src="/assets/images/bull.png" alt="Bull" className={styles.miniSignalImg} />}
                        {isSell && <img src="/assets/images/bear.png" alt="Bear" className={styles.miniSignalImg} />}
                        {isNoTrade && <ChartIcon />}
                        <span>{formatTradeCall(trade?.trade_call)}</span>
                    </div>
                </div>

                <div className={styles.confidenceWrap}>
                    <div className={`${styles.confidenceRing} ${confidenceClass}`}>
                        <svg viewBox="0 0 80 80" aria-hidden="true">
                            <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="7" />
                            <motion.circle
                                cx="40"
                                cy="40"
                                r="34"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                strokeDasharray={2 * Math.PI * 34}
                                strokeDashoffset={ringOffset}
                                strokeLinecap="round"
                                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                                animate={{ strokeDashoffset: ringOffset }}
                                transition={{ duration: 0.8 }}
                            />
                        </svg>
                        <span>{confidence}%</span>
                    </div>
                    <span className={`${styles.confidenceLabel} ${confidenceClass}`}>Confidence</span>
                </div>
            </div>

            {!isNoTrade && (
                <div className={styles.resultBody}>
                    <div className={styles.detailGrid}>
                        <div className={styles.detailBox}>
                            <span>Entry Price</span>
                            <strong>{formatValue(trade?.entry?.split('(')[0].trim())}</strong>
                        </div>
                        <div className={styles.detailBox}>
                            <span>Stop Loss</span>
                            <strong className={styles.lossText}>{formatValue(trade.stop_loss)}</strong>
                        </div>
                    </div>

                    <div className={styles.targetsGrid}>
                        <div className={styles.targetsBox}>
                            <span className={styles.targetsLabel}>TARGETS</span>
                            <div className={styles.targetsList}>
                                {Object.entries(trade?.targets || trade?.Targets || {}).map(([key, value], i) => {
                                    const formattedVal = formatValue(value);
                                    return formattedVal !== '-' ? (
                                        <div key={key} className={styles.targetRow}>
                                            <span>Target {i + 1}</span>
                                            <strong className={styles.profitText}>{formattedVal}</strong>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                        <div className={styles.srColumn}>
                            <div className={styles.detailBox}>
                                <span>Support</span>
                                <strong>
                                    {(() => {
                                        const sp = trade?.Support_price || trade.support_price;
                                        return formatValue(typeof sp === 'string' ? sp.split('-')[0].trim() : sp);
                                    })()}
                                </strong>
                            </div>
                            <div className={styles.detailBox}>
                                <span>Resistance</span>
                                <strong>{formatValue(trade?.Resistance_price || trade.resistance_price)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {trade.rationale && onViewDetails && (
                <button type="button" className={styles.viewDetailsBtn} onClick={() => onViewDetails(trade)}>
                    <EyeIcon />
                    View Detailed Analysis
                </button>
            )}
        </motion.article>
    );
}
