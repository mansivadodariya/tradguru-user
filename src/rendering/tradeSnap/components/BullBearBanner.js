'use client';
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../aiSnapDashboard.module.scss';
import { FlameIcon, ActivityIcon } from './AiSnapIcons';
import { useTheme } from '@/context/ThemeContext';

function ConvictionCircle({ value, color = '#10B981', trackColor = 'rgba(255, 255, 255, 0.08)' }) {
    const numericVal = parseInt(String(value).replace(/[^0-9]/g, '') || '80', 10);
    const clamped = Math.min(Math.max(numericVal, 0), 100);
    const radius = 22;
    const circumference = 2 * Math.PI * radius; // 138.23
    const strokeDashoffset = circumference * (1 - clamped / 100);

    return (
        <div className={styles.convictionCircleBox}>
            <svg width="56" height="56" viewBox="0 0 56 56" className={styles.convictionCircleSvg}>
                {/* Background Full Track Circle */}
                <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth="4.5"
                />
                {/* Active Colored Fill Arc */}
                <motion.circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
                />
            </svg>
            <div className={styles.convictionTextOverlay}>
                <span className={styles.convictionValText} style={{ color }}>
                    {clamped}%
                </span>
            </div>
        </div>
    );
}

export default function BullBearBanner({ tradeDecision, technicalScore, marketAssessment }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const trackColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    const action = (tradeDecision?.action || marketAssessment?.verdict || '').toUpperCase();
    const score = parseInt(technicalScore?.total ?? 50, 10);
    const conviction = tradeDecision?.conviction || '80%';

    const isBullish = action.includes('BUY') || score >= 58;
    const isBearish = action.includes('SELL') || score <= 42;

    if (isBullish) {
        return (
            <motion.div
                className={`${styles.heroBanner} ${styles.bullishHero}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className={styles.bannerWaveGlow} />
                <div className={styles.bannerContent}>
                    <div className={styles.bannerLeft}>
                        <div className={styles.bannerImageContainer}>
                            <motion.img
                                src="/assets/images/bull.png"
                                alt="Bullish Momentum"
                                className={styles.bullBannerImg}
                                animate={{ y: [0, -6, 0], scale: [1, 1.02, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            />
                            <div className={styles.bullGlowAura} />
                        </div>
                        <div className={styles.bannerTextCol}>
                            <div className={styles.bannerTagRow}>
                                <span className={styles.pulseDot} />
                                <span className={styles.bannerTagText}>BULLISH MOMENTUM RUNNING</span>
                            </div>
                            <h2 className={styles.bannerTitle}>
                                Strong Buyer Volume & Structure Breakout
                            </h2>
                            <p className={styles.bannerSubtitle}>
                                {tradeDecision?.rationale || "Structural higher-highs sequence confirmed. Favorable risk-to-reward long setup."}
                            </p>
                        </div>
                    </div>

                    <div className={styles.bannerRight}>
                        <div className={styles.bannerStatCard}>
                            <span className={styles.bannerStatLabel}>CONVICTION</span>
                            <div className={styles.convictionCircleRow}>
                                <ConvictionCircle value={conviction} color="#10B981" trackColor={trackColor} />
                            </div>
                        </div>
                        <div className={styles.bannerStatCard}>
                            <span className={styles.bannerStatLabel}>SIGNAL TYPE</span>
                            <span className={styles.bannerStatBadge}>
                                <FlameIcon size={14} /> {tradeDecision?.signal_type || 'STRONG BUY'}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (isBearish) {
        return (
            <motion.div
                className={`${styles.heroBanner} ${styles.bearishHero}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className={styles.bannerWaveGlowBear} />
                <div className={styles.bannerContent}>
                    <div className={styles.bannerLeft}>
                        <div className={styles.bannerImageContainer}>
                            <motion.img
                                src="/assets/images/bear.png"
                                alt="Bearish Pressure"
                                className={styles.bearBannerImg}
                                animate={{ y: [0, -6, 0], scale: [1, 1.02, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            />
                            <div className={styles.bearGlowAura} />
                        </div>
                        <div className={styles.bannerTextCol}>
                            <div className={styles.bannerTagRowRed}>
                                <span className={styles.pulseDotRed} />
                                <span className={styles.bannerTagText}>BEARISH PRESSURE RUNNING</span>
                            </div>
                            <h2 className={styles.bannerTitle}>
                                Intense Seller Distribution & Resistance Rejection
                            </h2>
                            <p className={styles.bannerSubtitle}>
                                {tradeDecision?.rationale || "Price action rejected repeatedly from key resistance levels with downward momentum."}
                            </p>
                        </div>
                    </div>

                    <div className={styles.bannerRight}>
                        <div className={styles.bannerStatCardRed}>
                            <span className={styles.bannerStatLabel}>CONVICTION</span>
                            <div className={styles.convictionCircleRow}>
                                <ConvictionCircle value={conviction} color="#EF4444" trackColor={trackColor} />
                            </div>
                        </div>
                        <div className={styles.bannerStatCardRed}>
                            <span className={styles.bannerStatLabel}>SIGNAL TYPE</span>
                            <span className={styles.bannerStatBadgeRed}>
                                <ActivityIcon size={14} /> {tradeDecision?.signal_type || 'STRONG SELL'}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className={`${styles.heroBanner} ${styles.neutralHero}`}>
            <div className={styles.bannerContent}>
                <div className={styles.bannerLeft}>
                    <div className={styles.neutralBannerImages}>
                        <motion.img
                            src="/assets/images/bull.png"
                            alt="Bull"
                            className={styles.neutralBullImg}
                            animate={{ x: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        />
                        <span className={styles.neutralVsBadge}>VS</span>
                        <motion.img
                            src="/assets/images/bear.png"
                            alt="Bear"
                            className={styles.neutralBearImg}
                            animate={{ x: [0, 3, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        />
                    </div>
                    <div className={styles.bannerTextCol}>
                        <div className={styles.bannerTagRowAmber}>
                            <span className={styles.pulseDotAmber} />
                            <span className={styles.bannerTagText}>SIDEWAYS MARKET CONSOLIDATION</span>
                        </div>
                        <h2 className={styles.bannerTitle}>No Clear Breakout Direction</h2>
                        <p className={styles.bannerSubtitle}>
                            Price is rangebound between key support and resistance boundaries. Await volatility expansion.
                        </p>
                    </div>
                </div>

                <div className={styles.bannerRight}>
                    <div className={styles.bannerStatCardAmber}>
                        <span className={styles.bannerStatLabel}>MARKET BIAS</span>
                        <div className={styles.convictionCircleRow}>
                            <ConvictionCircle value={50} color="#F59E0B" trackColor={trackColor} />
                        </div>
                    </div>
                    <div className={styles.bannerStatCardAmber}>
                        <span className={styles.bannerStatLabel}>SIGNAL TYPE</span>
                        <span className={styles.bannerStatBadgeAmber}>
                            <ActivityIcon size={14} /> NO_TRADE / WAIT
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
