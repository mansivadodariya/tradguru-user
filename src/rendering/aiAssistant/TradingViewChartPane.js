'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import styles from './aiAssistant.module.scss';
import { toast } from '@/components/toast';
import { useTheme } from '@/context/ThemeContext';
import SymbolIcon from '@/components/SymbolIcon';

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
function generateMockCandles(count = 600, basePrice = 2700, tf = '15m') {
    const candles = [];
    let currentPrice = basePrice;
    const now = Math.floor(Date.now() / 1000);
    const interval = getTimeframeInterval(tf);

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
            open: Number(open.toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            close: Number(close.toFixed(2)),
        });
    }
    return candles;
}

const TradingViewChartPane = forwardRef(function TradingViewChartPane(
    { symbol = 'XAU/USD', onSymbolChange, onAttachScreenshot },
    ref
) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const wsRef = useRef(null);
    const symbolDropdownRef = useRef(null);
    const cameraDropdownRef = useRef(null);

    // Chart Settings State
    const [currentTimeframe, setCurrentTimeframe] = useState('15m');
    const [chartType, setChartType] = useState('candlestick');
    const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
    const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Style Customizations (TradingView Style Defaults)
    const [bullishColor, setBullishColor] = useState('#089981');
    const [bearishColor, setBearishColor] = useState('#f23645');
    const [backgroundColor, setBackgroundColor] = useState(isDark ? '#131722' : '#FFFFFF');
    const [extendedSession, setExtendedSession] = useState(false);
    const [preMarketColor, setPreMarketColor] = useState('#FF6D00');
    const [postMarketColor, setPostMarketColor] = useState('#2979FF');

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
            if (cameraDropdownRef.current && !cameraDropdownRef.current.contains(e.target)) {
                setCameraDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync chart theme colors on app theme change
    useEffect(() => {
        const bg = isDark ? '#131722' : '#FFFFFF';
        const txt = isDark ? '#94A3B8' : '#334155';
        const gridColor = isDark ? 'rgba(42, 46, 57, 0.6)' : 'rgba(0, 0, 0, 0.06)';
        const borderColor = isDark ? 'rgba(42, 46, 57, 0.8)' : 'rgba(0, 0, 0, 0.1)';

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

        const initialBg = isDark ? '#131722' : '#FFFFFF';
        const initialTxt = isDark ? '#94A3B8' : '#334155';
        const initialGrid = isDark ? 'rgba(42, 46, 57, 0.6)' : 'rgba(0, 0, 0, 0.06)';
        const initialBorder = isDark ? 'rgba(42, 46, 57, 0.8)' : 'rgba(0, 0, 0, 0.1)';

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

            // A. Create Volume Histogram Series attached to bottom 18% overlay (TradingView style)
            const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
                priceFormat: { type: 'volume' },
                priceScaleId: 'volume',
            });
            chartRef.current.priceScale('volume').applyOptions({
                scaleMargins: {
                    top: 0.82,    // Volume starts at 82% height (restricted to bottom 18% area)
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

            seriesRef.current = newSeries;

            // Fetch historical candle data via HTTP REST API
            let rawCandles = [];
            try {
                const res = await fetch(
                    `/api/v1/chart/candles?symbol=${activeSymbolClean}&timeframe=${currentTimeframe}`
                );
                if (res.ok) {
                    const json = await res.json();
                    rawCandles = json.candles || json.data || json || [];
                }
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
                rawCandles = generateMockCandles(600, baseVal, currentTimeframe);
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
            }

            // Guarantee loading overlay is hidden once chart series data is loaded
            if (isMounted) setLoading(false);

            // 3. Connect Real-Time Updates (WebSockets)
            let mockCleanup = null;
            try {
                let wsBase = process.env.NEXT_PUBLIC_WS_CANDLES_URL;
                if (!wsBase) {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                    if (backendUrl) {
                        const wsScheme = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
                        const cleanHost = backendUrl.replace(/^https?:\/\//, '');
                        wsBase = `${wsScheme}//${cleanHost}/api/v1/websocket/live-candles`;
                    } else {
                        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        const wsHost = window.location.host || 'localhost:8000';
                        wsBase = `${wsProtocol}//${wsHost}/api/v1/websocket/live-candles`;
                    }
                }
                const wsUrl = `${wsBase}${wsBase.includes('?') ? '&' : '?'}symbol=${activeSymbolClean}&timeframe=${currentTimeframe}`;

                const socket = new WebSocket(wsUrl);
                wsRef.current = socket;

                socket.onopen = () => {
                    if (isMounted) setLoading(false);
                };

                socket.onmessage = (event) => {
                    if (!isMounted) return;
                    setLoading(false);
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === 'candle_update' && payload.data) {
                            const bar = payload.data;
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
                        }
                    } catch {
                        /* ignore parse error */
                    }
                };

                socket.onerror = () => {
                    if (isMounted) setLoading(false);
                    mockCleanup = startMockTickSimulator(isMounted);
                };
            } catch {
                if (isMounted) setLoading(false);
                mockCleanup = startMockTickSimulator(isMounted);
            }

            return () => {
                if (mockCleanup) mockCleanup();
            };
        }

        loadChartData();

        return () => {
            isMounted = false;
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
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

    return (
        <div className={styles.chartPaneContainer}>
            {/* Chart Floating Controls (Top-Left & Top-Right) */}
            <div className={styles.chartHeaderControls}>
                <div className={styles.leftControlsGroup}>
                    {/* Symbol Selector Dropdown (Categorized: MAJOR PAIRS, EURO CROSSES, etc.) */}
                    <div className={styles.controlDropdownWrapper} ref={symbolDropdownRef}>
                        <button
                            type="button"
                            className={styles.symbolSelectorBtn}
                            onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
                        >
                            <SymbolIcon symbol={symbol || 'XAU/USD'} size={18} />
                            <span className={styles.symbolBadge}>{symbol || 'XAU/USD'}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {symbolDropdownOpen && (
                            <div className={styles.dropdownMenuFloating}>
                                <div className={styles.dropdownScrollArea}>
                                    {PAIR_GROUPS.map((group) => (
                                        <div key={group.label} className={styles.categorySection}>
                                            <div className={styles.categoryHeader}>{group.label}</div>
                                            {group.pairs.map((pairStr) => {
                                                const isActive = symbol === pairStr || activeSymbolClean === normalizeSymbol(pairStr);
                                                return (
                                                    <button
                                                        key={pairStr}
                                                        type="button"
                                                        className={`${styles.dropdownMenuItem} ${isActive ? styles.activeItem : ''}`}
                                                        onClick={() => {
                                                            if (onSymbolChange) onSymbolChange(pairStr);
                                                            setSymbolDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className={styles.pairItemInfo}>
                                                            <SymbolIcon symbol={pairStr} size={18} />
                                                            <span>{pairStr}</span>
                                                        </div>
                                                        {isActive && <span className={styles.pairCheck}>✓</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live Real-time Price Badge */}
                    {latestCandle && (
                        <div className={`${styles.headerLivePriceBadge} ${isUp ? styles.badgeUp : styles.badgeDown}`}>
                            <span className={styles.livePriceText}>{formatPrice(currentPrice, symbol)}</span>
                            <span className={styles.liveDirectionTag}>{isUp ? '▲ UP' : '▼ DOWN'}</span>
                            <span className={styles.livePctTag}>{isUp ? `+${percentChange}%` : `${percentChange}%`}</span>
                        </div>
                    )}

                    {/* Timeframe Selector Buttons */}
                    <div className={styles.timeframeBar}>
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.value}
                                type="button"
                                className={`${styles.tfBtn} ${currentTimeframe === tf.value ? styles.activeTf : ''}`}
                                onClick={() => setCurrentTimeframe(tf.value)}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    {/* Chart Type Selector Dropdown */}
                    <div className={styles.controlDropdownWrapper}>
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            className={styles.chartTypeSelect}
                        >
                            {CHART_TYPES.map((ct) => (
                                <option key={ct.value} value={ct.value}>
                                    {ct.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Settings Cog Icon */}
                    <button
                        type="button"
                        className={`${styles.iconControlBtn} ${settingsOpen ? styles.activeControl : ''}`}
                        title="Chart Settings"
                        onClick={() => setSettingsOpen(!settingsOpen)}
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                </div>

                {/* Right Camera Screenshot Action Menu */}
                <div className={styles.controlDropdownWrapper} ref={cameraDropdownRef}>
                    <button
                        type="button"
                        className={styles.iconControlBtn}
                        title="Camera Screenshot Actions"
                        onClick={() => setCameraDropdownOpen(!cameraDropdownOpen)}
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </button>

                    {cameraDropdownOpen && (
                        <div className={`${styles.dropdownMenuFloating} ${styles.rightAligned}`}>
                            <button type="button" className={styles.dropdownMenuItem} onClick={attachChartToChat}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                </svg>
                                <span>Attach to Chat</span>
                            </button>
                            <button type="button" className={styles.dropdownMenuItem} onClick={downloadChartImage}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>Download Image</span>
                            </button>
                            <button type="button" className={styles.dropdownMenuItem} onClick={copyChartImageToClipboard}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>Copy Image</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Chart Container */}
            <div className={styles.chartCanvasArea} ref={containerRef}>
                {/* Floating Live Price Ticker Overlay */}
                {latestCandle && (
                    <div className={styles.livePriceOverlay}>
                        <span className={styles.liveSymbol}>{activeSymbolClean}</span>
                        <span className={styles.livePrice}>{formatPrice(latestCandle.close, activeSymbolClean)}</span>
                        <span className={latestCandle.close >= latestCandle.open ? styles.bullishTag : styles.bearishTag}>
                            {latestCandle.close >= latestCandle.open ? '▲ UP' : '▼ DOWN'}
                        </span>
                        {extendedSession && (
                            <span className={styles.sessionBadge} style={{ background: preMarketColor }}>ETH</span>
                        )}
                    </div>
                )}
            </div>

            {/* Settings Panel Modal (TradingView Style) */}
            {settingsOpen && (
                <div className={styles.settingsModalOverlay} onClick={() => setSettingsOpen(false)}>
                    <div className={styles.settingsModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.settingsHeader}>
                            <h3>Chart Settings</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setSettingsOpen(false)}>
                                ✕
                            </button>
                        </div>

                        <div className={styles.settingsBody}>
                            {/* Section A: Candlestick Styles */}
                            <div className={styles.settingSection}>
                                <h4>Candlestick Colors</h4>
                                <div className={styles.settingRow}>
                                    <label>Bullish (Up) Color</label>
                                    <input
                                        type="color"
                                        value={bullishColor}
                                        onChange={(e) => setBullishColor(e.target.value)}
                                    />
                                </div>
                                <div className={styles.settingRow}>
                                    <label>Bearish (Down) Color</label>
                                    <input
                                        type="color"
                                        value={bearishColor}
                                        onChange={(e) => setBearishColor(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Section B: Chart Styles */}
                            <div className={styles.settingSection}>
                                <h4>Chart Background</h4>
                                <div className={styles.settingRow}>
                                    <label>Background Color</label>
                                    <input
                                        type="color"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                    />
                                </div>
                                <div className={styles.presetColorRow}>
                                    <button type="button" onClick={() => setBackgroundColor('#131722')} style={{ background: '#131722' }}>Dark</button>
                                    <button type="button" onClick={() => setBackgroundColor('#0B0E14')} style={{ background: '#0B0E14' }}>Midnight</button>
                                    <button type="button" onClick={() => setBackgroundColor('#1E222D')} style={{ background: '#1E222D' }}>Slate</button>
                                    <button type="button" onClick={() => setBackgroundColor('#FFFFFF')} style={{ background: '#FFFFFF', color: '#000' }}>Light</button>
                                </div>
                            </div>

                            {/* Section C: Session Hours */}
                            <div className={styles.settingSection}>
                                <h4>Trading Session Hours</h4>
                                <div className={styles.settingRow}>
                                    <label>Trading Hours</label>
                                    <button
                                        type="button"
                                        className={`${styles.toggleBtn} ${extendedSession ? styles.activeToggle : ''}`}
                                        onClick={() => setExtendedSession(!extendedSession)}
                                    >
                                        {extendedSession ? 'Extended Hours (ETH)' : 'Regular Hours (RTH)'}
                                    </button>
                                </div>
                                {extendedSession && (
                                    <>
                                        <div className={styles.settingRow}>
                                            <label>Pre-Market Color</label>
                                            <input
                                                type="color"
                                                value={preMarketColor}
                                                onChange={(e) => setPreMarketColor(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.settingRow}>
                                            <label>Post-Market Color</label>
                                            <input
                                                type="color"
                                                value={postMarketColor}
                                                onChange={(e) => setPostMarketColor(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={styles.settingsFooter}>
                            <button type="button" className={styles.doneBtn} onClick={() => setSettingsOpen(false)}>
                                Apply Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default TradingViewChartPane;
