'use client';

import React, { useState, useEffect } from 'react';
import styles from './aiStrategy.module.scss';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';

// SVG Icon Components
const ChevronIcon = ({ isOpen, className }) => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
        }}
        className={className}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const TrendArrowIcon = ({ direction, className }) => {
    const isUp = direction?.toLowerCase().includes('bull') || direction?.toLowerCase().includes('buy') || direction?.toLowerCase().includes('up') || direction === 'Above';
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isUp ? '#10b981' : '#ef4444'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                transform: isUp ? 'rotate(0deg)' : 'rotate(180deg)',
                flexShrink: 0
            }}
            className={className}
        >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
        </svg>
    );
};

const CircleCheckIcon = ({ color = '#10b981' }) => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: '8px', flexShrink: 0, marginTop: '2px' }}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const IndicatorIcon = ({ type }) => {
    switch (type) {
        case 'trend':
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            );
        case 'momentum':
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            );
        case 'volume':
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
            );
        case 'structure':
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
            );
        default:
            return null;
    }
};

const BrainRobotIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 7.54 16.59A6 6 0 0 0 14 13h-4a6 6 0 0 0-5.54 5.59A10 10 0 0 1 12 2z" />
        <circle cx="12" cy="10" r="3" />
        <path d="M8 18h8" />
    </svg>
);

