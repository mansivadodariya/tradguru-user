'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import styles from './aiStrategyPage.module.scss';
import LineText from '@/components/lineText';
import Button from '@/components/button';
import { useRouter } from 'next/navigation';
import { authNavigate } from '@/lib/authRedirect';
import { useLanguage } from '@/context/LanguageContext';

const InteractiveCandlestickChart = dynamic(
    () => import('./InteractiveCandlestickChart'),
    { ssr: false, loading: () => <div className={styles.chartLoadingPlaceholder}>Loading Interactive Candlestick Chart...</div> }
);

const SearchMd = '/assets/icons/search-md.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const RoundImage = '/assets/images/round-vec.svg';

const AiStrategyImage = '/assets/images/ai-strategy.png';
const StratagyImage = '/assets/images/stratagyImage.png';

export default function AiStrategyPage() {
    const router = useRouter();
    const { t } = useLanguage();
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
                    <LineText text={t('nav.aiStrategy', 'AI-Powered Technical Analysis & Strategy Engine')} />
                    <div className={styles.title}>
                        <h1>{t('aiStrategy.title', 'Real-Time Forex & Gold Technical Intelligence')}</h1>
                        <p>
                            {t('aiStrategy.subtitle', 'Scan currency pairs and spot metals with automated multi-timeframe indicator confluence, quantitative technical scoring, and structured AI signal reasoning.')}
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
                            <LineText text={t('nav.aiStrategy', 'AI Strategy Builder')} start />
                            <h3>{t('aiStrategy.builderTitle', 'Turn Market Concepts into Executable Trading Strategies')}</h3>
                            <p>
                                {t('aiStrategy.builderDesc', 'Describe your rules, technical indicators, or risk parameters. Get automated strategy signals, backtest reports, and direct MT5 integration.')}
                            </p>
                            <Button icon={ArrowIcon} text={t('aiStrategy.generateBtn', 'Try AI Strategy Now')} onClick={() => authNavigate(router, '/dashboard')} />
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
                                <h3>{t('aiStrategy.liveAnalysisTitle', 'Multi-Pair Live Watchlist')}</h3>
                            </div>
                            <p>{t('aiStrategy.liveAnalysisSubtitle', 'Track real-time prices, pip changes, and active strategy signals across 28 currency pairs and spot metals.')}</p>
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
                                <h3>{t('tradeSnap.confidenceScore', 'Quantitative Technical Score')}</h3>
                            </div>
                            <p>{t('aiStrategy.quantScoreDesc', 'Get a weighted 0-100 score analyzing Trend, Momentum, Volume pressure, and Pivots across multiple timeframes.')}</p>
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
                                <h3>{t('aiStrategy.strategyResults', 'AI Confluence & Evidence')}</h3>
                            </div>
                            <p>{t('tradeSnap.analysisResult', 'Inspect structured bullish and bearish evidence bullets with detailed indicator actions, MACD, ADX, and pivot levels.')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
