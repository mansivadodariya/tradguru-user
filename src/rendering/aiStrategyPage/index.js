'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import styles from './aiStrategyPage.module.scss';
import LineText from '@/components/lineText';
import Button from '@/components/button';
import { useRouter } from 'next/navigation';
import { authNavigate } from '@/lib/authRedirect';

const InteractiveCandlestickChart = dynamic(
    () => import('./InteractiveCandlestickChart'),
    { ssr: false, loading: () => <div className={styles.chartLoadingPlaceholder}>Loading Interactive Candlestick Chart...</div> }
);

const SearchMd = '/assets/icons/search-md.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const RoundImage = '/assets/images/round-vec.svg';

const AiStrategyImage = '/assets/images/ai-strategy.png';
const StratagyImage = '/assets/images/stratagyImage.png';

const PRESET_ANALYSES = [
    {
        title: 'XAU/USD 1H Confluence',
        prompt: 'Analyze XAUUSD on 1H with EMA 20/50/200 alignment, RSI 14 divergence, and pivot point resistance.'
    },
    {
        title: 'EUR/USD 15M Market Structure',
        prompt: 'Evaluate EURUSD 15M market structure, nearest support/resistance levels, and buy/sell volume pressure.'
    },
    {
        title: 'GBP/JPY 1H Trend Engine',
        prompt: 'Check GBPJPY 1H trend strength, ADX momentum, MACD signal line, and technical score breakdown.'
    },
    {
        title: 'USD/CAD 5M Scalp Scanner',
        prompt: 'Run 5M momentum scan on USDCAD checking relative volume ratio and pivot S1/R1 levels.'
    }
];

export default function AiStrategyPage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');

    const handleAction = (customPrompt) => {
        authNavigate(router, '/dashboard');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAction(prompt);
        }
    };

    return (
        <div className={styles.aiStrategyPage}>
            <div className='container-xs4'>
                <div className={styles.titleWrapper}>
                    <LineText text="AI-Powered Technical Analysis & Strategy Engine" />
                    <div className={styles.title}>
                        <h1>Real-Time Forex & Gold Technical Intelligence</h1>
                        <p>
                            Scan 28 currency pairs and spot metals with automated multi-timeframe indicator confluence,
                            quantitative technical scoring (0-100), and structured AI signal reasoning.
                        </p>
                    </div>
                </div>

                <div className={styles.promptWrapper}>
                    {/* Image Showcase Box 2: stratagyImage.png */}
                    <motion.div
                        className={styles.bannerBox}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className={styles.boxContent}>
                            <LineText text="AI Strategy Builder" start />
                            <h3>Turn Market Concepts into Executable Trading Strategies</h3>
                            <p>
                                Describe your rules, technical indicators, or risk parameters. Get automated strategy signals,
                                backtest reports, and direct MT5 integration.
                            </p>
                            <Button icon={ArrowIcon} text="Try AI Strategy Now" onClick={() => authNavigate(router, '/dashboard')} />
                        </div>
                        <div className={styles.boxImage}>
                            <img src={StratagyImage} alt="Strategy Builder Showcase" />
                        </div>
                        <div className={styles.roundVec}>
                            <img src={RoundImage} alt="Vector decoration" />
                        </div>
                    </motion.div>

                    {/* Features Grid based on actual 3 panels of ai-strategy workspace */}
                    <div className={styles.cardsGrid}>
                        <div
                            className={styles.card}
                            onClick={() => authNavigate(router, '/dashboard')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='Watchlist' />
                                </div>
                                <h3>Multi-Pair Live Watchlist</h3>
                            </div>
                            <p>Track real-time prices, pip changes, and active strategy signals across 28 currency pairs and spot metals.</p>
                        </div>

                        <div
                            className={styles.card}
                            onClick={() => authNavigate(router, '/dashboard')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='Technical Score' />
                                </div>
                                <h3>Quantitative Technical Score</h3>
                            </div>
                            <p>Get a weighted 0-100 score analyzing Trend, Momentum, Volume pressure, and Pivots across 5m, 15m, 1h, and 1d.</p>
                        </div>

                        <div
                            className={styles.card}
                            onClick={() => authNavigate(router, '/dashboard')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='AI Evidence' />
                                </div>
                                <h3>AI Confluence & Evidence</h3>
                            </div>
                            <p>Inspect structured bullish and bearish evidence bullets with detailed indicator actions, MACD, ADX, and pivot levels.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
