'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import styles from './aiAssistant.module.scss';
import { toast } from '@/components/toast';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import SymbolIcon from '@/components/SymbolIcon';
import TickerSearchDropdown from '@/components/TickerSearchDropdown';
import { getSymbolPrecision, applySymbolPrecision, fetchChartCandlesOnce, subscribeLiveCandles } from '@/lib/chartStore';
import ChartLoaderOverlay from './components/ChartLoaderOverlay';
import ChartSettingsModal from './components/ChartSettingsModal';
import IndicatorSettingsModal from './IndicatorSettingsModal';
import IndicatorsModal from './components/IndicatorsModal';

export { getSymbolPrecision, applySymbolPrecision };
export const fetchChartDataOnce = fetchChartCandlesOnce;

export const DEFAULT_INDICATOR_CONFIGS = {
    ema10: { length: 10, source: 'close', color: '#00E5FF', lineWidth: 1.5 },
    ema20: { length: 20, source: 'close', color: '#FFD600', lineWidth: 1.5 },
    ema50: { length: 50, source: 'close', color: '#AA00FF', lineWidth: 1.5 },
    bollinger: { length: 20, stdDev: 2, source: 'close', color: 'rgba(41, 121, 255, 0.7)', lineWidth: 1 },
    pivot: { type: 'Standard', pColor: '#FFD600', rColor: '#EF5350', sColor: '#26A69A', lineWidth: 1 },
    rsi: { length: 14, overbought: 70, oversold: 30, color: '#AA00FF', lineWidth: 1.8 },
    macd: { fast: 12, slow: 26, signal: 9, macdColor: '#00E5FF', signalColor: '#FFD600', lineWidth: 1.8 },
    stochastic: { kPeriod: 14, dPeriod: 3, smooth: 3, kColor: '#00E5FF', dColor: '#FFD600', lineWidth: 1.8 },
};

const EyeIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const GearIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

// Symbol Database with Names & Categories (TradingView Ticker Search Style)
export const SYMBOL_DATABASE = [
    { symbol: 'No Pair', name: 'No Specific Currency Pair', category: 'all' },
    // Forex
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex' },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'forex' },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'forex' },
    { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', category: 'forex' },
    { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'forex' },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'forex' },
    { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', category: 'forex' },
    { symbol: 'EUR/GBP', name: 'Euro / British Pound', category: 'forex' },
    { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', category: 'forex' },
    { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', category: 'forex' },
    { symbol: 'EUR/AUD', name: 'Euro / Australian Dollar', category: 'forex' },
    { symbol: 'EUR/CAD', name: 'Euro / Canadian Dollar', category: 'forex' },
    { symbol: 'GBP/AUD', name: 'British Pound / Australian Dollar', category: 'forex' },
    { symbol: 'AUD/JPY', name: 'Australian Dollar / Japanese Yen', category: 'forex' },
    { symbol: 'CAD/JPY', name: 'Canadian Dollar / Japanese Yen', category: 'forex' },
    // Crypto
    { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'crypto' },
    { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', category: 'crypto' },
    { symbol: 'SOL/USD', name: 'Solana / US Dollar', category: 'crypto' },
    { symbol: 'XRP/USD', name: 'Ripple / US Dollar', category: 'crypto' },
    // Commodities
    { symbol: 'XAU/USD', name: 'Gold / US Dollar', category: 'commodities' },
    { symbol: 'XAG/USD', name: 'Silver / US Dollar', category: 'commodities' },
    { symbol: 'WTI/USD', name: 'Crude Oil WTI', category: 'commodities' },
];

// Categorized Symbol Groups (LuxAlgo / TradingView style)
export const PAIR_GROUPS = [
    {
        label: 'MAJOR PAIRS',
        pairs: ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'XAU/USD'],
    },
    {
        label: 'EURO CROSSES',
        pairs: ['EUR/GBP', 'EUR/CHF', 'EUR/JPY', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD'],
    },
    {
        label: 'POUND CROSSES',
        pairs: ['GBP/JPY', 'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/NZD'],
    },
    {
        label: 'YEN CROSSES',
        pairs: ['CHF/JPY', 'CAD/JPY', 'AUD/JPY', 'NZD/JPY'],
    },
    {
        label: 'COMMODITIES & CRYPTO',
        pairs: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'XAU/USD', 'XAG/USD', 'WTI/USD'],
    },
];

export const ALL_PAIRS = ['No Pair', ...PAIR_GROUPS.flatMap((g) => g.pairs)];

export const TIMEFRAMES = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
];

export const CHART_TYPES = [
    { label: 'Candlestick', value: 'candlestick' },
    { label: 'Line', value: 'line' },
    { label: 'Area', value: 'area' },
];

// Helper to normalize symbol string (e.g. "XAU/USD" -> "XAUUSD")
export function normalizeSymbol(sym, defaultFallback = '') {
    if (!sym || sym === 'No Pair' || sym === 'NO_PAIR' || String(sym).toUpperCase().includes('NO PAIR')) return defaultFallback;
    return sym.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Render SVG icon for chart types (Candlestick, Line, Area) matching TradingView
export function renderChartTypeIcon(type) {
    if (type === 'line') {
        return (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <path d="M7 14l4-4 4 3 5-6" />
            </svg>
        );
    } else if (type === 'area') {
        return (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <path d="M7 14l4-3 4 2 5-5v6H7z" fill="currentColor" fillOpacity="0.25" />
                <path d="M7 14l4-3 4 2 5-5" />
            </svg>
        );
    } else {
        // Candlestick (Default)
        return (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <line x1="9" y1="7" x2="9" y2="15" />
                <rect x="7.5" y="9" width="3" height="4" rx="0.5" fill="currentColor" fillOpacity="0.25" />
                <line x1="15" y1="5" x2="15" y2="13" />
                <rect x="13.5" y="7" width="3" height="4" rx="0.5" fill="currentColor" fillOpacity="0.25" />
            </svg>
        );
    }
}

// Get icon symbol representation for trading pairs
export function getSymbolIcon(pairStr) {
    const s = (pairStr || '').toUpperCase();
    if (s.includes('XAU') || s.includes('GOLD')) return '🥇';
    if (s.includes('BTC')) return '₿';
    if (s.includes('ETH')) return 'Ξ';
    if (s.includes('EUR')) return '💶';
    if (s.includes('GBP')) return '💷';
    if (s.includes('JPY')) return '💴';
    if (s.includes('AUD')) return '🇦🇺';
    if (s.includes('CAD')) return '🇨🇦';
    if (s.includes('NZD')) return '🇳🇿';
    if (s.includes('CHF')) return '🇨🇭';
    return '💵';
}

// Format price based on pair precision
function formatPrice(val, symbolStr) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    const s = (symbolStr || '').toUpperCase();
    if (s.includes('JPY')) return val.toFixed(3);
    if (s.includes('XAU') || s.includes('GOLD') || s.includes('BTC') || s.includes('ETH')) return val.toFixed(2);
    return val.toFixed(5);
}

function getTimeframeInterval(tf) {
    switch (tf) {
        case '1m': return 60;
        case '5m': return 300;
        case '15m': return 900;
        case '30m': return 1800;
        case '1h': return 3600;
        case '4h': return 14400;
        case '1d': return 86400;
        default: return 900;
    }
}

// Generate fallback candles if backend REST API endpoint is offline or returning empty
function generateMockCandles(count = 600, basePrice = 2700, tf = '15m', symbolStr = 'XAUUSD') {
    const candles = [];
    let currentPrice = basePrice;
    const now = Math.floor(Date.now() / 1000);
    const interval = getTimeframeInterval(tf);
    const { precision } = getSymbolPrecision(symbolStr);

    for (let i = count; i >= 0; i--) {
        const time = now - i * interval;
        const change = (Math.random() - 0.49) * (basePrice * 0.003);
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (basePrice * 0.0015);
        const low = Math.min(open, close) - Math.random() * (basePrice * 0.0015);
        currentPrice = close;

        candles.push({
            time,
            open: Number(open.toFixed(precision)),
            high: Number(high.toFixed(precision)),
            low: Number(low.toFixed(precision)),
            close: Number(close.toFixed(precision)),
        });
    }
    return candles;
}

// 1-Year Analysis Standard Moving Average Presets
export const DEFAULT_MAIN_OVERLAYS = [
    // EMA Presets
    { id: 'ema_20',  name: 'EMA 20',  type: 'EMA', length: 20,  period: 20,  color: '#FFD600', source: 'close', lineWidth: 1.5, visible: true },
    { id: 'ema_50',  name: 'EMA 50',  type: 'EMA', length: 50,  period: 50,  color: '#AA00FF', source: 'close', lineWidth: 1.5, visible: false },
    { id: 'ema_200', name: 'EMA 200', type: 'EMA', length: 200, period: 200, color: '#FF1744', source: 'close', lineWidth: 1.5, visible: true },
    // SMA Presets
    { id: 'sma_20',  name: 'SMA 20',  type: 'SMA', length: 20,  period: 20,  color: '#00E5FF', source: 'close', lineWidth: 1.5, visible: false },
    { id: 'sma_50',  name: 'SMA 50',  type: 'SMA', length: 50,  period: 50,  color: '#FF9100', source: 'close', lineWidth: 1.5, visible: false },
    { id: 'sma_200', name: 'SMA 200', type: 'SMA', length: 200, period: 200, color: '#00E676', source: 'close', lineWidth: 1.5, visible: false },
];

export function calculateEMA(candles, period = 20, source = 'close') {
    if (!candles || candles.length < period) return [];
    const getVal = (c) => (c && c[source] !== undefined) ? Number(c[source]) : (c && c.close !== undefined ? Number(c.close) : 0);
    const k = 2 / (period + 1);

    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += getVal(candles[i]);
    }
    let ema = sum / period;
    const result = [{ time: candles[period - 1].time, value: Number(ema.toFixed(5)) }];

    for (let i = period; i < candles.length; i++) {
        const val = getVal(candles[i]);
        ema = (val * k) + (ema * (1 - k));
        result.push({ time: candles[i].time, value: Number(ema.toFixed(5)) });
    }
    return result;
}

export function calculateSMA(candles, period = 20, source = 'close') {
    if (!candles || candles.length < period) return [];
    const getVal = (c) => (c && c[source] !== undefined) ? Number(c[source]) : (c && c.close !== undefined ? Number(c.close) : 0);
    const result = [];
    for (let i = period - 1; i < candles.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += getVal(candles[i - j]);
        }
        result.push({ time: candles[i].time, value: Number((sum / period).toFixed(5)) });
    }
    return result;
}

