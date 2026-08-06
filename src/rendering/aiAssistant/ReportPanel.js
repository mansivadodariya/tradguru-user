'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from './aiAssistant.module.scss';
import { ATR } from 'technicalindicators';
import { useTheme } from '@/context/ThemeContext';
import { getBidiProps, bidiMarkdownComponents } from '@/lib/bidi';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const WIDGET_REGEX = /(\[WIDGET:[A-Z_]+:[A-Z0-9/]+\])/;

const normalizeAssetSymbol = (symbol = '') => String(symbol).replace('/', '').toUpperCase();

const getAssetData = (visualData, symbol) => {
    const assets = visualData?.assets || {};
    const cleanSymbol = normalizeAssetSymbol(symbol);
    return assets[cleanSymbol] || assets[symbol] || assets[symbol?.replace('/', '')];
};

// ─── Support & Resistance ────────────────────────────────────────────────────
// TradingView-style Pivot High/Low (LEFT=8, RIGHT=8)
// • Tight touch threshold (ATR*0.2) — no overcounting
// • Touch count uses high + low + close (wick + body)
// • Age-weighted strength score — recent pivots rank higher
// • minMove filter removes noise pivots
// • Dynamic zone merge distance — works across forex / crypto / stocks
// • Full-width lines (first→last candle)
// • Star labels in legend & annotations

const LEFT = 8;
const RIGHT = 8;

const strengthStars = (score) => {
    if (typeof score === 'string') return score;
    if (score >= 8) return 'Strong';
    if (score >= 4) return 'Medium';
    return 'Weak';
};

const normalizeBackendLevels = (levels) => {
    if (!Array.isArray(levels)) return null;
    return levels.map(level => {
        if (typeof level === 'number') {
            return { price: level, strength: 5 };
        }
        if (level && typeof level === 'object') {
            const price = Number(level.price ?? level.value ?? level.level ?? 0);
            const strength = level.strength ?? level.touches ?? 5;
            return { price, strength };
        }
        return null;
    }).filter(Boolean);
};

const calculateSupportResistance = (candles) => {
    if (!candles?.length) return { support: [], resistance: [] };

    const highs = candles.map(c => Number(c.high));
    const lows = candles.map(c => Number(c.low));
    const closes = candles.map(c => Number(c.close));
    const total = candles.length;

    const atrValues = ATR.calculate({ period: 14, high: highs, low: lows, close: closes });
    const atrThreshold = atrValues.length ? atrValues[atrValues.length - 1] * 0.7 : 0.0008;

    // Tight threshold for realistic touch counts
    const touchThreshold = atrThreshold * 0.2;

    // Count touches: high, low, close all count (wick + body)
    const countTouches = (price) =>
        candles.filter(c =>
            Math.abs(Number(c.high) - price) <= touchThreshold ||
            Math.abs(Number(c.low) - price) <= touchThreshold ||
            Math.abs(Number(c.close) - price) <= touchThreshold
        ).length;

    // Recent pivots score higher
    const ageWeight = (index) => 1 + (index / total);

    // Reject pivots that barely moved from the previous one
    const minMove = atrThreshold * 1.5;

    const pivotHighs = [];
    let lastPH = null;
    for (let i = LEFT; i < highs.length - RIGHT; i++) {
        const val = highs[i];
        if (lastPH !== null && Math.abs(val - lastPH) < minMove) continue;
        let ok = true;
        for (let j = i - LEFT; j <= i + RIGHT; j++) {
            if (j !== i && highs[j] >= val) { ok = false; break; }
        }
        if (ok) { pivotHighs.push({ price: val, index: i }); lastPH = val; }
    }

    const pivotLows = [];
    let lastPL = null;
    for (let i = LEFT; i < lows.length - RIGHT; i++) {
        const val = lows[i];
        if (lastPL !== null && Math.abs(val - lastPL) < minMove) continue;
        let ok = true;
        for (let j = i - LEFT; j <= i + RIGHT; j++) {
            if (j !== i && lows[j] <= val) { ok = false; break; }
        }
        if (ok) { pivotLows.push({ price: val, index: i }); lastPL = val; }
    }

    // Dynamic merge distance — works across forex / crypto / stocks
    const mergeDistance = Math.max(
        atrThreshold * 0.5,
        (closes[closes.length - 1] || 1) * 0.0005
    );

    const mergeZones = (pivots) => {
        const sorted = [...pivots].sort((a, b) => a.price - b.price);
        const zones = [];

        sorted.forEach(({ price, index }) => {
            const last = zones[zones.length - 1];
            if (last && Math.abs(price - last.price) < mergeDistance) {
                const midPrice = Number(((last.price + price) / 2).toFixed(4));
                const lastScore = countTouches(last.price) * ageWeight(last.index);
                const curScore = countTouches(price) * ageWeight(index);
                zones[zones.length - 1] = {
                    price: midPrice,
                    index: curScore >= lastScore ? index : last.index,
                    touches: countTouches(midPrice),
                    strength: Math.round(lastScore + curScore)
                };
            } else {
                const touches = countTouches(price);
                const strength = Math.round(touches * ageWeight(index));
                zones.push({ price: Number(price.toFixed(4)), index, touches, strength });
            }
        });

        // Rank by strength (touch count × recency), return top 3
        return zones.sort((a, b) => b.strength - a.strength).slice(0, 3);
    };

    return {
        resistance: mergeZones(pivotHighs),
        support: mergeZones(pivotLows)
    };
};
// ─────────────────────────────────────────────────────────────────────────────

