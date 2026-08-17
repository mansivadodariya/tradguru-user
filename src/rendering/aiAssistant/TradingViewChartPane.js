'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import styles from './aiAssistant.module.scss';
import { toast } from '@/components/toast';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import SymbolIcon from '@/components/SymbolIcon';
import TickerSearchDropdown from '@/components/TickerSearchDropdown';
import { getSymbolPrecision, fetchChartCandlesOnce, subscribeLiveCandles } from '@/lib/chartStore';
import ChartLoaderOverlay from './components/ChartLoaderOverlay';
import ChartSettingsModal from './components/ChartSettingsModal';

export { getSymbolPrecision };
export const fetchChartDataOnce = fetchChartCandlesOnce;

// Symbol Database with Names & Categories (TradingView Ticker Search Style)
export const SYMBOL_DATABASE = [
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
        label: 'OTHER CROSSES',
        pairs: ['AUD/CHF', 'AUD/CAD', 'AUD/NZD', 'CAD/CHF', 'NZD/CHF'],
    },
];

export const ALL_PAIRS = PAIR_GROUPS.flatMap((g) => g.pairs);

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
export function normalizeSymbol(sym) {
    if (!sym) return 'XAUUSD';
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

const TradingViewChartPane = forwardRef(function TradingViewChartPane(
    { symbol = 'XAU/USD', onSymbolChange, onAttachScreenshot },
    ref
) {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const isDark = theme === 'dark';

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

    // Chart Settings State
    const [currentTimeframe, setCurrentTimeframe] = useState('15m');
    const [chartType, setChartType] = useState('candlestick');
    const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
    const [headerSymbolDropdownOpen, setHeaderSymbolDropdownOpen] = useState(false);
    const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
    const [chartTypeDropdownOpen, setChartTypeDropdownOpen] = useState(false);
    const [timeframeDropdownOpen, setTimeframeDropdownOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

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
        toast('Chart settings applied!');
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
        toast('Chart settings reset to default!');
    };

    // Live price tracking state
    const [latestCandle, setLatestCandle] = useState(null);
    const [loading, setLoading] = useState(true);

    const activeSymbolClean = normalizeSymbol(symbol);

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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Render unified Ticker Search Dropdown Menu (TradingView Style)
    const renderSymbolDropdownMenu = (closeMenu) => (
        <TickerSearchDropdown
            selectedSymbol={symbol}
            onSelectSymbol={(newSym) => {
                if (onSymbolChange) onSymbolChange(newSym);
            }}
            onClose={closeMenu}
            position="bottom"
            isDark={!isChartLight}
        />
    );

    // Sync chart theme colors on app theme change
    useEffect(() => {
        const bg = isDark ? '#08090c' : '#FFFFFF';
        const txt = isDark ? '#94A3B8' : '#334155';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
        const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';

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

            // Remove previous series if exists
            if (seriesRef.current) {
                try {
                    chartRef.current.removeSeries(seriesRef.current);
                } catch {
                    /* ignore */
                }
                seriesRef.current = null;
            }
            if (volumeSeriesRef.current) {
                try {
                    chartRef.current.removeSeries(volumeSeriesRef.current);
                } catch {
                    /* ignore */
                }
                volumeSeriesRef.current = null;
            }

            // A. Create Volume Histogram Series attached to bottom 20% overlay (TradingView style)
            const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
                priceFormat: { type: 'volume' },
                priceScaleId: 'volume',
            });
            chartRef.current.priceScale('volume').applyOptions({
                scaleMargins: {
                    top: 0.8,    // Volume starts at 80% height (restricted to bottom 20% area)
                    bottom: 0,
                },
            });
            volumeSeriesRef.current = volumeSeries;

            // Create main series based on chartType selector
            let newSeries;
            if (chartType === 'line') {
                newSeries = chartRef.current.addSeries(LineSeries, {
                    color: '#2979FF',
                    lineWidth: 2,
                });
            } else if (chartType === 'area') {
                newSeries = chartRef.current.addSeries(AreaSeries, {
                    topColor: 'rgba(41, 121, 255, 0.46)',
                    bottomColor: 'rgba(41, 121, 255, 0.0)',
                    lineColor: '#2979FF',
                    lineWidth: 2,
                });
            } else {
                // Default: Candlestick
                newSeries = chartRef.current.addSeries(CandlestickSeries, {
                    upColor: bullishColor,
                    borderUpColor: bullishColor,
                    wickUpColor: bullishColor,
                    downColor: bearishColor,
                    borderDownColor: bearishColor,
                    wickDownColor: bearishColor,
                });
            }

            // Apply Dynamic Symbol Precision (5 decimals for Forex, 3 for JPY, 2 for Gold/Crypto)
            const { precision, minMove } = getSymbolPrecision(activeSymbolClean);
            newSeries.applyOptions({
                priceFormat: {
                    type: 'price',
                    precision: precision,
                    minMove: minMove,
                },
            });

            seriesRef.current = newSeries;

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

            // Ensure candle data is sorted chronologically in ASCENDING order (oldest to newest)
            formattedCandles.sort((a, b) => a.time - b.time);

            if (isMounted && seriesRef.current) {
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
                const last = formattedCandles[formattedCandles.length - 1];
                if (last) setLatestCandle(last);
                chartRef.current.timeScale().applyOptions({
                    barSpacing: 9,
                    rightOffset: 8,
                });
                chartRef.current.timeScale().scrollToRealtime();
                // Immediately turn off loading overlay as soon as series data is set
                setLoading(false);
            }

            // Guarantee loading overlay is hidden once chart series data is loaded
            if (isMounted) setLoading(false);

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
                    <button type="button" className={styles.headerIconButton} title="Chart View">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </button>

                    {/* Live Real-time Price Display (Moved to Top Left Header, No BG) */}
                    {latestCandle && (
                        <div className={`${styles.headerLivePriceBadge} ${isUp ? styles.badgeUp : styles.badgeDown}`}>
                            <span className={styles.livePriceText}>{formatPrice(currentPrice, symbol)}</span>
                            <span className={styles.liveDirectionTag}>{isUp ? '▲ UP' : '▼ DOWN'}</span>
                            <span className={styles.livePctTag}>{isUp ? `+${percentChange}%` : `${percentChange}%`}</span>
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
            <div className={styles.chartCanvasArea} ref={containerRef}>
                {loading && (
                    <ChartLoaderOverlay
                        activeSymbol={activeSymbolClean}
                        currentTimeframe={currentTimeframe}
                    />
                )}
                {/* Inside Chart Floating Control Bar (Red box in user's image) */}
                <div className={styles.insideChartControlPill}>
                    {/* Place 2: Inside Chart Control Pill Symbol Dropdown */}
                    <div className={styles.controlDropdownWrapper} ref={symbolDropdownRef}>
                        <button
                            type="button"
                            className={styles.pillSymbolBtn}
                            onClick={toggleSymbolDropdown}
                        >
                            <SymbolIcon symbol={symbol || 'XAU/USD'} size={18} />
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
                            <div className={styles.dropdownMenuFloating}>
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
                            <div className={styles.dropdownMenuFloating}>
                                {CHART_TYPES.map((ct) => {
                                    const isActive = chartType === ct.value;
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
                                                <span>{ct.label}</span>
                                            </div>
                                            {isActive && <span className={styles.pairCheck}>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className={styles.pillDivider} />

                    {/* 4. Settings Cog Icon Button */}
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
        </div>
    );
});

export default TradingViewChartPane;
