'use client';
import React, { useState } from 'react';
import styles from '../aiSnapDashboard.module.scss';
import { TrendingUpIcon, TrendingDownIcon, CheckCircle2Icon, CopyIcon, InfoIcon } from './AiSnapIcons';
import { toast } from '@/components/toast';

function safeVal(val) {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') {
        if (val.price !== undefined) return String(val.price);
        if (val.value !== undefined) return String(val.value);
        if (val.label !== undefined) return String(val.label);
        if (val.message !== undefined) return String(val.message);
        return Object.values(val).map(v => (typeof v === 'object' ? safeVal(v) : v)).join(' ');
    }
    return String(val);
}

export default function TradeSignalSetupCard({ tradeDecision }) {
    const [copiedKey, setCopiedKey] = useState(null);

    const action = safeVal(tradeDecision?.action || 'BUY').toUpperCase();
    const isBuy = action.includes('BUY');
    const isSell = action.includes('SELL');

    const entryPrice = safeVal(tradeDecision?.entry_zone?.entry_price || tradeDecision?.entry_zone || tradeDecision?.entry || 'Market Price');
    const executionType = safeVal(tradeDecision?.entry_zone?.execution_type || 'Market Order / Retracement');

    const stopLossPrice = safeVal(tradeDecision?.stop_loss?.price || tradeDecision?.stop_loss || '—');
    const invalidationReason = safeVal(tradeDecision?.stop_loss?.invalidation_reason || tradeDecision?.stop_loss?.reason || 'Invalidation below key pivot level');

    const rawTargets = tradeDecision?.take_profit_targets || tradeDecision?.targets || {};
    let tp1 = '—';
    let tp2 = '—';
    let tp3 = '—';

    if (Array.isArray(rawTargets)) {
        if (rawTargets[0]) tp1 = safeVal(rawTargets[0]);
        if (rawTargets[1]) tp2 = safeVal(rawTargets[1]);
        if (rawTargets[2]) tp3 = safeVal(rawTargets[2]);
    } else if (typeof rawTargets === 'object') {
        tp1 = safeVal(rawTargets.tp1 || rawTargets.target1 || rawTargets.TP1 || Object.values(rawTargets)[0]);
        tp2 = safeVal(rawTargets.tp2 || rawTargets.target2 || rawTargets.TP2 || Object.values(rawTargets)[1]);
        tp3 = safeVal(rawTargets.tp3 || rawTargets.target3 || rawTargets.TP3 || Object.values(rawTargets)[2]);
    }

    const rrRatio = safeVal(tradeDecision?.risk_reward_ratio || tradeDecision?.risk_reward || '1:2.0');
    const rationale = safeVal(tradeDecision?.rationale || 'High probability setup aligned with higher timeframe structural momentum.');

    const handleCopy = (text, key) => {
        if (!text || text === '—') return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success(`Copied ${key}: ${text}`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className={styles.tradeSetupCard}>
            <div className={styles.tradeSetupHeader}>
                <div className={styles.actionBadgeWrap}>
                    <div className={`${styles.actionMainBadge} ${isBuy ? styles.actionBuy : isSell ? styles.actionSell : styles.actionNeutral}`}>
                        {isBuy ? <TrendingUpIcon size={18} /> : isSell ? <TrendingDownIcon size={18} /> : null}
                        <span>{action.includes('SIGNAL') ? action : `${action} SIGNAL`}</span>
                    </div>
                </div>

                <div className={styles.rrBadge}>
                    <span className={styles.rrLabel}>RISK : REWARD</span>
                    <strong className={styles.rrValue}>{rrRatio}</strong>
                </div>
            </div>

            {/* Main Metrics Grid */}
            <div className={styles.setupGrid}>
                {/* Entry Zone Box */}
                <div className={styles.setupBox}>
                    <div className={styles.boxTitleRow}>
                        <span>ENTRY ZONE</span>
                        <button
                            type="button"
                            className={styles.copyBtn}
                            onClick={() => handleCopy(entryPrice, 'Entry')}
                            title="Copy Entry Price"
                        >
                            <CopyIcon size={14} />
                            {copiedKey === 'Entry' && <span className={styles.copiedPopup}>Copied</span>}
                        </button>
                    </div>
                    <div className={styles.boxPrimaryValue}>{entryPrice}</div>
                    <div className={styles.boxSubInfo}>{executionType}</div>
                </div>

                {/* Stop Loss (SL) Box */}
                <div className={`${styles.setupBox} ${styles.slBox}`}>
                    <div className={styles.boxTitleRow}>
                        <span className={styles.slTextTitle}>STOP LOSS (SL)</span>
                        <button
                            type="button"
                            className={styles.copyBtn}
                            onClick={() => handleCopy(stopLossPrice, 'Stop Loss')}
                            title="Copy Stop Loss"
                        >
                            <CopyIcon size={14} />
                            {copiedKey === 'Stop Loss' && <span className={styles.copiedPopup}>Copied</span>}
                        </button>
                    </div>
                    <div className={styles.slPrimaryValue}>{stopLossPrice}</div>
                    <div className={styles.slReasonInfo}>
                        <InfoIcon size={12} /> {invalidationReason}
                    </div>
                </div>
            </div>

            {/* Take Profit (TP) Targets Grid */}
            <div className={styles.tpSection}>
                <div className={styles.tpSectionHeader}>
                    <span>TAKE PROFIT TARGETS</span>
                    <span className={styles.tpHintBadge}>Multiple Targets Setup</span>
                </div>

                <div className={styles.tpGrid}>
                    <div className={styles.tpPillCard}>
                        <div className={styles.tpPillTop}>
                            <span>TP 1 (Conservative)</span>
                            <CheckCircle2Icon size={14} className={styles.tpIcon} />
                        </div>
                        <div className={styles.tpPillVal}>{tp1}</div>
                    </div>

                    <div className={styles.tpPillCard}>
                        <div className={styles.tpPillTop}>
                            <span>TP 2 (Target)</span>
                            <CheckCircle2Icon size={14} className={styles.tpIcon} />
                        </div>
                        <div className={styles.tpPillVal}>{tp2}</div>
                    </div>

                    <div className={styles.tpPillCard}>
                        <div className={styles.tpPillTop}>
                            <span>TP 3 (Extended)</span>
                            <CheckCircle2Icon size={14} className={styles.tpIcon} />
                        </div>
                        <div className={styles.tpPillVal}>{tp3}</div>
                    </div>
                </div>
            </div>

            {/* Trade Rationale Box */}
            <div className={styles.rationaleBox}>
                <div className={styles.rationaleTitle}>TRADE RATIONALE & INSIGHTS</div>
                <p className={styles.rationaleText}>{rationale}</p>
            </div>
        </div>
    );
}
