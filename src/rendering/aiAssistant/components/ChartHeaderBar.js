'use client';

import React from 'react';
import styles from '../aiAssistant.module.scss';

export default function ChartHeaderBar({
    onToggleChatPanel,
    activeSymbol,
    latestCandle,
    priceChangePct,
    onTakeSnapshot,
    snapshotLoading,
}) {
    const isUp = latestCandle && latestCandle.close >= latestCandle.open;
    const priceText = latestCandle ? latestCandle.close.toFixed(5) : '...';
    const changeText = priceChangePct !== 0 
        ? `${priceChangePct > 0 ? '+' : ''}${priceChangePct.toFixed(2)}%` 
        : '0.00%';

    return (
        <div className={styles.chartHeaderControls}>
            <div className={styles.headerLeftGroup}>
                <button
                    type="button"
                    className={styles.headerIconButton}
                    onClick={onToggleChatPanel}
                    title="Toggle Chat Panel"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                </button>

                {/* Top-left real-time price badge */}
                <div className={`${styles.headerLivePriceBadge} ${isUp ? styles.badgeUp : styles.badgeDown}`}>
                    <span className={styles.badgeSymbol}>{activeSymbol}</span>
                    <span className={styles.badgePrice}>{priceText}</span>
                    <span className={styles.badgeDirection}>{isUp ? '▲' : '▼'}</span>
                    <span className={styles.badgeChange}>{changeText}</span>
                </div>
            </div>

            <div className={styles.headerRightGroup}>
                <button
                    type="button"
                    className={styles.iconControlBtn}
                    onClick={onTakeSnapshot}
                    disabled={snapshotLoading}
                    title="Capture Chart Screenshot"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
