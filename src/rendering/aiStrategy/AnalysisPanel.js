'use client';

import React, { useState, useEffect } from 'react';
import styles from './aiStrategy.module.scss';
import { RobotIcon } from './icons';

function getScoreColor(label = '') {
    const l = label.toLowerCase();
    if (l.includes('bullish') || l.includes('buying')) return '#10b981';
    if (l.includes('bearish') || l.includes('selling')) return '#ef4444';
    return '#fbbf24'; // Neutral / Ranging
}

function formatValue(val) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
}

export default function AnalysisPanel({ symbol, strategyId, activeAnalysis, onAnalysisLoaded }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Accordion states
    const [accordions, setAccordions] = useState({
        evidence: true,
        trendIndicators: false,
        momentumIndicators: false,
        volatilityIndicators: false,
        pivotPoints: false
    });

    const toggleAccordion = (sec) => {
        setAccordions(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    // Fetch analysis data
    const fetchAnalysisData = async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);

        const cleanSymbol = symbol.replace('/', '').toUpperCase();
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chart/analysis?symbol=${cleanSymbol}`;

        try {
            const res = await fetch(url, {
                headers: { 
                    'accept': 'application/json',
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
        pivot_points = {}
    } = analysis;

    const scoreColor = getScoreColor(technical_score.label);

    return (
        <div className={styles.analysisPanel}>
            {/* Overview Section */}
            <div className={styles.analysisOverview}>
                <div className={styles.overviewHeader}>
                    <h4>Technical Analysis</h4>
                    <span className={styles.overviewTimeframe}>1H Timeframe</span>
                </div>
                <div className={styles.overviewPriceRow}>
                    <span className={styles.overviewLabel}>Current Price:</span>
                    <strong className={styles.overviewValue}>{formatValue(analysis.current_price)}</strong>
                </div>
            </div>

            {/* Technical Score Circular Progress */}
            <div className={styles.scoreCard}>
                <div className={styles.scoreRow}>
                    <div className={styles.scoreDial}>
                        <svg width="76" height="76">
                            <circle cx="38" cy="38" r="32" stroke="#eef2f6" strokeWidth="5" fill="transparent" />
                            <circle 
                                cx="38" cy="38" r="32" 
                                stroke={scoreColor} 
                                strokeWidth="5" 
                                fill="transparent"
                                strokeDasharray={201}
                                strokeDashoffset={201 - (technical_score.total / 100) * 201}
                                strokeLinecap="round"
                                transform="rotate(-90 38 38)"
                            />
                            <text x="38" y="38" textAnchor="middle" dy="4" className={styles.dialScoreText}>
                                {technical_score.total}
                            </text>
                        </svg>
                        <span className={styles.dialMaxText}>/100</span>
                    </div>

                    <div className={styles.scoreMeta}>
                        <span className={styles.scoreLabel} style={{ color: scoreColor }}>
                            {technical_score.label || 'Neutral'}
                        </span>
                        <div className={styles.scoreDetails}>
                            <span>Confidence: <strong>{technical_score.confidence || '-'}</strong></span>
                            <span className={styles.formulaText}>Formula: {technical_score.formula || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Score Breakdown List */}
                <div className={styles.scoreBreakdown}>
                    {technical_score.breakdown && Object.entries(technical_score.breakdown).map(([key, item]) => {
                        const pct = Math.round((item.score / item.max) * 100);
                        const itemColor = getScoreColor(item.label);
                        return (
                            <div key={key} className={styles.breakdownItem}>
                                <div className={styles.breakdownInfo}>
                                    <span className={styles.breakdownName}>{key.toUpperCase()}</span>
                                    <span className={styles.breakdownValues} style={{ color: itemColor }}>
                                        {item.score}/{item.max} ({item.label})
                                    </span>
                                </div>
                                <div className={styles.breakdownBarBg}>
                                    <div 
                                        className={styles.breakdownBarFill} 
                                        style={{ width: `${pct}%`, backgroundColor: itemColor }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* AI Summary Card */}
            <div className={styles.aiSummaryCard}>
                <div className={styles.aiSummaryHeader}>
                    <RobotIcon className={styles.aiRobotIcon} />
                    <h5>AI Summary</h5>
                </div>
                <div className={styles.aiHeadline}>
                    {ai_summary.headline}
                </div>
                <div className={styles.aiDetails}>
                    {ai_summary.trend && <p><strong>Trend:</strong> {ai_summary.trend}</p>}
                    {ai_summary.momentum && <p><strong>Momentum:</strong> {ai_summary.momentum}</p>}
                    {ai_summary.volume && <p><strong>Volume:</strong> {ai_summary.volume}</p>}
                </div>
            </div>

            {/* Key Support / Resistance Levels */}
            <div className={styles.levelsGrid}>
                <div className={`${styles.levelCard} ${styles.resistance}`}>
                    <span className={styles.levelCardLabel}>Resistance</span>
                    <strong className={styles.levelCardValue}>{formatValue(levels.nearest_resistance)}</strong>
                </div>
                <div className={`${styles.levelCard} ${styles.pivot}`}>
                    <span className={styles.levelCardLabel}>Pivot</span>
                    <strong className={styles.levelCardValue}>{formatValue(levels.pivot)}</strong>
                </div>
                <div className={`${styles.levelCard} ${styles.support}`}>
                    <span className={styles.levelCardLabel}>Support</span>
                    <strong className={styles.levelCardValue}>{formatValue(levels.nearest_support)}</strong>
                </div>
            </div>

            {/* Accordion sections */}
            
            {/* 1. Evidence Details */}
            <div className={styles.accordionSection}>
                <div onClick={() => toggleAccordion('evidence')} className={styles.accordionHeader}>
                    <span>Market Evidence</span>
                    <span className={`${styles.arrow} ${accordions.evidence ? styles.open : ''}`}>▼</span>
                </div>
                {accordions.evidence && (
                    <div className={styles.accordionBody}>
                        {Object.entries(evidence).map(([key, data]) => {
                            if (!data.details || data.details.length === 0) return null;
                            const itemColor = getScoreColor(data.label);
                            return (
                                <div key={key} className={styles.evidenceGroup}>
                                    <div className={styles.evidenceGroupHeader}>
                                        <span className={styles.evidenceGroupName}>{key.toUpperCase()}</span>
                                        <span className={styles.evidenceGroupLabel} style={{ color: itemColor }}>
                                            {data.label}
                                        </span>
                                    </div>
                                    <ul className={styles.evidenceList}>
                                        {data.details.map((detail, idx) => (
                                            <li key={idx}>{detail}</li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 2. Trend Indicators Table */}
            <div className={styles.accordionSection}>
                <div onClick={() => toggleAccordion('trendIndicators')} className={styles.accordionHeader}>
                    <span>Trend Indicators</span>
                    <span className={`${styles.arrow} ${accordions.trendIndicators ? styles.open : ''}`}>▼</span>
                </div>
                {accordions.trendIndicators && (
                    <div className={styles.accordionBody}>
                        <table className={styles.indicatorsTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Value</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(trend_indicators).map(([key, ind]) => (
                                    <tr key={key}>
                                        <td>{key}</td>
                                        <td className={styles.tabNumeric}>{formatValue(ind.value)}</td>
                                        <td style={{ color: getScoreColor(ind.action), fontWeight: 700 }}>
                                            {ind.action}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 3. Momentum Indicators Table */}
            <div className={styles.accordionSection}>
                <div onClick={() => toggleAccordion('momentumIndicators')} className={styles.accordionHeader}>
                    <span>Momentum Indicators</span>
                    <span className={`${styles.arrow} ${accordions.momentumIndicators ? styles.open : ''}`}>▼</span>
                </div>
                {accordions.momentumIndicators && (
                    <div className={styles.accordionBody}>
                        <table className={styles.indicatorsTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Value</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(momentum_indicators).map(([key, ind]) => (
                                    <tr key={key}>
                                        <td>{key}</td>
                                        <td className={styles.tabNumeric}>{formatValue(ind.value)}</td>
                                        <td style={{ color: getScoreColor(ind.action), fontWeight: 700 }}>
                                            {ind.action}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 4. Volatility Indicators Table */}
            <div className={styles.accordionSection}>
                <div onClick={() => toggleAccordion('volatilityIndicators')} className={styles.accordionHeader}>
                    <span>Volatility Indicators</span>
                    <span className={`${styles.arrow} ${accordions.volatilityIndicators ? styles.open : ''}`}>▼</span>
                </div>
                {accordions.volatilityIndicators && (
                    <div className={styles.accordionBody}>
                        <table className={styles.indicatorsTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Value</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(volatility_indicators).map(([key, ind]) => (
                                    <tr key={key}>
                                        <td>{key}</td>
                                        <td className={styles.tabNumeric}>{formatValue(ind.value)}</td>
                                        <td style={{ color: getScoreColor(ind.action), fontWeight: 700 }}>
                                            {ind.action}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 5. Pivot Points Table */}
            <div className={styles.accordionSection}>
                <div onClick={() => toggleAccordion('pivotPoints')} className={styles.accordionHeader}>
                    <span>Pivot Points</span>
                    <span className={`${styles.arrow} ${accordions.pivotPoints ? styles.open : ''}`}>▼</span>
                </div>
                {accordions.pivotPoints && (
                    <div className={styles.accordionBody}>
                        <table className={styles.pivotTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>S2</th>
                                    <th>S1</th>
                                    <th>Pivot (P)</th>
                                    <th>R1</th>
                                    <th>R2</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(pivot_points).map(([key, pivots]) => (
                                    <tr key={key}>
                                        <td className={styles.pivotType}>{key}</td>
                                        <td className={styles.tabNumeric}>{formatValue(pivots.S2)}</td>
                                        <td className={styles.tabNumeric}>{formatValue(pivots.S1)}</td>
                                        <td className={`${styles.tabNumeric} ${styles.pivotCenter}`}>{formatValue(pivots.P)}</td>
                                        <td className={styles.tabNumeric}>{formatValue(pivots.R1)}</td>
                                        <td className={styles.tabNumeric}>{formatValue(pivots.R2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