const PriceChart = ({ data, symbol = 'Asset', theme = 'light' }) => {
    const [showSR, setShowSR] = useState(true);
    const ohlc = data?.ohlc_data?.ohlc_1h || [];
    const isDark = theme === 'dark';

    // Extract raw support and resistance levels from multiple possible backend data fields
    const rawSupport = data?.horizontal_levels?.supports ?? data?.horizontal_levels?.support ?? data?.support ?? data?.support_levels ?? data?.indicators?.support ?? data?.indicators?.support_levels ?? data?.indicators?.['1H']?.support ?? data?.indicators?.['1H']?.support_levels;
    const rawResistance = data?.horizontal_levels?.resistances ?? data?.horizontal_levels?.resistance ?? data?.resistance ?? data?.resistance_levels ?? data?.indicators?.resistance ?? data?.indicators?.resistance_levels ?? data?.indicators?.['1H']?.resistance ?? data?.indicators?.['1H']?.resistance_levels;

    // Normalize levels if they exist; otherwise, fall back to frontend calculations
    const backendSupport = normalizeBackendLevels(rawSupport);
    const backendResistance = normalizeBackendLevels(rawResistance);

    const supportLevels = backendSupport !== null ? backendSupport : calculateSupportResistance(ohlc).support;
    const resistanceLevels = backendResistance !== null ? backendResistance : calculateSupportResistance(ohlc).resistance;

    const candleSeries = {
        name: 'Candles',
        type: 'candlestick',
        data: ohlc.map((d) => ({
            x: new Date(d.timestamp),
            y: [parseFloat(d.open), parseFloat(d.high), parseFloat(d.low), parseFloat(d.close)]
        }))
    };

    // Full-width lines — first candle to last candle
    const createLevelLine = ({ price, strength }, rank, type) => ({
        name: `${type === 'support' ? 'S' : 'R'}${rank + 1} ${strengthStars(strength)}`,
        type: 'line',
        data: [
            { x: new Date(ohlc[0].timestamp), y: price },
            { x: new Date(ohlc[ohlc.length - 1].timestamp), y: price }
        ]
    });

    const supportSeriesArr = supportLevels.map((z, i) => createLevelLine(z, i, 'support'));
    const resistanceSeriesArr = resistanceLevels.map((z, i) => createLevelLine(z, i, 'resistance'));

    const series = [candleSeries, ...(showSR ? [...supportSeriesArr, ...resistanceSeriesArr] : [])];

    const yAxisAnnotations = showSR ? [
        ...supportLevels.map(({ price, strength }) => ({
            y: price, borderColor: '#10b981', strokeDashArray: 4,
            label: { borderColor: '#10b981', style: { color: '#fff', background: '#10b981', fontSize: '11px' }, text: `S ${price.toFixed(4)} ${strengthStars(strength)}` }
        })),
        ...resistanceLevels.map(({ price, strength }) => ({
            y: price, borderColor: '#ef4444', strokeDashArray: 4,
            label: { borderColor: '#ef4444', style: { color: '#fff', background: '#ef4444', fontSize: '11px' }, text: `R ${price.toFixed(4)} ${strengthStars(strength)}` }
        }))
    ] : [];

    const seriesColors = showSR
        ? ['transparent', ...supportLevels.map(() => '#10b981'), ...resistanceLevels.map(() => '#ef4444')]
        : ['transparent'];
    const strokeWidths = showSR ? [1, ...supportLevels.map(() => 1.5), ...resistanceLevels.map(() => 1.5)] : [1];
    const dashArrays = showSR ? [0, ...supportLevels.map(() => 4), ...resistanceLevels.map(() => 4)] : [0];

    const options = {
        chart: {
            type: 'candlestick',
            background: 'transparent',
            toolbar: { show: true, tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true } },
            animations: { enabled: true, speed: 800 }
        },
        title: {
            text: `${symbol} Price Action`,
            align: 'left', margin: 10, offsetX: 10,
            style: { color: isDark ? '#60a5fa' : '#0f5cf2', fontSize: '16px', fontWeight: 700 }
        },
        legend: {
            show: true, position: 'top', horizontalAlign: 'right',
            onItemClick: { toggleDataSeries: true },
            onItemHover: { highlightDataSeries: true },
            labels: { colors: isDark ? '#f3f4f6' : '#1e293b' }
        },
        theme: { mode: theme },
        xaxis: {
            type: 'datetime',
            labels: { style: { colors: isDark ? '#94a3b8' : '#64748b' } },
            axisBorder: { show: false }, axisTicks: { show: false }
        },
        yaxis: {
            tooltip: { enabled: true },
            labels: { style: { colors: isDark ? '#94a3b8' : '#64748b' }, formatter: (val) => val?.toFixed(4) ?? val }
        },
        grid: { borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 92, 242, 0.08)', strokeDashArray: 4 },
        annotations: { yaxis: yAxisAnnotations },
        stroke: { width: strokeWidths, curve: 'straight', dashArray: dashArrays },
        colors: seriesColors,
        plotOptions: {
            candlestick: { colors: { upward: '#10b981', downward: '#ef4444' }, wick: { useFillColor: true } }
        },
        tooltip: { theme: theme, x: { format: 'dd MMM HH:mm' } }
    };

    if (!ohlc.length) return null;

    return (
        <div className={styles.reportWidget}>
            <div className={styles.chartToolbar}>
                <button
                    type="button"
                    className={`${styles.srToggleBtn} ${showSR ? styles.srToggleActive : ''}`}
                    onClick={() => setShowSR(v => !v)}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                    S/R Levels
                </button>
            </div>
            <Chart options={options} series={series} type="candlestick" height={380} />
        </div>
    );
};

