'use client';
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../aiSnapDashboard.module.scss';
import { GaugeIcon } from './AiSnapIcons';
import { useTheme } from '@/context/ThemeContext';

export default function TechnicalScoreGauge({ technicalScore, marketAssessment }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const score = parseInt(technicalScore?.total ?? 50, 10);
    const max = parseInt(technicalScore?.max ?? 100, 10);
    const confidence = technicalScore?.confidence || marketAssessment?.confidence || '0%';

    // Normalized score: 0 to 100
    const normalizedScore = Math.min(Math.max(score, 0), 100);

    // Angle calculation: -90deg (Strong sell) to +90deg (Strong buy)
    const angle = (normalizedScore / 100) * 180 - 90;

    // Arc length for R=78 semi-circle is Math.PI * 78 ≈ 245.04
    const arcLength = 245.04;
    const strokeDashoffset = arcLength * (1 - normalizedScore / 100);

    // Active state detection
    const isStrongSell = normalizedScore <= 20;
    const isSell = normalizedScore > 20 && normalizedScore <= 40;
    const isNeutral = normalizedScore > 40 && normalizedScore < 60;
    const isBuy = normalizedScore >= 60 && normalizedScore < 80;
    const isStrongBuy = normalizedScore >= 80;

    const getVerdictText = () => {
        if (technicalScore?.label && technicalScore.label !== 'NEUTRAL') {
            return technicalScore.label;
        }
        if (isStrongBuy) return 'Strong buy';
        if (isBuy) return 'Buy';
        if (isStrongSell) return 'Strong sell';
        if (isSell) return 'Sell';
        return 'Neutral';
    };

    const verdictText = getVerdictText();

    const getVerdictColor = () => {
        if (isStrongBuy || isBuy) return '#10B981'; // Emerald Green
        if (isStrongSell || isSell) return '#EF4444'; // Red
        return '#F59E0B'; // Amber Gold Neutral
    };

    const verdictColor = getVerdictColor();

    const trackColor = isDark ? '#2A2E39' : '#E2E8F0';
    const needleColor = isDark ? '#FFFFFF' : '#1E293B';
    const defaultTextColor = isDark ? '#6B7280' : '#94A3B8';

    return (
        <div className={styles.scoreGaugeCard}>
            <div className={styles.cardHeaderSmall}>
                <GaugeIcon size={16} className={styles.headerIcon} />
                <span>Technical Score Speedometer</span>
            </div>

            <div className={styles.gaugeContainer}>
                {/* SVG Gauge Matching Platform Theme */}
                <svg viewBox="0 0 280 148" className={styles.gaugeSvg}>
                    <defs>
                        {/* Theme Red -> Orange -> Amber -> Emerald Gradient */}
                        <linearGradient id="refGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#EF4444" />
                            <stop offset="25%" stopColor="#F97316" />
                            <stop offset="50%" stopColor="#F59E0B" />
                            <stop offset="75%" stopColor="#34D399" />
                            <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>

                        <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Background Track Arc */}
                    <path
                        d="M 62 118 A 78 78 0 0 1 218 118"
                        fill="none"
                        stroke={trackColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                    />

                    {/* Active Filled Gradient Arc with smooth animation */}
                    <motion.path
                        d="M 62 118 A 78 78 0 0 1 218 118"
                        fill="none"
                        stroke="url(#refGaugeGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={arcLength}
                        initial={{ strokeDashoffset: arcLength }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                    />

                    {/* Reference Labels Around The Arc */}
                    {/* 1. Strong sell (0% / Left - anchored to the left of the arc) */}
                    <text
                        x="50"
                        y="122"
                        fill={isStrongSell ? '#EF4444' : defaultTextColor}
                        fontSize="11"
                        fontWeight={isStrongSell ? '700' : '500'}
                        textAnchor="end"
                    >
                        Strong sell
                    </text>

                    {/* 2. Sell (25% / Top-Left) */}
                    <text
                        x="68"
                        y="52"
                        fill={isSell ? '#F87171' : defaultTextColor}
                        fontSize="11"
                        fontWeight={isSell ? '700' : '500'}
                        textAnchor="middle"
                    >
                        Sell
                    </text>

                    {/* 3. Neutral (50% / Top-Center) */}
                    <text
                        x="140"
                        y="22"
                        fill={isNeutral ? '#F59E0B' : defaultTextColor}
                        fontSize="11"
                        fontWeight={isNeutral ? '700' : '500'}
                        textAnchor="middle"
                    >
                        Neutral
                    </text>

                    {/* 4. Buy (75% / Top-Right) */}
                    <text
                        x="212"
                        y="52"
                        fill={isBuy ? '#34D399' : defaultTextColor}
                        fontSize="11"
                        fontWeight={isBuy ? '700' : '500'}
                        textAnchor="middle"
                    >
                        Buy
                    </text>

                    {/* 5. Strong buy (100% / Right - anchored to the right of the arc) */}
                    <text
                        x="230"
                        y="122"
                        fill={isStrongBuy ? '#10B981' : defaultTextColor}
                        fontSize="11"
                        fontWeight={isStrongBuy ? '700' : '500'}
                        textAnchor="start"
                    >
                        Strong buy
                    </text>

                    {/* Animated Silver / White Needle with attached pivot pin */}
                    <motion.g
                        style={{ transformOrigin: '140px 118px' }}
                        initial={{ rotate: -90 }}
                        animate={{ rotate: angle }}
                        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                    >
                        {/* Needle stem pointer */}
                        <line
                            x1="140"
                            y1="118"
                            x2="140"
                            y2="52"
                            stroke={needleColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            style={{ filter: isDark ? 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))' }}
                        />
                        {/* Attached Center Pivot Dot */}
                        <circle
                            cx="140"
                            cy="118"
                            r="3.5"
                            fill={needleColor}
                            style={{ filter: isDark ? 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))' }}
                        />
                    </motion.g>
                </svg>

                {/* Prominent Verdict & Score Display */}
                <div className={styles.gaugeCenterText}>
                    <h3 className={styles.verdictBigTitle} style={{ color: verdictColor }}>
                        {verdictText}
                    </h3>
                    <div className={styles.scoreDetailRow}>
                        <span className={styles.bigScoreVal}>{score}</span>
                        <span className={styles.scoreDenom}>/ {max}</span>
                        {confidence && (
                            <span className={styles.confidenceMiniTag}>
                                • Conf: <strong>{confidence}</strong>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {technicalScore?.formula && (
                <div className={styles.formulaFooter}>
                    Formula: <code>{technicalScore.formula}</code>
                </div>
            )}
        </div>
    );
}