export function getIndicatorData(candles, type, period = 20, source = 'close') {
    if (type === 'SMA') return calculateSMA(candles, period, source);
    return calculateEMA(candles, period, source);
}

export const MA_COLOR_PALETTE = ['#FFD600', '#00E5FF', '#AA00FF', '#FF9100', '#FF1744', '#00E676', '#26A69A', '#E91E63', '#2979FF'];

function calculateBollingerBands(candles, period = 20, stdDevMult = 2, source = 'close') {
    const upper = [];
    const lower = [];
    const middle = [];
    if (!candles || candles.length < period) return { upper, lower, middle };
    const getVal = (c) => (c && c[source] !== undefined) ? c[source] : c.close;

    for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1);
        const mean = slice.reduce((sum, c) => sum + getVal(c), 0) / period;
        const variance = slice.reduce((sum, c) => sum + Math.pow(getVal(c) - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        const time = candles[i].time;
        middle.push({ time, value: mean });
        upper.push({ time, value: mean + stdDevMult * stdDev });
        lower.push({ time, value: mean - stdDevMult * stdDev });
    }
    return { upper, lower, middle };
}

function calculatePivotPoints(candles) {
    if (!candles || candles.length === 0) return { P: [], R1: [], S1: [], R2: [], S2: [] };
    const lastBar = candles[candles.length - 1];
    const H = lastBar.high;
    const L = lastBar.low;
    const C = lastBar.close;

    const P_val = (H + L + C) / 3;
    const R1_val = 2 * P_val - L;
    const S1_val = 2 * P_val - H;
    const R2_val = P_val + (H - L);
    const S2_val = P_val - (H - L);

    const firstTime = candles[0].time;
    const lastTime = candles[candles.length - 1].time;

    return {
        P: [{ time: firstTime, value: P_val }, { time: lastTime, value: P_val }],
        R1: [{ time: firstTime, value: R1_val }, { time: lastTime, value: R1_val }],
        S1: [{ time: firstTime, value: S1_val }, { time: lastTime, value: S1_val }],
        R2: [{ time: firstTime, value: R2_val }, { time: lastTime, value: R2_val }],
        S2: [{ time: firstTime, value: S2_val }, { time: lastTime, value: S2_val }],
    };
}

function calculateRSI(candles, period = 14) {
    if (!candles || candles.length <= period) return [];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = candles[i].close - candles[i - 1].close;
        if (change >= 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    const result = [];
    const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: candles[period].time, value: 100 - 100 / (1 + firstRs) });

    for (let i = period + 1; i < candles.length; i++) {
        const change = candles[i].close - candles[i - 1].close;
        const gain = change >= 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result.push({ time: candles[i].time, value: 100 - 100 / (1 + rs) });
    }
    return result;
}

function calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEma = calculateEMA(candles, fastPeriod);
    const slowEma = calculateEMA(candles, slowPeriod);
    const slowMap = new Map(slowEma.map(item => [item.time, item.value]));
    const macdLine = [];

    for (const f of fastEma) {
        if (slowMap.has(f.time)) {
            macdLine.push({ time: f.time, value: f.value - slowMap.get(f.time) });
        }
    }

    if (macdLine.length < signalPeriod) return { macd: [], signal: [], histogram: [] };
    const k = 2 / (signalPeriod + 1);
    let signalEma = macdLine.slice(0, signalPeriod).reduce((sum, item) => sum + item.value, 0) / signalPeriod;
    const signalLine = [{ time: macdLine[signalPeriod - 1].time, value: signalEma }];
    const histogram = [{
        time: macdLine[signalPeriod - 1].time,
        value: macdLine[signalPeriod - 1].value - signalEma,
        color: (macdLine[signalPeriod - 1].value - signalEma) >= 0 ? '#26a69a' : '#ef5350'
    }];

    for (let i = signalPeriod; i < macdLine.length; i++) {
        const item = macdLine[i];
        signalEma = (item.value - signalEma) * k + signalEma;
        const histVal = item.value - signalEma;
        signalLine.push({ time: item.time, value: signalEma });
        histogram.push({
            time: item.time,
            value: histVal,
            color: histVal >= 0 ? '#26a69a' : '#ef5350'
        });
    }

    return { macd: macdLine, signal: signalLine, histogram };
}

function calculateStochastic(candles, period = 14, kSmooth = 3, dSmooth = 3) {
    if (!candles || candles.length < period) return { k: [], d: [] };
    const rawK = [];

    for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1);
        let lowMin = Infinity;
        let highMax = -Infinity;
        for (const c of slice) {
            if (c.low < lowMin) lowMin = c.low;
            if (c.high > highMax) highMax = c.high;
        }
        const currentClose = candles[i].close;
        const kVal = highMax === lowMin ? 50 : ((currentClose - lowMin) / (highMax - lowMin)) * 100;
        rawK.push({ time: candles[i].time, value: kVal });
    }

    const smoothedK = [];
    for (let i = kSmooth - 1; i < rawK.length; i++) {
        const slice = rawK.slice(i - kSmooth + 1, i + 1);
        const avg = slice.reduce((sum, item) => sum + item.value, 0) / kSmooth;
        smoothedK.push({ time: rawK[i].time, value: avg });
    }

    const smoothedD = [];
    for (let i = dSmooth - 1; i < smoothedK.length; i++) {
        const slice = smoothedK.slice(i - dSmooth + 1, i + 1);
        const avg = slice.reduce((sum, item) => sum + item.value, 0) / dSmooth;
        smoothedD.push({ time: smoothedK[i].time, value: avg });
    }

    return { k: smoothedK, d: smoothedD };
}