const SentimentRadar = ({ indicators, theme = 'light' }) => {
    const data = indicators?.voting_scores || indicators?.['4H']?.voting_scores || {};
    const normalize = (val) => (val + 10) * 5;
    const isDark = theme === 'dark';

    const series = [{
        name: 'Market Sentiment',
        data: [
            normalize(data.trend_score || 0),
            normalize(data.momentum_score || 0),
            normalize(data.volatility_score || 0),
            normalize(data.overall_score || 0)
        ]
    }];

    const options = {
        chart: { type: 'radar', toolbar: { show: false }, animations: { enabled: true, speed: 1000 } },
        theme: { mode: theme },
        labels: ['Trend', 'Momentum', 'Volatility', 'Overall'],
        yaxis: { show: false, min: 0, max: 100 },
        fill: {
            opacity: 0.45, type: 'gradient',
            gradient: { shade: isDark ? 'dark' : 'light', gradientToColors: ['#0f5cf2'], shadeIntensity: 1, type: 'horizontal', stops: [0, 100] }
        },
        stroke: { width: 2, colors: ['#0f5cf2'] },
        markers: { size: 4, colors: ['#0f5cf2'], strokeWidth: 2, strokeColors: isDark ? '#1a1a1e' : '#fff' },
        plotOptions: { radar: { polygons: { strokeColors: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 92, 242, 0.15)', connectorColors: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 92, 242, 0.1)' } } },
        tooltip: { theme: theme }
    };

    return (
        <div className={styles.reportRadar}>
            <Chart options={options} series={series} type="radar" height={280} />
        </div>
    );
};

