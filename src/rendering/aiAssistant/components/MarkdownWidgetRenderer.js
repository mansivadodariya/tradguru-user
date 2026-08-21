'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from '../aiAssistant.module.scss';
import { useTheme } from '@/context/ThemeContext';
import { getBidiProps, bidiMarkdownComponents } from '@/lib/bidi';
import { ATR } from 'technicalindicators';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const WIDGET_REGEX = /(\[WIDGET:[A-Z_]+(?::[A-Z0-9/_-]+)?\])/gi;

const normalizeAssetSymbol = (symbol = '') => String(symbol).replace('/', '').toUpperCase();

const getAssetData = (visualData, symbol) => {
    const assets = visualData?.assets || {};
    const cleanSymbol = normalizeAssetSymbol(symbol);
    return assets[cleanSymbol] || assets[symbol] || assets[symbol?.replace('/', '')];
};

// ─── Support & Resistance calculation ──────────────────────────────────────────
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
        if (typeof level === 'number') return { price: level, strength: 5 };
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
    const touchThreshold = atrThreshold * 0.2;

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

    return {
        support: pivotLows.slice(-3).map(p => ({ price: p.price, strength: 6 })),
        resistance: pivotHighs.slice(-3).map(p => ({ price: p.price, strength: 6 }))
    };
};

const generateMockCandles = (symbol = 'XAUUSD', count = 40) => {
    const base = symbol.includes('BTC') ? 92000 : symbol.includes('XAU') ? 2720 : 1.085;
    const now = Math.floor(Date.now() / 1000);
    const candles = [];
    let cur = base;
    for (let i = count; i >= 0; i--) {
        const t = now - (i * 3600);
        const change = (Math.random() - 0.49) * (base * 0.004);
        const open = cur;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (base * 0.002);
        const low = Math.min(open, close) - Math.random() * (base * 0.002);
        cur = close;
        candles.push({ timestamp: new Date(t * 1000).toISOString(), open, high, low, close });
    }
    return candles;
};

