'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../aiSnapDashboard.module.scss';
import { CopyIcon, BellIcon, FlameIcon } from './AiSnapIcons';
import { toast } from '@/components/toast';

export default function PatternsKeyLevelsCard({ patternsDetected }) {
    const [copiedLevel, setCopiedLevel] = useState(null);

    const supportLevels = patternsDetected?.support_levels || ['0.798535'];
    const resistanceLevels = patternsDetected?.resistance_levels || ['0.804922', '0.812987', '0.819655'];
    const chartPatterns = patternsDetected?.chart_patterns || [
        { name: "V-shaped recovery after sharp selloff", confidence: 66 },
        { name: "Ascending channel / higher-highs-higher-lows sequence", confidence: 60 }
    ];

    const handleCopy = (level, type, index) => {
        navigator.clipboard.writeText(level);
        const key = `${type}-${index}`;
        setCopiedLevel(key);
        toast.success(`Copied ${type} level: ${level}`);
        setTimeout(() => setCopiedLevel(null), 2000);
    };

    return (
        <div className={styles.patternsKeyLevelsCard}>
            <div className={styles.cardHeaderRow}>
                <h3>Patterns & Key Levels Diagnosis</h3>
                <span className={styles.patternCountBadge}>{chartPatterns.length} Patterns Detected</span>
            </div>

            <div className={styles.patternsLevelsGrid}>
                {/* Left Column: Support & Resistance Pills */}
                <div className={styles.levelsColumn}>
                    {/* Support Levels */}
                    <div className={styles.levelGroup}>
                        <div className={styles.levelGroupHeader}>
                            <span className={styles.supportDot} />
                            <span>SUPPORT LEVELS (S1, S2, S3)</span>
                        </div>
                        <div className={styles.pillsList}>
                            {supportLevels.map((lvl, i) => (
                                <div key={`sup-${i}`} className={`${styles.levelPill} ${styles.supportPill}`}>
                                    <span className={styles.pillIndex}>S{i + 1}</span>
                                    <strong className={styles.pillPrice}>{lvl}</strong>
                                    <button
                                        type="button"
                                        className={styles.pillCopyBtn}
                                        onClick={() => handleCopy(lvl, 'Support', i)}
                                        title="Copy Support Level"
                                    >
                                        <CopyIcon size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resistance Levels */}
                    <div className={styles.levelGroup}>
                        <div className={styles.levelGroupHeader}>
                            <span className={styles.resistanceDot} />
                            <span>RESISTANCE LEVELS (R1, R2, R3)</span>
                        </div>
                        <div className={styles.pillsList}>
                            {resistanceLevels.map((lvl, i) => (
                                <div key={`res-${i}`} className={`${styles.levelPill} ${styles.resistancePill}`}>
                                    <span className={styles.pillIndexRes}>R{i + 1}</span>
                                    <strong className={styles.pillPrice}>{lvl}</strong>
                                    <button
                                        type="button"
                                        className={styles.pillCopyBtn}
                                        onClick={() => handleCopy(lvl, 'Resistance', i)}
                                        title="Copy Resistance Level"
                                    >
                                        <CopyIcon size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Chart Patterns Progress Bars */}
                <div className={styles.patternsColumn}>
                    <div className={styles.levelGroupHeader}>
                        <FlameIcon size={15} className={styles.flameIcon} />
                        <span>CHART PATTERN MATCHES</span>
                    </div>

                    <div className={styles.patternsList}>
                        {chartPatterns.map((pat, i) => {
                            const conf = pat.confidence || 50;
                            return (
                                <div key={i} className={styles.patternItemCard}>
                                    <div className={styles.patternItemHeader}>
                                        <span className={styles.patternName}>{pat.name}</span>
                                        <strong className={styles.patternConfVal}>{conf}% Match</strong>
                                    </div>
                                    <div className={styles.patternTrack}>
                                        <motion.div
                                            className={styles.patternFill}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${conf}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
