'use client';
import React from 'react';
import styles from '../aiSnapDashboard.module.scss';
import { ShieldAlertIcon, InfoIcon } from './AiSnapIcons';

export default function RiskFlagsStack({ riskFlags }) {
    if (!riskFlags || !Array.isArray(riskFlags) || riskFlags.length === 0) return null;

    return (
        <div className={styles.riskFlagsSection}>
            <div className={styles.riskSectionHeader}>
                <ShieldAlertIcon size={18} className={styles.riskSectionIcon} />
                <h3>Risk Flags & Divergence Warnings</h3>
            </div>

            <div className={styles.riskStackList}>
                {riskFlags.map((flag, index) => {
                    const level = (flag.level || 'info').toLowerCase();
                    const isDanger = level === 'danger' || level === 'error';
                    const isWarning = level === 'warning';

                    const cardClass = isDanger
                        ? styles.riskDangerCard
                        : isWarning
                        ? styles.riskWarningCard
                        : styles.riskInfoCard;

                    const iconColor = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#3B82F6';

                    return (
                        <div key={index} className={`${styles.riskCard} ${cardClass}`}>
                            <div className={styles.riskIconWrap} style={{ color: iconColor }}>
                                <ShieldAlertIcon size={16} />
                            </div>
                            <div className={styles.riskMessageText}>
                                <strong>[{level.toUpperCase()}]</strong> {flag.message || flag}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