const TrendBoxIcon = ({ isBullish }) => (
    <div className={`${styles.trendBoxIcon} ${isBullish ? styles.bullish : styles.bearish}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isBullish ? (
                <>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                </>
            ) : (
                <>
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                    <polyline points="17 18 23 18 23 12" />
                </>
            )}
        </svg>
    </div>
);

// Helper functions for parsing colors and values
function getScoreColor(label = '') {
    const l = label.toLowerCase();
    if (l.includes('bullish') || l.includes('buying') || l.includes('buy') || l.includes('oversold')) return '#10b981';
    if (l.includes('bearish') || l.includes('selling') || l.includes('sell') || l.includes('overbought')) return '#ef4444';
    return '#fbbf24'; // Neutral / Ranging
}

function formatValue(val) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
}

function formatVolVal(val) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    if (val === 0) return '0';
    if (val >= 10000000) return `${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
}

export default function AnalysisPanel({ symbol, strategyId, activeAnalysis, onAnalysisLoaded }) {
    const { language, t } = useLanguage();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Main Accordion Toggles
    const [expandedAccordions, setExpandedAccordions] = useState({
        score: true,
        evidence: false,
        trend: false,
        momentum: false,
        volume: false,
        ai: false
    });

    // Score Sub-details Toggles
    const [scoreSubToggles, setScoreSubToggles] = useState({
        trend: true,
        momentum: false,
        volume: false,
        structure: false
    });

    // Evidence Sub-details Toggles
    const [evidenceSubToggles, setEvidenceSubToggles] = useState({
        trend: true,
        momentum: false,
        volume: false,
        structure: false
    });

    const toggleMainAccordion = (key) => {
        setExpandedAccordions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleScoreSub = (key, e) => {
        e.stopPropagation();
        setScoreSubToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleEvidenceSub = (key, e) => {
        e.stopPropagation();
        setEvidenceSubToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Fetch analysis data from REST endpoint
    const fetchAnalysisData = async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);

        const cleanSymbol = symbol.replace('/', '').toUpperCase();
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.thetradermaster.com'}/api/v1/chart/analysis?symbol=${cleanSymbol}&lang=${language}`;

        try {
            const res = await fetch(url, {
                headers: {
                    'accept': 'application/json',
                    'Accept-Language': language,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (!res.ok) throw new Error('Failed to fetch analysis details');
            const data = await res.json();

            if (data.success && data.analysis) {
                setAnalysis(data.analysis);
                if (onAnalysisLoaded) {
                    onAnalysisLoaded(data.analysis);
                }
            } else {
                throw new Error('Analysis fetch unsuccessful');
            }
        } catch (err) {
            console.error('Error fetching analysis:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysisData();
    }, [symbol, strategyId]);

    if (loading) {
        return (
            <div className={styles.analysisPanelPlaceholder}>
                <div className={styles.analysisSpinner} />
                <span>Generating detailed analysis...</span>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className={styles.analysisPanelPlaceholder}>
                <span className={styles.analysisErrorText}>Failed to load analysis</span>
                <button onClick={fetchAnalysisData} className={styles.analysisRetryBtn}>Retry</button>
            </div>
        );
    }

    const {
        technical_score = {},
        ai_summary = {},
        evidence = {},
        levels = {},
        trend_indicators = {},
        momentum_indicators = {},
        volatility_indicators = {},
        pivot_points = {},
        trend_analysis = {},
        momentum = {},
        volume_analysis = {}
    } = analysis;

    const scoreColor = getScoreColor(technical_score.label);

    return (
        <div className={styles.analysisPanel}>
            {/* 1. TECHNICAL SCORE ACCORDION */}
            <div className={styles.premiumAccordion}>
                <div className={styles.premiumAccordionHeader} onClick={() => toggleMainAccordion('score')}>
                    <span>TECHNICAL SCORE</span>
                    <ChevronIcon isOpen={expandedAccordions.score} />
                </div>
                {expandedAccordions.score && (
                    <div className={styles.premiumAccordionBody}>
                        {/* Score Top Grid */}
                        <div className={styles.scoreTopRow}>
                            <div className={styles.scoreTextGroup}>
                                <div className={styles.largeScoreText}>
                                    <span style={{ color: scoreColor }}>{technical_score.total}</span>
                                    <span className={styles.scoreDivider}>/100</span>
                                </div>
                                <span className={styles.scoreTextLabel} style={{ color: scoreColor }}>
                                    {(technical_score.label || 'NEUTRAL').toUpperCase()}
                                </span>
                            </div>
                            <div className={styles.confidenceGroup}>
                                <span className={styles.confLabel}>CONFIDENCE</span>
                                <span className={styles.confValue}>{technical_score.confidence || '-'}</span>
                            </div>
                        </div>

                        {/* Breakdown Progress Bars */}
                        <div className={styles.breakdownProgressList}>
                            {technical_score.breakdown && Object.entries(technical_score.breakdown).map(([key, item]) => {
                                const pct = Math.round((item.score / item.max) * 100);
                                const isSubOpen = scoreSubToggles[key];
                                const itemColor = getScoreColor(item.label);

                                return (
                                    <div key={key} className={styles.progressRowContainer}>
                                        <div className={styles.progressBarRow} onClick={(e) => toggleScoreSub(key, e)}>
                                            <div className={styles.progressBarLabelGroup}>
                                                <IndicatorIcon type={key} />
                                                <span className={styles.progressBarTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                            </div>

                                            {/* Outer track & fill */}
                                            <div className={styles.progressOuterTrack}>
                                                <div
                                                    className={styles.progressFillBar}
                                                    style={{ width: `${pct}%`, backgroundColor: itemColor }}
                                                />
                                            </div>

                                            <div className={styles.progressValueGroup}>
                                                <span className={styles.progressScoreText}>{item.score}/{item.max}</span>
                                                <ChevronIcon isOpen={isSubOpen} className={styles.subChevron} />
                                            </div>
                                        </div>

                                        {/* Sub-details nested collapse */}
                                        {isSubOpen && (
                                            <div className={styles.progressSubDetailsCollapse}>
                                                {key === 'trend' && (
                                                    <div className={styles.subDetailTableGrid}>
                                                        {Object.entries(trend_indicators).slice(0, 6).map(([indKey, ind]) => (
                                                            <div key={indKey} className={styles.subDetailMetricRow}>
                                                                <span className={styles.metricName}>{indKey}</span>
                                                                <span className={styles.metricVal}>{formatValue(ind.value)}</span>
                                                                <span className={styles.metricAction} style={{ color: getScoreColor(ind.action) }}>
                                                                    {ind.action}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {key === 'momentum' && (
                                                    <div className={styles.subDetailTableGrid}>
                                                        {Object.entries(momentum_indicators).slice(0, 5).map(([indKey, ind]) => (
                                                            <div key={indKey} className={styles.subDetailMetricRow}>
                                                                <span className={styles.metricName}>{indKey}</span>
                                                                <span className={styles.metricVal}>{formatValue(ind.value)}</span>
                                                                <span className={styles.metricAction} style={{ color: getScoreColor(ind.action) }}>
                                                                    {ind.action}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {key === 'volume' && (
                                                    <div className={styles.subDetailSimpleRows}>
                                                        <div className={styles.simpleRowItem}>
                                                            <span>Relative Volume:</span>
                                                            <strong>{volume_analysis.relative_volume || '0'}x</strong>
                                                        </div>
                                                        <div className={styles.simpleRowItem}>
                                                            <span>Buying/Selling Ratio:</span>
                                                            <strong style={{ color: scoreColor }}>
                                                                {volume_analysis.pressure?.buy_pct}% Buy / {volume_analysis.pressure?.sell_pct}% Sell
                                                            </strong>
                                                        </div>
                                                    </div>
                                                )}
                                                {key === 'structure' && (
                                                    <div className={styles.subDetailSimpleRows}>
                                                        <div className={styles.simpleRowItem}>
                                                            <span>Support Level:</span>
                                                            <strong>{formatValue(levels.nearest_support)}</strong>
                                                        </div>
                                                        <div className={styles.simpleRowItem}>
                                                            <span>Resistance Level:</span>
                                                            <strong>{formatValue(levels.nearest_resistance)}</strong>
                                                        </div>
                                                        <div className={styles.simpleRowItem}>
                                                            <span>Pivot standard:</span>
                                                            <strong>{formatValue(pivot_points?.standard?.P)}</strong>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Formula Summary Row */}
                        <div className={styles.scoreFormulaRow}>
                            <span className={styles.formulaTitle}>TOTAL</span>
                            <span className={styles.formulaEquation} style={{ color: scoreColor }}>
                                {technical_score.formula || `${technical_score.total}/100`}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. EVIDENCE ACCORDION */}
            <div className={styles.premiumAccordion}>
                <div className={styles.premiumAccordionHeader} onClick={() => toggleMainAccordion('evidence')}>
                    <span>{t('aiStrategy.evidenceTitle', 'EVIDENCE')}</span>
                    <ChevronIcon isOpen={expandedAccordions.evidence} />
                </div>
                {expandedAccordions.evidence && (
                    <div className={styles.premiumAccordionBody}>
                        {Object.entries(evidence).map(([key, data]) => {
                            if (!data.details || data.details.length === 0) return null;
                            const isSubOpen = evidenceSubToggles[key];
                            const itemColor = getScoreColor(data.label);

                            return (
                                <div
                                    key={key}
                                    className={`${styles.evidenceOutlinedGroup} ${styles[key]}`}
                                >
                                    <div
                                        className={styles.evidenceGroupClickableHeader}
                                        onClick={(e) => toggleEvidenceSub(key, e)}
                                    >
                                        <div className={styles.evidenceTitleGroup}>
                                            <span className={styles.groupTypeTitle}>{key.toUpperCase()}</span>
                                            <span className={styles.groupTypeAction} style={{ color: itemColor }}>
                                                {data.label}
                                            </span>
                                        </div>
                                        <ChevronIcon isOpen={isSubOpen} className={styles.subChevron} />
                                    </div>

                                    {isSubOpen && (
                                        <div className={styles.evidenceCollapsedBulletArea}>
                                            <ul className={styles.evidenceOutlineBulletList}>
                                                {data.details.map((detail, idx) => (
                                                    <li key={idx} className={styles.evidenceBulletItem}>
                                                        <CircleCheckIcon color={itemColor} />
                                                        <span>{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. TREND ANALYSIS ACCORDION */}
            <div className={styles.premiumAccordion}>
                <div className={styles.premiumAccordionHeader} onClick={() => toggleMainAccordion('trend')}>
                    <span>{t('aiStrategy.trendTitle', 'TREND ANALYSIS')}</span>
                    <ChevronIcon isOpen={expandedAccordions.trend} />
                </div>
                {expandedAccordions.trend && (
                    <div className={styles.premiumAccordionBody}>
                        <div className={styles.trendRowHeader}>
                            <TrendBoxIcon isBullish={trend_analysis.direction?.toLowerCase().includes('bull') || trend_analysis.direction?.toLowerCase().includes('buy')} />
                            <div className={styles.trendHeaderText}>
                                <h4>{trend_analysis.direction || 'Neutral'}</h4>
                                <span>{trend_analysis.strength || '-'}</span>
                            </div>
                        </div>

                        {/* EMA Grid list */}
                        <div className={styles.indicatorMetricGrid}>
                            <div className={styles.metricGridItem}>
                                <div className={styles.indicatorLabelBox}>
                                    <span className={`${styles.dotDot} ${styles.ema20}`} />
                                    <span>EMA 20</span>
                                </div>
                                <div className={styles.indicatorValueAction}>
                                    <span className={styles.positionTxt} style={{ color: trend_analysis.ema_20?.position === 'Above' ? '#10b981' : '#ef4444' }}>
                                        {trend_analysis.ema_20?.position || 'Below'}
                                    </span>
                                    <TrendArrowIcon direction={trend_analysis.ema_20?.position} />
                                </div>
                            </div>

                            <div className={styles.metricGridItem}>
                                <div className={styles.indicatorLabelBox}>
                                    <span className={`${styles.dotDot} ${styles.ema50}`} />
                                    <span>EMA 50</span>
                                </div>
                                <div className={styles.indicatorValueAction}>
                                    <span className={styles.positionTxt} style={{ color: trend_analysis.ema_50?.position === 'Above' ? '#10b981' : '#ef4444' }}>
                                        {trend_analysis.ema_50?.position || 'Below'}
                                    </span>
                                    <TrendArrowIcon direction={trend_analysis.ema_50?.position} />
                                </div>
                            </div>

                            <div className={styles.metricGridItem}>
                                <div className={styles.indicatorLabelBox}>
                                    <span className={`${styles.dotDot} ${styles.supertrend}`} />
                                    <span>SuperTrend</span>
                                </div>
                                <div className={styles.indicatorValueAction}>
                                    <span className={styles.positionTxt} style={{ color: trend_analysis.supertrend?.direction === 'BULLISH' ? '#10b981' : '#ef4444' }}>
                                        {trend_analysis.supertrend?.direction === 'BULLISH' ? 'Above' : 'Below'}
                                    </span>
                                    <TrendArrowIcon direction={trend_analysis.supertrend?.direction === 'BULLISH' ? 'Above' : 'Below'} />
                                </div>
                            </div>
                        </div>

                        {/* Trend Confidence Fill */}
                        <div className={styles.trendConfidenceContainer}>
                            <div className={styles.confidenceTexts}>
                                <span>Trend Confidence</span>
                                <strong>{trend_analysis.trend_confidence || '-'}</strong>
                            </div>
                            <div className={styles.confidenceTrack}>
                                <div
                                    className={styles.confidenceFill}
                                    style={{
                                        width: trend_analysis.trend_confidence || '0%',
                                        backgroundColor: scoreColor
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. MOMENTUM ACCORDION */}
            <div className={styles.premiumAccordion}>
                <div className={styles.premiumAccordionHeader} onClick={() => toggleMainAccordion('momentum')}>
                    <span>{t('aiStrategy.momentumTitle', 'MOMENTUM')}</span>
                    <ChevronIcon isOpen={expandedAccordions.momentum} />
                </div>
                {expandedAccordions.momentum && (
                    <div className={styles.premiumAccordionBody}>
                        {/* RSI Slider Range */}
                        <div className={styles.momentumSliderContainer}>
                            <div className={styles.sliderLabelRow}>
                                <span className={styles.sliderName}>RSI (14)</span>
                                <span className={styles.sliderValTxt}>{formatValue(momentum.rsi?.value)}</span>
                            </div>

                            {/* Gradient Track & Pin Pointer */}
                            <div className={styles.gradientTrackBg}>
                                <div
                                    className={styles.sliderPinPointer}
                                    style={{ left: `${Math.min(100, Math.max(0, momentum.rsi?.value || 50))}%` }}
                                >
                                    <div className={styles.pinDot} />
                                    <div className={styles.pinLine} />
                                </div>
                                <span className={styles.axisMarker} style={{ left: '30%' }}>30</span>
                                <span className={styles.axisMarker} style={{ left: '70%' }}>70</span>
                            </div>

                            <span className={styles.sliderStatusLabel}>
                                {momentum.rsi?.value < 30 ? 'Oversold' : momentum.rsi?.value > 70 ? 'Overbought' : 'Neutral'}
                            </span>
                        </div>

                        {/* MACD Histogram Zero Center Bar */}
                        {momentum.macd && (
                            <div className={styles.macdMetricsContainer}>
                                <div className={styles.macdHeaderRow}>
                                    <span className={styles.macdTitle}>MACD ({momentum.macd.params})</span>
                                    <span
                                        className={styles.macdLabelValue}
                                        style={{ color: getScoreColor(momentum.macd.direction) }}
                                    >
                                        {momentum.macd.direction}
                                    </span>
                                </div>

                                {/* Histogram Center Alignment Track */}
                                <div className={styles.macdHistogramTrack}>
                                    <div className={styles.centerLine} />
                                    {momentum.macd.histogram !== undefined && (
                                        <div
                                            className={styles.histogramFillBar}
                                            style={{
                                                left: momentum.macd.histogram >= 0 ? '50%' : `calc(50% - ${Math.min(48, Math.abs(momentum.macd.histogram) * 2.5)}%)`,
                                                width: `${Math.min(48, Math.abs(momentum.macd.histogram) * 2.5)}%`,
                                                backgroundColor: momentum.macd.histogram >= 0 ? '#10b981' : '#ef4444'
                                            }}
                                        />
                                    )}
                                </div>
                                <div className={styles.macdSubDetailsRow}>
                                    <span>Line: {formatValue(momentum.macd.line)}</span>
                                    <span>Signal: {formatValue(momentum.macd.signal)}</span>
                                    <span>Hist: {formatValue(momentum.macd.histogram)}</span>
                                </div>
                            </div>
                        )}

                        {/* Stochastic %K and %D progress rows */}
                        {momentum.stochastic && (
                            <div className={styles.stochasticSubProgressList}>
                                <div className={styles.stochProgressRow}>
                                    <span className={styles.stochLabel}>Stoch %K</span>
                                    <div className={styles.stochTrackBg}>
                                        <div
                                            className={styles.stochFillBar}
                                            style={{
                                                width: `${momentum.stochastic.k || 0}%`,
                                                backgroundColor: getScoreColor(momentum.stochastic.direction)
                                            }}
                                        />
                                    </div>
                                    <span className={styles.stochValText}>{Math.round(momentum.stochastic.k || 0)}</span>
                                </div>

                                <div className={styles.stochProgressRow}>
                                    <span className={styles.stochLabel}>Stoch %D</span>
                                    <div className={styles.stochTrackBg}>
                                        <div
                                            className={styles.stochFillBar}
                                            style={{
                                                width: `${momentum.stochastic.d || 0}%`,
                                                backgroundColor: getScoreColor(momentum.stochastic.direction)
                                            }}
                                        />
                                    </div>
                                    <span className={styles.stochValText}>{Math.round(momentum.stochastic.d || 0)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 5. VOLUME ANALYSIS ACCORDION */}
            <div className={styles.premiumAccordion}>
                <div className={styles.premiumAccordionHeader} onClick={() => toggleMainAccordion('volume')}>
                    <span>VOLUME ANALYSIS</span>
                    <ChevronIcon isOpen={expandedAccordions.volume} />
                </div>
                {expandedAccordions.volume && (
                    <div className={styles.premiumAccordionBody}>
                        {/* Relative Volume Track */}
                        <div className={styles.relativeVolumeContainer}>
                            <div className={styles.volHeaderRow}>
                                <span>Relative Volume</span>
                                <strong>{volume_analysis.relative_volume || '0'}x</strong>
                            </div>
                            <div className={styles.relativeVolumeTrack}>
                                <div
                                    className={styles.relativeVolPointer}
                                    style={{ left: `${Math.min(100, (volume_analysis.relative_volume || 0) * 33.3)}%` }}
                                />
                                <span className={styles.volMarker} style={{ left: '0%' }}>0x</span>
                                <span className={styles.volMarker} style={{ left: '33.3%' }}>1x</span>
                                <span className={styles.volMarker} style={{ left: '66.6%' }}>2x</span>
                                <span className={styles.volMarker} style={{ left: '100%' }}>3x+</span>
                            </div>
                        </div>

                        {/* Current vs 20D Avg Cards Grid */}
                        <div className={styles.volumeCompareGrid}>
                            <div className={styles.volCompareCard}>
                                <span className={styles.volCompareLabel}>Current</span>
                                <strong className={styles.volCompareValue}>{formatVolVal(volume_analysis.current_volume)}</strong>
                            </div>
                            <div className={styles.volCompareCard}>
                                <span className={styles.volCompareLabel}>20D Avg</span>
                                <strong className={styles.volCompareValue}>{formatVolVal(volume_analysis.avg_volume_20d)}</strong>
                            </div>
                        </div>

                        {/* Buying/Selling Pressure segments */}
                        {volume_analysis.pressure && (
                            <div className={styles.volumePressureContainer}>
                                <div className={styles.pressureHeaderRow}>
                                    <span>Pressure</span>
                                    <strong style={{ color: getScoreColor(volume_analysis.pressure.label) }}>
                                        {volume_analysis.pressure.label}
                                    </strong>
                                </div>

                                {/* Segmented Bar Fill */}
                                <div className={styles.segmentedPressureBar}>
                                    <div
                                        className={styles.buySegment}
                                        style={{ width: `${volume_analysis.pressure.buy_pct || 50}%` }}
                                    >
                                        <span>{volume_analysis.pressure.buy_pct}%</span>
                                    </div>
                                    <div
                                        className={styles.sellSegment}
                                        style={{ width: `${volume_analysis.pressure.sell_pct || 50}%` }}
                                    >
                                        <span>{volume_analysis.pressure.sell_pct}%</span>
                                    </div>
                                </div>
                                <div className={styles.pressureLabelsRow}>
                                    <span className={styles.buyText}>Buy</span>
                                    <span className={styles.sellText}>Sell</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 6. AI SUMMARY ACCORDION */}
            <div className={styles.premiumAccordion}>
                <div className={styles.premiumAccordionHeader} onClick={() => toggleMainAccordion('ai')}>
                    <span>{t('aiStrategy.intelligenceSummary', 'AI INTELLIGENCE SUMMARY')}</span>
                    <ChevronIcon isOpen={expandedAccordions.ai} />
                </div>
                {expandedAccordions.ai && (
                    <div className={styles.premiumAccordionBody}>
                        <div className={styles.purpleAiSummaryCard}>
                            <div className={styles.purpleAiHeader}>
                                <BrainRobotIcon />
                                <h5>AI ANALYSIS</h5>
                            </div>
                            <h4 {...getBidiProps(ai_summary.headline, styles.purpleAiHeadline)}>
                                {ai_summary.headline}
                            </h4>

                            <div className={styles.purpleAiBulletsList}>
                                {ai_summary.trend && (
                                    <div className={styles.aiBulletSection}>
                                        <span className={styles.sectionLabel} style={{ color: '#0B56DB' }}>TREND</span>
                                        <p {...getBidiProps(ai_summary.trend)}>{ai_summary.trend}</p>
                                    </div>
                                )}
                                {ai_summary.momentum && (
                                    <div className={styles.aiBulletSection}>
                                        <span className={styles.sectionLabel} style={{ color: '#a855f7' }}>MOMENTUM</span>
                                        <p {...getBidiProps(ai_summary.momentum)}>{ai_summary.momentum}</p>
                                    </div>
                                )}
                                {ai_summary.volume && (
                                    <div className={styles.aiBulletSection}>
                                        <span className={styles.sectionLabel} style={{ color: '#fbbf24' }}>VOLUME</span>
                                        <p {...getBidiProps(ai_summary.volume)}>{ai_summary.volume}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