// ─── 1. Candlestick Price Chart Widget ─────────────────────────────────────────
export const InlineCandlestickWidget = ({ symbol = 'XAUUSD', visualData, isDark = true }) => {
    const [showSR, setShowSR] = useState(true);
    const assetData = getAssetData(visualData, symbol);
    const rawOhlc = assetData?.ohlc_data?.ohlc_1h || assetData?.candles || generateMockCandles(symbol, 40);

    const rawSupport = assetData?.horizontal_levels?.supports ?? assetData?.horizontal_levels?.support ?? assetData?.support;
    const rawResistance = assetData?.horizontal_levels?.resistances ?? assetData?.horizontal_levels?.resistance ?? assetData?.resistance;

    const backendSupport = normalizeBackendLevels(rawSupport);
    const backendResistance = normalizeBackendLevels(rawResistance);

    const supportLevels = backendSupport !== null ? backendSupport : calculateSupportResistance(rawOhlc).support;
    const resistanceLevels = backendResistance !== null ? backendResistance : calculateSupportResistance(rawOhlc).resistance;

    const candleSeries = {
        name: 'Candles',
        type: 'candlestick',
        data: rawOhlc.map((d) => ({
            x: new Date(d.timestamp || d.time * 1000 || Date.now()),
            y: [parseFloat(d.open), parseFloat(d.high), parseFloat(d.low), parseFloat(d.close)]
        }))
    };

    const createLevelLine = ({ price, strength }, rank, type) => ({
        name: `${type === 'support' ? 'S' : 'R'}${rank + 1} ${strengthStars(strength)}`,
        type: 'line',
        data: [
            { x: new Date(rawOhlc[0]?.timestamp || Date.now() - 40 * 3600000), y: price },
            { x: new Date(rawOhlc[rawOhlc.length - 1]?.timestamp || Date.now()), y: price }
        ]
    });

    const supportSeriesArr = supportLevels.map((z, i) => createLevelLine(z, i, 'support'));
    const resistanceSeriesArr = resistanceLevels.map((z, i) => createLevelLine(z, i, 'resistance'));

    const series = [candleSeries, ...(showSR ? [...supportSeriesArr, ...resistanceSeriesArr] : [])];

    const yAxisAnnotations = showSR ? [
        ...supportLevels.map(({ price, strength }) => ({
            y: price,
            borderColor: '#10b981',
            strokeDashArray: 4,
            label: {
                borderColor: '#10b981',
                style: { color: '#fff', background: '#10b981', fontSize: '10px' },
                text: `S ${price.toFixed(price > 100 ? 2 : 4)}`
            }
        })),
        ...resistanceLevels.map(({ price, strength }) => ({
            y: price,
            borderColor: '#ef4444',
            strokeDashArray: 4,
            label: {
                borderColor: '#ef4444',
                style: { color: '#fff', background: '#ef4444', fontSize: '10px' },
                text: `R ${price.toFixed(price > 100 ? 2 : 4)}`
            }
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
            animations: { enabled: true, speed: 600 }
        },
        title: {
            text: `${symbol} Price Action & Key Levels`,
            align: 'left',
            margin: 10,
            style: { color: isDark ? '#93c5fd' : '#2563eb', fontSize: '13px', fontWeight: 700 }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            labels: { colors: isDark ? '#e2e8f0' : '#1e293b' }
        },
        theme: { mode: isDark ? 'dark' : 'light' },
        xaxis: {
            type: 'datetime',
            labels: { style: { colors: isDark ? '#94a3b8' : '#64748b' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            tooltip: { enabled: true },
            labels: {
                style: { colors: isDark ? '#94a3b8' : '#64748b' },
                formatter: (val) => val?.toFixed(val > 100 ? 2 : 4) ?? val
            }
        },
        grid: { borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 92, 242, 0.08)', strokeDashArray: 4 },
        annotations: { yaxis: yAxisAnnotations },
        stroke: { width: strokeWidths, curve: 'straight', dashArray: dashArrays },
        colors: seriesColors,
        plotOptions: {
            candlestick: { colors: { upward: '#10b981', downward: '#ef4444' }, wick: { useFillColor: true } }
        },
        tooltip: { theme: isDark ? 'dark' : 'light', x: { format: 'dd MMM HH:mm' } }
    };

    return (
        <div className={styles.inlineWidgetCard}>
            <div className={styles.inlineWidgetHeader}>
                <span className={styles.inlineWidgetTitle}>{symbol} Price Action & Key Levels</span>
                <button
                    type="button"
                    className={`${styles.srToggleBtn} ${showSR ? styles.srToggleActive : ''}`}
                    onClick={() => setShowSR(v => !v)}
                >
                    S/R Levels
                </button>
            </div>
            <Chart options={options} series={series} type="candlestick" height={320} />
        </div>
    );
};

// ─── 2. Sentiment Radar Widget ────────────────────────────────────────────────
export const InlineSentimentRadarWidget = ({ symbol = 'XAUUSD', visualData, isDark = true }) => {
    const assetData = getAssetData(visualData, symbol);
    const scores = assetData?.sentiment_scores || assetData?.indicators?.voting_scores || assetData?.indicators?.['4H']?.voting_scores || {};

    const normalizeScore = (val, fallback = 70) => {
        if (typeof val === 'number') {
            if (val >= -10 && val <= 10) return (val + 10) * 5;
            return Math.min(100, Math.max(0, val));
        }
        return fallback;
    };

    const series = [{
        name: 'Market Sentiment',
        data: [
            normalizeScore(scores.trend ?? scores.trend_score, 80),
            normalizeScore(scores.momentum ?? scores.momentum_score, 75),
            normalizeScore(scores.volatility ?? scores.volatility_score, 50),
            normalizeScore(scores.overall ?? scores.overall_score, 72)
        ]
    }];

    const options = {
        chart: {
            type: 'radar',
            background: 'transparent',
            toolbar: { show: false },
            animations: { enabled: true, speed: 600 }
        },
        theme: { mode: isDark ? 'dark' : 'light' },
        labels: ['Trend', 'Momentum', 'Volatility', 'Overall'],
        yaxis: { show: false, min: 0, max: 100 },
        fill: {
            opacity: 0.35,
            type: 'gradient',
            gradient: {
                shade: isDark ? 'dark' : 'light',
                gradientToColors: ['#3b82f6'],
                shadeIntensity: 1,
                stops: [0, 100]
            }
        },
        stroke: { width: 2, colors: ['#2563eb'] },
        markers: {
            size: 5,
            colors: ['#60a5fa'],
            strokeWidth: 2,
            strokeColors: isDark ? '#000000' : '#ffffff'
        },
        plotOptions: {
            radar: {
                polygons: {
                    strokeColors: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 92, 242, 0.15)',
                    connectorColors: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 92, 242, 0.1)'
                }
            }
        },
        tooltip: { theme: isDark ? 'dark' : 'light' }
    };

    return (
        <div className={styles.inlineWidgetCard}>
            <div className={styles.inlineWidgetHeader}>
                <span className={styles.inlineWidgetTitle}>Market Sentiment: {symbol}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Chart options={options} series={series} type="radar" height={260} width="100%" />
            </div>
        </div>
    );
};

// ─── 3. Main Widget-Aware Markdown Renderer ───────────────────────────────────
export default function RenderMarkdownWithWidgets({ content = '', visualData = null, defaultSymbol = 'XAUUSD' }) {
    const { theme } = useTheme();
    const isDark = theme !== 'light';

    if (!content) return null;

    const parts = content.split(WIDGET_REGEX);

    return (
        <div className={styles.chatMarkdown}>
            {parts.map((part, index) => {
                const widgetMatch = part.match(/\[WIDGET:([A-Z_]+)(?::([A-Z0-9/_-]+))?\]/i);
                if (widgetMatch) {
                    const widgetType = widgetMatch[1].toUpperCase();
                    const symbol = widgetMatch[2] ? normalizeAssetSymbol(widgetMatch[2]) : normalizeAssetSymbol(defaultSymbol);

                    if (widgetType === 'SENTIMENT_RADAR') {
                        return <InlineSentimentRadarWidget key={`widget-${index}`} symbol={symbol} visualData={visualData} isDark={isDark} />;
                    }
                    if (widgetType === 'CANDLESTICK') {
                        return <InlineCandlestickWidget key={`widget-${index}`} symbol={symbol} visualData={visualData} isDark={isDark} />;
                    }
                }

                if (!part.trim()) return null;

                return (
                    <ReactMarkdown
                        key={`md-${index}`}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={bidiMarkdownComponents}
                    >
                        {part}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
}