const Gauge = ({ value, title, theme = 'light' }) => {
    const isDark = theme === 'dark';
    const options = {
        chart: { type: 'radialBar', sparkline: { enabled: true } },
        plotOptions: {
            radialBar: {
                startAngle: -110, endAngle: 110,
                hollow: { size: '65%', background: isDark ? '#1a1a1e' : '#f8fafc' },
                track: { background: isDark ? '#2d2d34' : '#e2e8f0', strokeWidth: '100%', margin: 5 },
                dataLabels: {
                    name: { show: true, color: isDark ? '#60a5fa' : '#0f5cf2', offsetY: -10, fontSize: '12px', fontWeight: 600 },
                    value: { show: true, fontSize: '22px', fontWeight: 700, color: isDark ? '#ffffff' : '#121212', offsetY: 0, formatter: (val) => val.toFixed(1) }
                }
            }
        },
        fill: { type: 'gradient', gradient: { shade: isDark ? 'dark' : 'light', type: 'horizontal', gradientToColors: ['#0f5cf2'], stops: [0, 100] } },
        stroke: { lineCap: 'round' },
        labels: [title]
    };

    return (
        <div className={styles.reportGauge}>
            <Chart options={options} series={[value]} type="radialBar" height={220} />
        </div>
    );
};

const ReportPanel = ({ fullReport, visualData, isLoading, scrollToTopSignal, onDownload, inline = true }) => {
    const scrollRef = useRef(null);
    const reportRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [scrollToTopSignal, fullReport]);

    const renderWidget = (type, symbol, key) => {
        const assetData = getAssetData(visualData, symbol);
        if (!assetData) {
            return <div key={key} className={styles.reportWidgetMissing}>Visualization data for {symbol} is currently unavailable.</div>;
        }
        switch (type) {
            case 'CANDLESTICK':
                return <PriceChart key={key} data={assetData} symbol={symbol} theme={theme} />;
            case 'SENTIMENT_RADAR':
                return (
                    <div key={key} className={styles.reportWidget}>
                        <h4 className={styles.reportWidgetTitle}>Market Sentiment: {symbol}</h4>
                        <SentimentRadar indicators={assetData.indicators} theme={theme} />
                    </div>
                );
            case 'RSI_GAUGE':
                return <Gauge key={key} value={assetData.indicators?.momentum_indicators?.RSI?.value || assetData.indicators?.['1H']?.momentum_indicators?.RSI?.value || 50} title={`${symbol} RSI`} theme={theme} />;
            case 'ADX_GAUGE':
                return <Gauge key={key} value={assetData.indicators?.trend_indicators?.ADX?.value || assetData.indicators?.['1H']?.trend_indicators?.ADX?.value || 25} title={`${symbol} Trend Strength`} theme={theme} />;
            default:
                return null;
        }
    };

    const renderContent = () => {
        if (!fullReport) return null;
        return fullReport.split(WIDGET_REGEX).map((part, pIdx) => {
            const widgetMatch = part.match(/\[WIDGET:([A-Z_]+):([A-Z0-9/]+)\]/);
            if (widgetMatch) return renderWidget(widgetMatch[1], widgetMatch[2], pIdx);
            if (!part.trim()) return null;
            return (
                <div key={pIdx} {...getBidiProps(part, styles.reportMarkdown)}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>{part}</ReactMarkdown>
                </div>
            );
        });
    };

    if (inline) {
        return (
            <div className={styles.inlineReportContainer}>
                <h3>{fullReport ? 'Analysis Center' : 'No Report Selected'}</h3>
                {isLoading ? (
                    <div className={styles.reportLoading}>Analyzing market data...</div>
                ) : fullReport ? (
                    <div className={styles.reportContent} ref={reportRef}>{renderContent()}</div>
                ) : (
                    <div className={styles.reportEmpty}>
                        <p className={styles.reportEmptyTitle}>Ready for Analysis</p>
                        <p>Select a report from your chat or start a new conversation to generate a market thesis.</p>
                    </div>
                )}
                {onDownload && (
                    <div className={styles.inlineDownloadRow}>
                        <button type="button" className={styles.inlineDownloadBtn} onClick={() => onDownload && onDownload(reportRef.current)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download Report
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.reportPanel}>
            <div className={styles.reportPanelHeader}>
                <h3>{fullReport ? 'Analysis Center' : 'No Report Selected'}</h3>
                {fullReport && onDownload && <button type="button" className={styles.reportDownloadBtn} onClick={() => onDownload && onDownload(reportRef.current)}>Download Document</button>}
            </div>
            <div className={styles.reportPanelBody} ref={scrollRef}>
                {isLoading ? (
                    <div className={styles.reportLoading}>Analyzing market data...</div>
                ) : fullReport ? (
                    <div className={styles.reportContent} ref={reportRef}>{renderContent()}</div>
                ) : (
                    <div className={styles.reportEmpty}>
                        <p className={styles.reportEmptyTitle}>Ready for Analysis</p>
                        <p>Select a report from your chat or start a new conversation to generate a market thesis.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportPanel;