const TradingViewChartPane = forwardRef(function TradingViewChartPane(
    { symbol = 'XAU/USD', onSymbolChange, onAttachScreenshot },
    ref
) {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const isDark = theme === 'dark';

    const isChartNoPair = !symbol || symbol === 'No Pair' || symbol === 'NO_PAIR' || String(symbol).toUpperCase().includes('NO PAIR') || String(symbol).toLowerCase() === 'none';
    const chartSymbol = isChartNoPair ? 'XAU/USD' : symbol;
    const activeSymbolClean = normalizeSymbol(chartSymbol);

    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const wsRef = useRef(null);
    const symbolDropdownRef = useRef(null);
    const headerSymbolDropdownRef = useRef(null);
    const cameraDropdownRef = useRef(null);
    const chartTypeDropdownRef = useRef(null);
    const timeframeDropdownRef = useRef(null);
    const indicatorsDropdownRef = useRef(null);

    // Dynamic Moving Averages (EMA / SMA) State & Series Tracking
    const [movingAverages, setMovingAverages] = useState([]);
    const maSeriesRefs = useRef(new Map());
    const currentChartTypeRef = useRef(null);

    // Other Indicator Overlay Series Refs
    const bbUpperSeriesRef = useRef(null);
    const bbMiddleSeriesRef = useRef(null);
    const bbLowerSeriesRef = useRef(null);
    const pivotSeriesRefs = useRef([]);
    const candlesDataRef = useRef([]);

    // Sub-Pane Canvas Container Refs & Sub-Pane Chart Instances
    const rsiContainerRef = useRef(null);
    const macdContainerRef = useRef(null);
    const stochContainerRef = useRef(null);
    const rsiChartObjRef = useRef(null);
    const macdChartObjRef = useRef(null);
    const stochChartObjRef = useRef(null);

    // Chart Settings & Indicators State
    const [currentTimeframe, setCurrentTimeframe] = useState('15m');
    const [chartType, setChartType] = useState('candlestick');
    const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
    const [headerSymbolDropdownOpen, setHeaderSymbolDropdownOpen] = useState(false);
    const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
    const [chartTypeDropdownOpen, setChartTypeDropdownOpen] = useState(false);
    const [timeframeDropdownOpen, setTimeframeDropdownOpen] = useState(false);
    const [indicatorsDropdownOpen, setIndicatorsDropdownOpen] = useState(false);
    const [indicatorsModalOpen, setIndicatorsModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Active Indicator Toggles (Overlays & Sub-panes)
    const [activeIndicators, setActiveIndicators] = useState({
        bollinger: false,
        pivot: false,
        rsi: false,
        macd: false,
        stochastic: false,
    });

    // Ticker Search & Category Filter State
    const [tickerSearch, setTickerSearch] = useState('');
    const [activeCategoryTab, setActiveCategoryTab] = useState('all');

    // Style Customizations (TradingView Style Defaults)
    const [bullishColor, setBullishColor] = useState('#26a69a');
    const [bearishColor, setBearishColor] = useState('#ef5350');
    const [backgroundColor, setBackgroundColor] = useState(isDark ? '#08090c' : '#FFFFFF');
    const [extendedSession, setExtendedSession] = useState(false);
    const [preMarketColor, setPreMarketColor] = useState('#FF6D00');
    const [postMarketColor, setPostMarketColor] = useState('#2979FF');

    // Draft Settings State (Applied ONLY when clicking Apply Settings)
    const [draftBullishColor, setDraftBullishColor] = useState('#26a69a');
    const [draftBearishColor, setDraftBearishColor] = useState('#ef5350');
    const [draftBackgroundColor, setDraftBackgroundColor] = useState(isDark ? '#08090c' : '#FFFFFF');
    const [draftExtendedSession, setDraftExtendedSession] = useState(false);
    const [draftPreMarketColor, setDraftPreMarketColor] = useState('#FF6D00');
    const [draftPostMarketColor, setDraftPostMarketColor] = useState('#2979FF');

    const closeAllDropdowns = () => {
        setSymbolDropdownOpen(false);
        setHeaderSymbolDropdownOpen(false);
        setCameraDropdownOpen(false);
        setChartTypeDropdownOpen(false);
        setTimeframeDropdownOpen(false);
        setIndicatorsDropdownOpen(false);
    };

    const toggleIndicatorsDropdown = () => {
        const nextState = !indicatorsDropdownOpen;
        closeAllDropdowns();
        if (nextState) setIndicatorsDropdownOpen(true);
    };

    const toggleSymbolDropdown = () => {
        const nextState = !symbolDropdownOpen;
        closeAllDropdowns();
        if (nextState) setSymbolDropdownOpen(true);
    };

    const toggleHeaderSymbolDropdown = () => {
        const nextState = !headerSymbolDropdownOpen;
        closeAllDropdowns();
        if (nextState) setHeaderSymbolDropdownOpen(true);
    };

    const toggleCameraDropdown = () => {
        const nextState = !cameraDropdownOpen;
        closeAllDropdowns();
        if (nextState) setCameraDropdownOpen(true);
    };

    const toggleTimeframeDropdown = () => {
        const nextState = !timeframeDropdownOpen;
        closeAllDropdowns();
        if (nextState) setTimeframeDropdownOpen(true);
    };

    const toggleChartTypeDropdown = () => {
        const nextState = !chartTypeDropdownOpen;
        closeAllDropdowns();
        if (nextState) setChartTypeDropdownOpen(true);
    };

    const openSettingsModal = () => {
        closeAllDropdowns();
        setDraftBullishColor(bullishColor);
        setDraftBearishColor(bearishColor);
        setDraftBackgroundColor(backgroundColor);
        setDraftExtendedSession(extendedSession);
        setDraftPreMarketColor(preMarketColor);
        setDraftPostMarketColor(postMarketColor);
        setSettingsOpen(true);
    };

    const handleApplySettings = () => {
        setBullishColor(draftBullishColor);
        setBearishColor(draftBearishColor);
        setBackgroundColor(draftBackgroundColor);
        setSettingsOpen(false);
    };

    const handleResetSettings = () => {
        const defaultBg = isDark ? '#08090c' : '#FFFFFF';
        const defaultBull = '#26a69a';
        const defaultBear = '#ef5350';
        setDraftBullishColor(defaultBull);
        setDraftBearishColor(defaultBear);
        setDraftBackgroundColor(defaultBg);
        setBullishColor(defaultBull);
        setBearishColor(defaultBear);
        setBackgroundColor(defaultBg);
        setSettingsOpen(false);
    };

    // Live price tracking state
    const [latestCandle, setLatestCandle] = useState(null);
    const [loading, setLoading] = useState(true);

    // Indicator Configs & Visibility States
    const [indicatorConfigs, setIndicatorConfigs] = useState(DEFAULT_INDICATOR_CONFIGS);
    const [indicatorVisibility, setIndicatorVisibility] = useState({
        ema10: true,
        ema20: true,
        ema50: true,
        bollinger: true,
        pivot: true,
        rsi: true,
        macd: true,
        stochastic: true,
    });
    const [editingIndicator, setEditingIndicator] = useState(null);

    const toggleIndicatorVisibility = (key) => {
        setIndicatorVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const removeIndicator = (key) => {
        setActiveIndicators(prev => ({ ...prev, [key]: false }));
    };

    const openIndicatorSettings = (key) => {
        setEditingIndicator(key);
    };

    // Moving Averages Handlers
    const addMovingAverage = (type = 'EMA', suggestedLength = null) => {
        if (type === 'EMA_TOGGLE') {
            setMovingAverages(prev => prev.filter(m => m.type !== 'EMA'));
            return;
        }
        if (type === 'SMA_TOGGLE') {
            setMovingAverages(prev => prev.filter(m => m.type !== 'SMA'));
            return;
        }

        const activeOverlayCount = Object.keys(activeIndicators || {}).filter(k => activeIndicators[k]).length;
        const activeMACount = movingAverages ? movingAverages.filter(m => m.visible).length : 0;
        if (activeOverlayCount + activeMACount >= 3) {
            toast('Maximum 3 indicators can be selected at a time');
            return;
        }

        // Check if a disabled preset exists for this type
        const disabledPreset = movingAverages.find(m => m.type === type && !m.visible);
        if (disabledPreset && !suggestedLength) {
            setMovingAverages(prev => prev.map(m => m.id === disabledPreset.id ? { ...m, visible: true } : m));
            return;
        }

        let nextLength = suggestedLength;
        if (!nextLength) {
            const existingLengths = movingAverages.filter(m => m.type === type && m.visible).map(m => m.length || m.period);
            const standardLengths = [20, 50, 200, 10, 9, 21, 55, 89, 100];
            nextLength = standardLengths.find(l => !existingLengths.includes(l)) || (20 + (existingLengths.length * 10));
        }
        const defaultColors = type === 'EMA' ? ['#FFD600', '#AA00FF', '#FF1744'] : ['#00E5FF', '#FF9100', '#00E676'];
        const colorIndex = movingAverages.filter(m => m.type === type).length % defaultColors.length;
        const newMA = {
            id: `ma_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: `${type} ${nextLength}`,
            type,
            length: nextLength,
            period: nextLength,
            source: 'close',
            color: defaultColors[colorIndex],
            lineWidth: 1.5,
            visible: true,
        };
        setMovingAverages(prev => [...prev, newMA]);
    };

    const toggleMAVisibility = (id) => {
        setMovingAverages(prev => {
            const target = prev.find(m => m.id === id);
            if (target && !target.visible) {
                const activeOverlayCount = Object.keys(activeIndicators || {}).filter(k => activeIndicators[k]).length;
                const activeMACount = prev.filter(m => m.visible).length;
                if (activeOverlayCount + activeMACount >= 3) {
                    toast('Maximum 3 indicators can be selected at a time');
                    return prev;
                }
            }
            return prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m);
        });
    };

    const removeMovingAverage = (id) => {
        setMovingAverages(prev => prev.filter(m => m.id !== id));
        const s = maSeriesRefs.current.get(id);
        if (s && chartRef.current) {
            try { chartRef.current.removeSeries(s); } catch {}
            maSeriesRefs.current.delete(id);
        }
    };

    const saveIndicatorConfig = (newCfg) => {
        if (!editingIndicator) return;
        if (editingIndicator.startsWith('ma_')) {
            setMovingAverages(prev => prev.map(m => {
                if (m.id === editingIndicator) {
                    const finalType = newCfg.type || m.type || 'EMA';
                    const finalLength = newCfg.length !== undefined ? Number(newCfg.length) : (m.length || 20);
                    return {
                        ...m,
                        ...newCfg,
                        type: finalType,
                        length: finalLength,
                        period: finalLength,
                        name: `${finalType} ${finalLength}`,
                    };
                }
                return m;
            }));
        } else {
            setIndicatorConfigs(prev => ({ ...prev, [editingIndicator]: newCfg }));
        }
    };

    const resetIndicatorDefaults = () => {
        if (!editingIndicator) return;
        if (editingIndicator.startsWith('ma_')) {
            setMovingAverages(prev => prev.map(m => {
                if (m.id === editingIndicator) {
                    const defaultLen = 20;
                    const finalType = m.type || 'EMA';
                    return {
                        ...m,
                        length: defaultLen,
                        period: defaultLen,
                        name: `${finalType} ${defaultLen}`,
                        source: 'close',
                        lineWidth: 1.5,
                    };
                }
                return m;
            }));
        } else {
            setIndicatorConfigs(prev => ({
                ...prev,
                [editingIndicator]: { ...DEFAULT_INDICATOR_CONFIGS[editingIndicator] }
            }));
        }
    };

    // Expose capture functionality to parent via ref
    useImperativeHandle(ref, () => ({
        getScreenshotDataUrl: () => {
            if (!chartRef.current) return null;
            const canvas = chartRef.current.takeScreenshot();
            return canvas.toDataURL('image/png');
        },
        attachScreenshot: () => {
            attachChartToChat();
        },
    }));

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(e.target)) {
                setSymbolDropdownOpen(false);
            }
            if (headerSymbolDropdownRef.current && !headerSymbolDropdownRef.current.contains(e.target)) {
                setHeaderSymbolDropdownOpen(false);
            }
            if (cameraDropdownRef.current && !cameraDropdownRef.current.contains(e.target)) {
                setCameraDropdownOpen(false);
            }
            if (chartTypeDropdownRef.current && !chartTypeDropdownRef.current.contains(e.target)) {
                setChartTypeDropdownOpen(false);
            }
            if (timeframeDropdownRef.current && !timeframeDropdownRef.current.contains(e.target)) {
                setTimeframeDropdownOpen(false);
            }
            if (indicatorsDropdownRef.current && !indicatorsDropdownRef.current.contains(e.target)) {
                setIndicatorsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Render unified Ticker Search Dropdown Menu (TradingView Style)
    const renderSymbolDropdownMenu = (closeMenu) => (
        <TickerSearchDropdown
            selectedSymbol={chartSymbol}
            onSelectSymbol={(newSym) => {
                if (onSymbolChange) onSymbolChange(newSym);
            }}
            onClose={closeMenu}
            position="bottom"
            isDark={!isChartLight}
            allowNoPair={false}
        />
    );

    // Sync chart theme colors on app theme change
    useEffect(() => {
        const bg = isDark ? '#08090c' : '#FFFFFF';
        const txt = isDark ? '#94A3B8' : '#334155';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
        const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';
        const subGridVert = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)';
        const subGridHorz = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';

        setBackgroundColor(bg);

        if (chartRef.current) {
            chartRef.current.applyOptions({
                layout: {
                    background: { color: bg },
                    textColor: txt,
                },
                grid: {
                    vertLines: { color: gridColor },
                    horzLines: { color: gridColor },
                },
                timeScale: { borderColor },
                rightPriceScale: { borderColor },
            });
        }

        const subOptions = {
            layout: {
                background: { color: bg },
                textColor: txt,
            },
            grid: {
                vertLines: { color: subGridVert },
                horzLines: { color: subGridHorz },
            },
            timeScale: { borderColor },
            rightPriceScale: { borderColor },
        };

        if (rsiChartObjRef.current?.chart) {
            try { rsiChartObjRef.current.chart.applyOptions(subOptions); } catch {}
        }
        if (macdChartObjRef.current?.chart) {
            try { macdChartObjRef.current.chart.applyOptions(subOptions); } catch {}
        }
        if (stochChartObjRef.current?.chart) {
            try { stochChartObjRef.current.chart.applyOptions(subOptions); } catch {}
        }
    }, [theme, isDark]);

    // 1. Initialize Chart Engine
    useEffect(() => {
        if (!containerRef.current) return;

        const initialBg = isDark ? '#08090c' : '#FFFFFF';
        const initialTxt = isDark ? '#94A3B8' : '#334155';
        const initialGrid = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
        const initialBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight || 500,
            attributionLogo: false,
            layout: {
                background: { color: initialBg },
                textColor: initialTxt,
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            grid: {
                vertLines: { color: initialGrid },
                horzLines: { color: initialGrid },
            },
            crosshair: {
                mode: 1, // CrosshairMode.Normal
                vertLine: {
                    color: 'rgba(41, 121, 255, 0.5)',
                    width: 1,
                    style: 2,
                },
                horzLine: {
                    color: 'rgba(41, 121, 255, 0.5)',
                    width: 1,
                    style: 2,
                },
            },
            timeScale: {
                borderColor: initialBorder,
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: initialBorder,
                scaleMargins: {
                    top: 0.08,
                    bottom: 0.22,
                },
            },
        });

        chartRef.current = chart;

        // Resize Observer for responsive container sizing
        const handleResize = () => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []);

    // Update chart background when setting changes
    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.applyOptions({
                layout: {
                    background: { color: backgroundColor },
                },
            });
        }
    }, [backgroundColor]);

    // 2. Load Candle Data & Manage Series + WebSocket
    useEffect(() => {
        let isMounted = true;

        async function loadChartData() {
            if (!chartRef.current) {
                await new Promise((r) => setTimeout(r, 60));
                if (!chartRef.current || !isMounted) return;
            }
            setLoading(true);

            // Safety fallback: Ensure loading spinner never gets stuck on screen
            const safetyTimer = setTimeout(() => {
                if (isMounted) setLoading(false);
            }, 1200);

            // Disconnect any active WebSocket connection before loading new pair/timeframe
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            // Fetch historical candle data via HTTP REST API (Deduplicated fetch)
            let rawCandles = [];
            try {
                const json = await fetchChartCandlesOnce(activeSymbolClean, currentTimeframe);
                rawCandles = json.candles || json.data || json || [];
            } catch (err) {
                console.warn('REST candles fetch notice:', err.message);
            }

            // Fallback mock generator if no candles returned from API
            if (!Array.isArray(rawCandles) || rawCandles.length === 0) {
                const baseVal = activeSymbolClean.includes('XAU')
                    ? 2720
                    : activeSymbolClean.includes('BTC')
                    ? 92000
                    : 1.085;
                rawCandles = generateMockCandles(600, baseVal, currentTimeframe, activeSymbolClean);
            }

            // Parse floats and handle timestamp formatting
            const formattedCandles = rawCandles
                .map((c) => {
                    let timeVal = c.time || c.timestamp;
                    if (typeof timeVal === 'string') {
                        if (timeVal.includes('T')) {
                            timeVal = Math.floor(new Date(timeVal).getTime() / 1000);
                        } else if (!isNaN(Number(timeVal))) {
                            timeVal = Number(timeVal);
                        } else {
                            timeVal = Math.floor(new Date(timeVal).getTime() / 1000);
                        }
                    } else {
                        timeVal = Number(timeVal);
                    }

                    const openPrice = parseFloat(c.open);
                    const highPrice = parseFloat(c.high);
                    const lowPrice = parseFloat(c.low);
                    const closePrice = parseFloat(c.close);
                    const volumeVal = parseFloat(c.volume || c.tick_volume || c.vol || 0);

                    return {
                        time: timeVal,
                        open: openPrice,
                        high: highPrice,
                        low: lowPrice,
                        close: closePrice,
                        value: closePrice,
                        volume: volumeVal,
                        volumeColor: closePrice >= openPrice ? 'rgba(38, 166, 154, 0.7)' : 'rgba(239, 83, 80, 0.7)',
                    };
                })
                .filter((c) => !isNaN(c.time) && !isNaN(c.close));

            formattedCandles.sort((a, b) => a.time - b.time);
            candlesDataRef.current = formattedCandles;

            if (!isMounted || !chartRef.current) return;

            // Ensure volume series is initialized
            if (!volumeSeriesRef.current) {
                const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
                    priceFormat: { type: 'volume' },
                    priceScaleId: 'volume',
                });
                chartRef.current.priceScale('volume').applyOptions({
                    scaleMargins: {
                        top: 0.8,
                        bottom: 0,
                    },
                });
                volumeSeriesRef.current = volumeSeries;
            }

            // Create or update main price series only when data is ready
            if (!seriesRef.current || currentChartTypeRef.current !== chartType) {
                if (seriesRef.current) {
                    try { chartRef.current.removeSeries(seriesRef.current); } catch {}
                }
                if (chartType === 'line') {
                    seriesRef.current = chartRef.current.addSeries(LineSeries, {
                        color: '#2979FF',
                        lineWidth: 2,
                    });
                } else if (chartType === 'area') {
                    seriesRef.current = chartRef.current.addSeries(AreaSeries, {
                        topColor: 'rgba(41, 121, 255, 0.46)',
                        bottomColor: 'rgba(41, 121, 255, 0.0)',
                        lineColor: '#2979FF',
                        lineWidth: 2,
                    });
                } else {
                    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
                        upColor: bullishColor,
                        borderUpColor: bullishColor,
                        wickUpColor: bullishColor,
                        downColor: bearishColor,
                        borderDownColor: bearishColor,
                        wickDownColor: bearishColor,
                    });
                }
                currentChartTypeRef.current = chartType;
            }

            // Apply Dynamic Symbol Precision (5 decimals for Forex, 3 for JPY, 2 for Gold/Crypto)
            const { precision, minMove } = getSymbolPrecision(activeSymbolClean);
            seriesRef.current.applyOptions({
                priceFormat: {
                    type: 'price',
                    precision: precision,
                    minMove: minMove,
                },
            });

            // Set new candle and volume data smoothly
            seriesRef.current.setData(formattedCandles);
            if (volumeSeriesRef.current) {
                volumeSeriesRef.current.setData(
                    formattedCandles.map((c) => ({
                        time: c.time,
                        value: c.volume || Math.floor(Math.random() * 2500) + 400,
                        color: c.volumeColor,
                    }))
                );
            }
            updateIndicators(formattedCandles);
            const last = formattedCandles[formattedCandles.length - 1];
            if (last) setLatestCandle(last);
            chartRef.current.timeScale().applyOptions({
                barSpacing: 9,
                rightOffset: 8,
            });
            chartRef.current.timeScale().scrollToRealtime();

            // Clear loading overlay now that the new currency graph is loaded and rendered
            setLoading(false);

            // 3. Connect Real-Time Updates (Deduplicated WebSocket Store)
            let unsubscribeWS = null;
            let mockCleanup = null;
            try {
                unsubscribeWS = subscribeLiveCandles(activeSymbolClean, currentTimeframe, (bar) => {
                    if (!isMounted) return;
                    setLoading(false);
                    let timeVal = bar.time || bar.timestamp;
                    if (typeof timeVal === 'string') {
                        if (timeVal.includes('T')) {
                            timeVal = Math.floor(new Date(timeVal).getTime() / 1000);
                        } else if (!isNaN(Number(timeVal))) {
                            timeVal = Number(timeVal);
                        } else {
                            timeVal = Math.floor(new Date(timeVal).getTime() / 1000);
                        }
                    } else {
                        timeVal = Number(timeVal);
                    }

                    const openPrice = parseFloat(bar.open);
                    const closePrice = parseFloat(bar.close);
                    const volumeVal = parseFloat(bar.volume || bar.tick_volume || bar.vol || 0);

                    const updatedBar = {
                        time: timeVal,
                        open: openPrice,
                        high: parseFloat(bar.high),
                        low: parseFloat(bar.low),
                        close: closePrice,
                        value: closePrice,
                    };

                    if (seriesRef.current) {
                        seriesRef.current.update(updatedBar);
                    }
                    if (volumeSeriesRef.current) {
                        volumeSeriesRef.current.update({
                            time: timeVal,
                            value: volumeVal || Math.floor(Math.random() * 2000) + 500,
                            color: closePrice >= openPrice ? 'rgba(38, 166, 154, 0.7)' : 'rgba(239, 83, 80, 0.7)',
                        });
                    }
                    setLatestCandle(updatedBar);
                });
            } catch {
                if (isMounted) setLoading(false);
                mockCleanup = startMockTickSimulator(isMounted);
            }

            return () => {
                if (unsubscribeWS) unsubscribeWS();
                if (mockCleanup) mockCleanup();
            };
        }

        loadChartData();

        return () => {
            isMounted = false;
        };
    }, [activeSymbolClean, currentTimeframe, chartType]);

    // Fallback real-time tick simulator if WS endpoint offline
    const startMockTickSimulator = (isMounted) => {
        const interval = setInterval(() => {
            if (!isMounted || !seriesRef.current) return;
            setLatestCandle((prev) => {
                if (!prev) return prev;
                const priceDelta = (Math.random() - 0.495) * (prev.close * 0.0008);
                const newClose = Number((prev.close + priceDelta).toFixed(2));
                const newHigh = Math.max(prev.high, newClose);
                const newLow = Math.min(prev.low, newClose);
                const newVol = Math.floor(Math.random() * 2000) + 500;
                const updated = {
                    ...prev,
                    high: newHigh,
                    low: newLow,
                    close: newClose,
                    value: newClose,
                };
                seriesRef.current.update(updated);

                if (volumeSeriesRef.current) {
                    volumeSeriesRef.current.update({
                        time: prev.time,
                        value: newVol,
                        color: newClose >= prev.open ? 'rgba(38, 166, 154, 0.7)' : 'rgba(239, 83, 80, 0.7)',
                    });
                }
                return updated;
            });
        }, 1500);

        return () => clearInterval(interval);
    };

    // Main Overlay Indicator Manager
    const updateIndicators = (candles) => {
        if (!chartRef.current || !candles || candles.length === 0) return;

        // Render and Sync Dynamic Moving Averages (EMA & SMA)
        const activeMAIds = new Set(movingAverages.map(m => m.id));
        for (const [id, s] of maSeriesRefs.current.entries()) {
            if (!activeMAIds.has(id)) {
                try { chartRef.current.removeSeries(s); } catch {}
                maSeriesRefs.current.delete(id);
            }
        }

        movingAverages.forEach(ma => {
            let s = maSeriesRefs.current.get(ma.id);
            const finalType = ma.type || 'EMA';
            const finalLength = ma.length || ma.period || 20;
            const maTitle = `${finalType} ${finalLength}`;
            if (!s) {
                s = chartRef.current.addSeries(LineSeries, {
                    title: maTitle,
                    color: ma.color,
                    lineWidth: ma.lineWidth,
                    visible: ma.visible,
                });
                maSeriesRefs.current.set(ma.id, s);
            } else {
                s.applyOptions({
                    title: maTitle,
                    color: ma.color,
                    lineWidth: ma.lineWidth,
                    visible: ma.visible,
                });
            }
            const data = ma.type === 'SMA'
                ? calculateSMA(candles, ma.length, ma.source)
                : calculateEMA(candles, ma.length, ma.source);
            s.setData(data);
        });

        // 4. Bollinger Bands
        if (activeIndicators.bollinger) {
            const cfg = indicatorConfigs.bollinger;
            const isVis = indicatorVisibility.bollinger;
            const bb = calculateBollingerBands(candles, cfg.length, cfg.stdDev, cfg.source);
            if (!bbUpperSeriesRef.current) {
                bbUpperSeriesRef.current = chartRef.current.addSeries(LineSeries, { color: cfg.color, lineWidth: cfg.lineWidth, lineStyle: 2, visible: isVis });
                bbMiddleSeriesRef.current = chartRef.current.addSeries(LineSeries, { color: cfg.color, lineWidth: cfg.lineWidth, visible: isVis });
                bbLowerSeriesRef.current = chartRef.current.addSeries(LineSeries, { color: cfg.color, lineWidth: cfg.lineWidth, lineStyle: 2, visible: isVis });
            } else {
                bbUpperSeriesRef.current.applyOptions({ color: cfg.color, lineWidth: cfg.lineWidth, visible: isVis });
                bbMiddleSeriesRef.current.applyOptions({ color: cfg.color, lineWidth: cfg.lineWidth, visible: isVis });
                bbLowerSeriesRef.current.applyOptions({ color: cfg.color, lineWidth: cfg.lineWidth, visible: isVis });
            }
            bbUpperSeriesRef.current.setData(bb.upper);
            bbMiddleSeriesRef.current.setData(bb.middle);
            bbLowerSeriesRef.current.setData(bb.lower);
        } else if (bbUpperSeriesRef.current) {
            try {
                chartRef.current.removeSeries(bbUpperSeriesRef.current);
                chartRef.current.removeSeries(bbMiddleSeriesRef.current);
                chartRef.current.removeSeries(bbLowerSeriesRef.current);
            } catch {}
            bbUpperSeriesRef.current = null;
            bbMiddleSeriesRef.current = null;
            bbLowerSeriesRef.current = null;
        }

        // 5. Pivot Points
        if (activeIndicators.pivot) {
            const isVis = indicatorVisibility.pivot;
            const pivots = calculatePivotPoints(candles);
            if (pivotSeriesRefs.current.length === 0) {
                const pLine = chartRef.current.addSeries(LineSeries, { color: '#FFD600', lineWidth: 1, lineStyle: 1, visible: isVis });
                const r1Line = chartRef.current.addSeries(LineSeries, { color: '#EF5350', lineWidth: 1, lineStyle: 2, visible: isVis });
                const r2Line = chartRef.current.addSeries(LineSeries, { color: '#D32F2F', lineWidth: 1, lineStyle: 2, visible: isVis });
                const s1Line = chartRef.current.addSeries(LineSeries, { color: '#26A69A', lineWidth: 1, lineStyle: 2, visible: isVis });
                const s2Line = chartRef.current.addSeries(LineSeries, { color: '#388E3C', lineWidth: 1, lineStyle: 2, visible: isVis });
                pivotSeriesRefs.current = [pLine, r1Line, r2Line, s1Line, s2Line];
            } else {
                pivotSeriesRefs.current.forEach(s => {
                    try { s.applyOptions({ visible: isVis }); } catch {}
                });
            }
            pivotSeriesRefs.current[0].setData(pivots.P);
            pivotSeriesRefs.current[1].setData(pivots.R1);
            pivotSeriesRefs.current[2].setData(pivots.R2);
            pivotSeriesRefs.current[3].setData(pivots.S1);
            pivotSeriesRefs.current[4].setData(pivots.S2);
        } else if (pivotSeriesRefs.current.length > 0) {
            pivotSeriesRefs.current.forEach(s => {
                try { chartRef.current.removeSeries(s); } catch {}
            });
            pivotSeriesRefs.current = [];
        }
    };

    useEffect(() => {
        updateIndicators(candlesDataRef.current);
    }, [activeIndicators, indicatorConfigs, indicatorVisibility, movingAverages]);

    const hasSubPanes = Boolean(activeIndicators.rsi || activeIndicators.macd || activeIndicators.stochastic);

    // Dynamically adjust scaleMargins to lift price and volume graph up when subpanes are active
    useEffect(() => {
        if (!chartRef.current) return;
        chartRef.current.applyOptions({
            rightPriceScale: {
                scaleMargins: {
                    top: 0.08,
                    bottom: hasSubPanes ? 0.28 : 0.20,
                },
            },
        });
        try {
            chartRef.current.priceScale('volume').applyOptions({
                scaleMargins: {
                    top: hasSubPanes ? 0.74 : 0.80,
                    bottom: 0.02,
                },
            });
        } catch {}

        if (containerRef.current) {
            chartRef.current.applyOptions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        }
    }, [hasSubPanes]);

    // Sub-Pane Charts Management (RSI, MACD, Stochastic)
    useEffect(() => {
        const candles = candlesDataRef.current;
        if (!candles || candles.length === 0) return;

        const syncTimeWithMain = (subChart) => {
            if (!chartRef.current || !subChart) return;
            try {
                const mainTs = chartRef.current.timeScale();
                const subTs = subChart.timeScale();
                mainTs.subscribeVisibleLogicalRangeChange((r) => {
                    if (r) try { subTs.setVisibleLogicalRange(r); } catch {}
                });
                subTs.subscribeVisibleLogicalRangeChange((r) => {
                    if (r) try { mainTs.setVisibleLogicalRange(r); } catch {}
                });
                const curRange = mainTs.getVisibleLogicalRange();
                if (curRange) subTs.setVisibleLogicalRange(curRange);
            } catch {}
        };

        const subBg = isDark ? '#08090c' : '#FFFFFF';
        const subTxt = isDark ? '#94A3B8' : '#334155';
        const subGridVert = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)';
        const subGridHorz = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
        const subBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

        // RSI Sub-pane
        if (activeIndicators.rsi && rsiContainerRef.current) {
            const cfg = indicatorConfigs.rsi;
            const isVis = indicatorVisibility.rsi;
            if (!rsiChartObjRef.current) {
                const rChart = createChart(rsiContainerRef.current, {
                    height: 125,
                    width: rsiContainerRef.current.clientWidth,
                    layout: { background: { color: subBg }, textColor: subTxt, fontFamily: 'Inter, sans-serif' },
                    grid: { vertLines: { color: subGridVert }, horzLines: { color: subGridHorz } },
                    timeScale: { visible: true, borderColor: subBorder },
                    rightPriceScale: { borderColor: subBorder }
                });
                const rSeries = rChart.addSeries(LineSeries, { color: cfg.color, lineWidth: cfg.lineWidth, visible: isVis });
                const line70 = rChart.addSeries(LineSeries, { color: 'rgba(239, 83, 80, 0.6)', lineWidth: 1, lineStyle: 2, visible: isVis });
                const line30 = rChart.addSeries(LineSeries, { color: 'rgba(38, 166, 154, 0.6)', lineWidth: 1, lineStyle: 2, visible: isVis });
                syncTimeWithMain(rChart);
                rsiChartObjRef.current = { chart: rChart, series: rSeries, line70, line30 };
            } else {
                rsiChartObjRef.current.chart.applyOptions({
                    layout: { background: { color: subBg }, textColor: subTxt },
                    grid: { vertLines: { color: subGridVert }, horzLines: { color: subGridHorz } },
                    timeScale: { borderColor: subBorder },
                    rightPriceScale: { borderColor: subBorder }
                });
                rsiChartObjRef.current.series.applyOptions({ color: cfg.color, lineWidth: cfg.lineWidth, visible: isVis });
                rsiChartObjRef.current.line70.applyOptions({ visible: isVis });
                rsiChartObjRef.current.line30.applyOptions({ visible: isVis });
            }
            const rsiData = calculateRSI(candles, cfg.length);
            rsiChartObjRef.current.series.setData(rsiData);
            if (rsiData.length > 0) {
                const first = rsiData[0].time;
                const last = rsiData[rsiData.length - 1].time;
                rsiChartObjRef.current.line70.setData([{ time: first, value: cfg.overbought }, { time: last, value: cfg.overbought }]);
                rsiChartObjRef.current.line30.setData([{ time: first, value: cfg.oversold }, { time: last, value: cfg.oversold }]);
            }
        } else if (rsiChartObjRef.current) {
            try { rsiChartObjRef.current.chart.remove(); } catch {}
            rsiChartObjRef.current = null;
        }

        // MACD Sub-pane
        if (activeIndicators.macd && macdContainerRef.current) {
            const cfg = indicatorConfigs.macd;
            const isVis = indicatorVisibility.macd;
            if (!macdChartObjRef.current) {
                const mChart = createChart(macdContainerRef.current, {
                    height: 125,
                    width: macdContainerRef.current.clientWidth,
                    layout: { background: { color: subBg }, textColor: subTxt, fontFamily: 'Inter, sans-serif' },
                    grid: { vertLines: { color: subGridVert }, horzLines: { color: subGridHorz } },
                    timeScale: { visible: true, borderColor: subBorder },
                    rightPriceScale: { borderColor: subBorder }
                });
                const histSeries = mChart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, visible: isVis });
                const macdSeries = mChart.addSeries(LineSeries, { color: cfg.macdColor, lineWidth: cfg.lineWidth, visible: isVis });
                const signalSeries = mChart.addSeries(LineSeries, { color: cfg.signalColor, lineWidth: cfg.lineWidth, visible: isVis });
                syncTimeWithMain(mChart);
                macdChartObjRef.current = { chart: mChart, histSeries, macdSeries, signalSeries };
            } else {
                macdChartObjRef.current.chart.applyOptions({
                    layout: { background: { color: subBg }, textColor: subTxt },
                    grid: { vertLines: { color: subGridVert }, horzLines: { color: subGridHorz } },
                    timeScale: { borderColor: subBorder },
                    rightPriceScale: { borderColor: subBorder }
                });
                macdChartObjRef.current.histSeries.applyOptions({ visible: isVis });
                macdChartObjRef.current.macdSeries.applyOptions({ color: cfg.macdColor, lineWidth: cfg.lineWidth, visible: isVis });
                macdChartObjRef.current.signalSeries.applyOptions({ color: cfg.signalColor, lineWidth: cfg.lineWidth, visible: isVis });
            }
            const { macd, signal, histogram } = calculateMACD(candles, cfg.fast, cfg.slow, cfg.signal);
            macdChartObjRef.current.histSeries.setData(histogram);
            macdChartObjRef.current.macdSeries.setData(macd);
            macdChartObjRef.current.signalSeries.setData(signal);
        } else if (macdChartObjRef.current) {
            try { macdChartObjRef.current.chart.remove(); } catch {}
            macdChartObjRef.current = null;
        }

        // Stochastic Sub-pane
        if (activeIndicators.stochastic && stochContainerRef.current) {
            const cfg = indicatorConfigs.stochastic;
            const isVis = indicatorVisibility.stochastic;
            if (!stochChartObjRef.current) {
                const sChart = createChart(stochContainerRef.current, {
                    height: 125,
                    width: stochContainerRef.current.clientWidth,
                    layout: { background: { color: subBg }, textColor: subTxt, fontFamily: 'Inter, sans-serif' },
                    grid: { vertLines: { color: subGridVert }, horzLines: { color: subGridHorz } },
                    timeScale: { visible: true, borderColor: subBorder },
                    rightPriceScale: { borderColor: subBorder }
                });
                const kSeries = sChart.addSeries(LineSeries, { color: cfg.kColor, lineWidth: cfg.lineWidth, visible: isVis });
                const dSeries = sChart.addSeries(LineSeries, { color: cfg.dColor, lineWidth: cfg.lineWidth, visible: isVis });
                const line80 = sChart.addSeries(LineSeries, { color: 'rgba(239, 83, 80, 0.6)', lineWidth: 1, lineStyle: 2, visible: isVis });
                const line20 = sChart.addSeries(LineSeries, { color: 'rgba(38, 166, 154, 0.6)', lineWidth: 1, lineStyle: 2, visible: isVis });
                syncTimeWithMain(sChart);
                stochChartObjRef.current = { chart: sChart, kSeries, dSeries, line80, line20 };
            } else {
                stochChartObjRef.current.chart.applyOptions({
                    layout: { background: { color: subBg }, textColor: subTxt },
                    grid: { vertLines: { color: subGridVert }, horzLines: { color: subGridHorz } },
                    timeScale: { borderColor: subBorder },
                    rightPriceScale: { borderColor: subBorder }
                });
                stochChartObjRef.current.kSeries.applyOptions({ color: cfg.kColor, lineWidth: cfg.lineWidth, visible: isVis });
                stochChartObjRef.current.dSeries.applyOptions({ color: cfg.dColor, lineWidth: cfg.lineWidth, visible: isVis });
                stochChartObjRef.current.line80.applyOptions({ visible: isVis });
                stochChartObjRef.current.line20.applyOptions({ visible: isVis });
            }
            const { k, d } = calculateStochastic(candles, cfg.kPeriod, cfg.dPeriod, cfg.smooth);
            stochChartObjRef.current.kSeries.setData(k);
            stochChartObjRef.current.dSeries.setData(d);
            if (k.length > 0) {
                const first = k[0].time;
                const last = k[k.length - 1].time;
                stochChartObjRef.current.line80.setData([{ time: first, value: 80 }, { time: last, value: 80 }]);
                stochChartObjRef.current.line20.setData([{ time: first, value: 20 }, { time: last, value: 20 }]);
            }
        } else if (stochChartObjRef.current) {
            try { stochChartObjRef.current.chart.remove(); } catch {}
            stochChartObjRef.current = null;
        }
    }, [activeIndicators, indicatorConfigs, indicatorVisibility, currentTimeframe, activeSymbolClean, isDark, theme]);

    // Update Series colors when bullish/bearish picker changes in Settings Modal
    useEffect(() => {
        if (seriesRef.current && chartType === 'candlestick') {
            seriesRef.current.applyOptions({
                upColor: bullishColor,
                borderUpColor: bullishColor,
                wickUpColor: bullishColor,
                downColor: bearishColor,
                borderDownColor: bearishColor,
                wickDownColor: bearishColor,
            });
        }
    }, [bullishColor, bearishColor, chartType]);

    // 4. Camera Screenshot Actions Implementation
    const downloadChartImage = () => {
        if (!chartRef.current) return;
        const canvas = chartRef.current.takeScreenshot();
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${activeSymbolClean}_chart.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast('Chart downloaded as ' + activeSymbolClean + '_chart.png');
        setCameraDropdownOpen(false);
    };

    const copyChartImageToClipboard = () => {
        if (!chartRef.current) return;
        const canvas = chartRef.current.takeScreenshot();
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob }),
                ]);
                toast('Chart screenshot copied to clipboard!');
            } catch (err) {
                console.error('Copy screenshot error:', err);
                toast('Could not copy image to clipboard.');
            }
        });
        setCameraDropdownOpen(false);
    };

    const attachChartToChat = () => {
        if (!chartRef.current) return;
        const canvas = chartRef.current.takeScreenshot();
        const dataUrl = canvas.toDataURL('image/png');
        if (onAttachScreenshot) {
            onAttachScreenshot({
                name: `${activeSymbolClean}_chart.png`,
                url: dataUrl,
                type: 'image/png',
            });
            toast('Chart screenshot attached to chat message!');
        } else {
            toast('Chart screenshot captured!');
        }
        setCameraDropdownOpen(false);
    };

    const currentPrice = latestCandle?.close || 0;
    const openPrice = latestCandle?.open || currentPrice;
    const priceDiff = currentPrice - openPrice;
    const isUp = priceDiff >= 0;
    const percentChange = openPrice ? ((priceDiff / openPrice) * 100).toFixed(2) : '0.00';

    const bgUpper = (backgroundColor || '').toUpperCase();
    const isBgLight = bgUpper === '#FFFFFF' || bgUpper === '#FFF' || bgUpper === 'WHITE' || bgUpper === '#F8F9FD' || bgUpper === '#F0F3FA';
    const isChartLight = !isDark || isBgLight;

    return (
        <div className={`${styles.chartPaneContainer} ${isChartLight ? styles.lightThemePane : ''}`}>
            {/* Darker Chart Header Controls Bar */}
            <div className={styles.chartHeaderControls}>
                <div className={styles.leftControlsGroup}>


                    {/* Live Real-time Price Display (Moved to Top Left Header, No BG) */}
                    {latestCandle && (
                        <div className={`${styles.headerLivePriceBadge} ${isUp ? styles.badgeUp : styles.badgeDown}`}>
                            <span className={styles.livePriceText}>{formatPrice(currentPrice, symbol)}</span>
                            {isUp ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                                    <polyline points="17 18 23 18 23 12" />
                                </svg>
                            )}                            <span className={styles.livePctTag}>{isUp ? `+${percentChange}%` : `${percentChange}%`}</span>
                        </div>
                    )}
                </div>

                <div className={styles.rightControlsGroup}>

                    {/* Right Camera Screenshot Action Menu */}
                    <div className={styles.controlDropdownWrapper} ref={cameraDropdownRef}>
                        <button
                            type="button"
                            className={styles.iconControlBtn}
                            title="Camera Screenshot Actions"
                            onClick={toggleCameraDropdown}
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </button>

                        {cameraDropdownOpen && (
                            <div className={`${styles.dropdownMenuFloating} ${styles.rightAligned}`}>
                                <button type="button" className={styles.dropdownMenuItem} onClick={attachChartToChat}>
                                    <span>{t('aiAssistant.attachToChat', 'Attach to Chat')}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                    </svg>
                                </button>
                                <button type="button" className={styles.dropdownMenuItem} onClick={downloadChartImage}>
                                    <span>{t('aiAssistant.downloadImage', 'Download Image')}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                </button>
                                <button type="button" className={styles.dropdownMenuItem} onClick={copyChartImageToClipboard}>
                                    <span>{t('aiAssistant.copyImage', 'Copy Image')}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Chart Container */}
            <div className={styles.chartCanvasArea}>
                {loading && (
                    <ChartLoaderOverlay
                        activeSymbol={activeSymbolClean}
                        currentTimeframe={currentTimeframe}
                    />
                )}

                {/* Main Candlestick / Price Chart Container */}
                <div
                    ref={containerRef}
                    className={`${styles.mainChartContainer} ${hasSubPanes ? styles.hasSubPanes : ''} ${loading ? styles.isChartLoading : ''}`}
                >
                    {/* Inside Chart Floating Control Bar (Top Left) */}
                    <div className={styles.insideChartControlPill}>
                        {/* 1. Inside Chart Control Pill Symbol Dropdown */}
                        <div className={styles.controlDropdownWrapper} ref={symbolDropdownRef}>
                            <button
                                type="button"
                                className={styles.pillSymbolBtn}
                                onClick={toggleSymbolDropdown}
                            >
                                <SymbolIcon symbol={chartSymbol} size={18} />
                                <span className={styles.pillSymbolName}>{activeSymbolClean}</span>
                                <span className={styles.statusDot} />
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {symbolDropdownOpen && renderSymbolDropdownMenu(() => setSymbolDropdownOpen(false))}
                        </div>

                        {/* 2. Timeframe Selector Dropdown (TradingView Custom Style) */}
                        <div className={styles.controlDropdownWrapper} ref={timeframeDropdownRef}>
                            <button
                                type="button"
                                className={styles.pillTimeframeBtn}
                                onClick={toggleTimeframeDropdown}
                                title="Timeframe"
                            >
                                <span className={styles.pillTimeframeLabel}>{currentTimeframe}</span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {timeframeDropdownOpen && (
                                <div className={`${styles.dropdownMenuFloating} ${styles.timeframeDropdownMenu}`}>
                                    {TIMEFRAMES.map((tf) => {
                                        const isActive = currentTimeframe === tf.value;
                                        return (
                                            <button
                                                key={tf.value}
                                                type="button"
                                                className={`${styles.dropdownMenuItem} ${isActive ? styles.activeItem : ''}`}
                                                onClick={() => {
                                                    setCurrentTimeframe(tf.value);
                                                    setTimeframeDropdownOpen(false);
                                                }}
                                            >
                                                <span className={styles.timeframeItemLabel}>{tf.label}</span>
                                                {isActive && <span className={styles.pairCheck}>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className={styles.pillDivider} />

                        {/* 3. Chart Type Selector Dropdown (TradingView SVG Style) */}
                        <div className={styles.controlDropdownWrapper} ref={chartTypeDropdownRef}>
                            <button
                                type="button"
                                className={styles.pillChartTypeBtn}
                                onClick={toggleChartTypeDropdown}
                                title="Chart Type"
                            >
                                {renderChartTypeIcon(chartType)}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {chartTypeDropdownOpen && (
                                <div className={`${styles.dropdownMenuFloating} ${styles.chartTypeDropdownMenu}`}>
                                    {CHART_TYPES.map((ct) => {
                                        const isActive = chartType === ct.value;
                                        const translatedLabel = ct.value === 'candlestick'
                                            ? t('aiAssistant.candlestick', ct.label)
                                            : ct.value === 'line'
                                            ? t('aiAssistant.line', ct.label)
                                            : ct.value === 'area'
                                            ? t('aiAssistant.area', ct.label)
                                            : ct.label;
                                        return (
                                            <button
                                                key={ct.value}
                                                type="button"
                                                className={`${styles.dropdownMenuItem} ${isActive ? styles.activeItem : ''}`}
                                                onClick={() => {
                                                    setChartType(ct.value);
                                                    setChartTypeDropdownOpen(false);
                                                }}
                                            >
                                                <div className={styles.chartTypeItemInfo}>
                                                    {renderChartTypeIcon(ct.value)}
                                                    <span>{translatedLabel}</span>
                                                </div>
                                                {isActive && <span className={styles.pairCheck}>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className={styles.pillDivider} />

                        {/* 4. Indicator Toggle Modal Trigger (TradingView Style Popup) */}
                        <div className={styles.controlDropdownWrapper}>
                            <button
                                type="button"
                                className={`${styles.pillTimeframeBtn} ${indicatorsModalOpen ? styles.activeControl : ''}`}
                                onClick={() => {
                                    closeAllDropdowns();
                                    setIndicatorsModalOpen(true);
                                }}
                                title="Indicators, Metrics & Strategies"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                <span className={styles.pillTimeframeLabel}>Indicators</span>
                            </button>
                        </div>

                        <div className={styles.pillDivider} />

                        {/* 5. Settings Cog Icon Button */}
                        <button
                            type="button"
                            className={`${styles.pillIconBtn} ${settingsOpen ? styles.activeControl : ''}`}
                            title="Chart Settings"
                            onClick={openSettingsModal}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* TradingView Style Floating Indicator Widget Legend Pills */}
                {(movingAverages.length > 0 || activeIndicators.bollinger || activeIndicators.pivot) && (
                    <div className={styles.indicatorWidgetsContainer}>
                        {/* Dynamic Moving Average Pills (EMA & SMA) */}
                        {movingAverages.map(ma => (
                            <div key={ma.id} className={styles.indicatorWidgetPill}>
                                <span className={styles.indicatorDot} style={{ background: ma.color }} />
                                <span className={styles.indicatorWidgetTitle}>
                                    {ma.type} {ma.length} {ma.source}
                                </span>
                                <button
                                    type="button"
                                    className={`${styles.indicatorActionBtn} ${!ma.visible ? styles.dimmed : ''}`}
                                    onClick={() => toggleMAVisibility(ma.id)}
                                    title={ma.visible ? "Hide" : "Show"}
                                >
                                    {ma.visible ? <EyeIcon /> : <EyeOffIcon />}
                                </button>
                                <button
                                    type="button"
                                    className={styles.indicatorActionBtn}
                                    onClick={() => openIndicatorSettings(ma.id)}
                                    title="Settings"
                                >
                                    <GearIcon />
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.indicatorActionBtn} ${styles.trashBtn}`}
                                    onClick={() => removeMovingAverage(ma.id)}
                                    title="Remove"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}

                        {activeIndicators.bollinger && (
                            <div className={styles.indicatorWidgetPill}>
                                <span className={styles.indicatorDot} style={{ background: indicatorConfigs.bollinger.color }} />
                                <span className={styles.indicatorWidgetTitle}>BB {indicatorConfigs.bollinger.length} {indicatorConfigs.bollinger.stdDev}</span>
                                <button
                                    type="button"
                                    className={`${styles.indicatorActionBtn} ${!indicatorVisibility.bollinger ? styles.dimmed : ''}`}
                                    onClick={() => toggleIndicatorVisibility('bollinger')}
                                    title={indicatorVisibility.bollinger ? "Hide" : "Show"}
                                >
                                    {indicatorVisibility.bollinger ? <EyeIcon /> : <EyeOffIcon />}
                                </button>
                                <button
                                    type="button"
                                    className={styles.indicatorActionBtn}
                                    onClick={() => openIndicatorSettings('bollinger')}
                                    title="Settings"
                                >
                                    <GearIcon />
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.indicatorActionBtn} ${styles.trashBtn}`}
                                    onClick={() => removeIndicator('bollinger')}
                                    title="Remove"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        )}
                        {activeIndicators.pivot && (
                            <div className={styles.indicatorWidgetPill}>
                                <span className={styles.indicatorDot} style={{ background: '#FFD600' }} />
                                <span className={styles.indicatorWidgetTitle}>Pivot ({indicatorConfigs.pivot.type})</span>
                                <button
                                    type="button"
                                    className={`${styles.indicatorActionBtn} ${!indicatorVisibility.pivot ? styles.dimmed : ''}`}
                                    onClick={() => toggleIndicatorVisibility('pivot')}
                                    title={indicatorVisibility.pivot ? "Hide" : "Show"}
                                >
                                    {indicatorVisibility.pivot ? <EyeIcon /> : <EyeOffIcon />}
                                </button>
                                <button
                                    type="button"
                                    className={styles.indicatorActionBtn}
                                    onClick={() => openIndicatorSettings('pivot')}
                                    title="Settings"
                                >
                                    <GearIcon />
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.indicatorActionBtn} ${styles.trashBtn}`}
                                    onClick={() => removeIndicator('pivot')}
                                    title="Remove"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sub-Pane Canvas Containers (Positioned Below Main Chart) */}
            {hasSubPanes && (
                <div className={styles.subPanesWrapper}>
                    {activeIndicators.rsi && (
                        <div className={styles.subPaneItem}>
                            <div className={styles.subPaneHeader}>
                                <span className={styles.indicatorDot} style={{ background: indicatorConfigs.rsi.color }} />
                                <span className={styles.subPaneTitle}>RSI ({indicatorConfigs.rsi.length})</span>
                                <div className={styles.subPaneActions}>
                                    <button
                                        type="button"
                                        className={`${styles.indicatorActionBtn} ${!indicatorVisibility.rsi ? styles.dimmed : ''}`}
                                        onClick={() => toggleIndicatorVisibility('rsi')}
                                        title={indicatorVisibility.rsi ? "Hide" : "Show"}
                                    >
                                        {indicatorVisibility.rsi ? <EyeIcon /> : <EyeOffIcon />}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.indicatorActionBtn}
                                        onClick={() => openIndicatorSettings('rsi')}
                                        title="Settings"
                                    >
                                        <GearIcon />
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.indicatorActionBtn} ${styles.trashBtn}`}
                                        onClick={() => removeIndicator('rsi')}
                                        title="Remove"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div ref={rsiContainerRef} className={styles.subPaneCanvas} />
                        </div>
                    )}
                    {activeIndicators.macd && (
                        <div className={styles.subPaneItem}>
                            <div className={styles.subPaneHeader}>
                                <span className={styles.indicatorDot} style={{ background: indicatorConfigs.macd.macdColor }} />
                                <span className={styles.subPaneTitle}>MACD ({indicatorConfigs.macd.fast}, {indicatorConfigs.macd.slow}, {indicatorConfigs.macd.signal})</span>
                                <div className={styles.subPaneActions}>
                                    <button
                                        type="button"
                                        className={`${styles.indicatorActionBtn} ${!indicatorVisibility.macd ? styles.dimmed : ''}`}
                                        onClick={() => toggleIndicatorVisibility('macd')}
                                        title={indicatorVisibility.macd ? "Hide" : "Show"}
                                    >
                                        {indicatorVisibility.macd ? <EyeIcon /> : <EyeOffIcon />}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.indicatorActionBtn}
                                        onClick={() => openIndicatorSettings('macd')}
                                        title="Settings"
                                    >
                                        <GearIcon />
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.indicatorActionBtn} ${styles.trashBtn}`}
                                        onClick={() => removeIndicator('macd')}
                                        title="Remove"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div ref={macdContainerRef} className={styles.subPaneCanvas} />
                        </div>
                    )}
                    {activeIndicators.stochastic && (
                        <div className={styles.subPaneItem}>
                            <div className={styles.subPaneHeader}>
                                <span className={styles.indicatorDot} style={{ background: indicatorConfigs.stochastic.kColor }} />
                                <span className={styles.subPaneTitle}>Stochastic ({indicatorConfigs.stochastic.kPeriod}, {indicatorConfigs.stochastic.dPeriod})</span>
                                <div className={styles.subPaneActions}>
                                    <button
                                        type="button"
                                        className={`${styles.indicatorActionBtn} ${!indicatorVisibility.stochastic ? styles.dimmed : ''}`}
                                        onClick={() => toggleIndicatorVisibility('stochastic')}
                                        title={indicatorVisibility.stochastic ? "Hide" : "Show"}
                                    >
                                        {indicatorVisibility.stochastic ? <EyeIcon /> : <EyeOffIcon />}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.indicatorActionBtn}
                                        onClick={() => openIndicatorSettings('stochastic')}
                                        title="Settings"
                                    >
                                        <GearIcon />
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.indicatorActionBtn} ${styles.trashBtn}`}
                                        onClick={() => removeIndicator('stochastic')}
                                        title="Remove"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div ref={stochContainerRef} className={styles.subPaneCanvas} />
                        </div>
                    )}
                </div>
            )}

            {/* Settings Panel Modal (TradingView Style) */}
            <ChartSettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                draftBullishColor={draftBullishColor}
                setDraftBullishColor={setDraftBullishColor}
                draftBearishColor={draftBearishColor}
                setDraftBearishColor={setDraftBearishColor}
                draftBackgroundColor={draftBackgroundColor}
                setDraftBackgroundColor={setDraftBackgroundColor}
                onReset={handleResetSettings}
                onApply={handleApplySettings}
            />

            {/* Indicator Settings Modal (TradingView Style with Inputs, Style, Defaults, Ok) */}
            <IndicatorSettingsModal
                isOpen={Boolean(editingIndicator)}
                indicatorKey={editingIndicator}
                config={
                    editingIndicator?.startsWith('ma_')
                        ? movingAverages.find(m => m.id === editingIndicator)
                        : (editingIndicator ? indicatorConfigs[editingIndicator] : null)
                }
                onClose={() => setEditingIndicator(null)}
                onSave={saveIndicatorConfig}
                onResetDefaults={resetIndicatorDefaults}
            />

            {/* Indicators & Metrics Modal (TradingView Style Dialog) */}
            <IndicatorsModal
                isOpen={indicatorsModalOpen}
                onClose={() => setIndicatorsModalOpen(false)}
                activeIndicators={activeIndicators}
                movingAverages={movingAverages}
                onAddMA={addMovingAverage}
                onToggleIndicator={(key) => {
                    setActiveIndicators(prev => ({ ...prev, [key]: !prev[key] }));
                }}
                isDark={!isChartLight}
            />
        </div>
    );
});

export default TradingViewChartPane;
