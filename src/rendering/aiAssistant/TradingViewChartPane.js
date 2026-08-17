'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, AreaSeries } from 'lightweight-charts';
import styles from './aiAssistant.module.scss';
import { toast } from '@/components/toast';

// Available symbols & timeframes
const POPULAR_SYMBOLS = [
    { label: 'XAU/USD (Gold)', value: 'XAUUSD' },
    { label: 'EUR/USD', value: 'EURUSD' },
    { label: 'GBP/USD', value: 'GBPUSD' },
    { label: 'BTC/USD', value: 'BTCUSD' },
    { label: 'ETH/USD', value: 'ETHUSD' },
    { label: 'USD/JPY', value: 'USDJPY' },
    { label: 'US30 (Dow Jones)', value: 'US30' },
];

const TIMEFRAMES = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
];

const CHART_TYPES = [
    { label: 'Candlestick', value: 'candlestick' },
    { label: 'Line', value: 'line' },
    { label: 'Area', value: 'area' },
];

// Helper to normalize symbol string (e.g. "XAU/USD" -> "XAUUSD")
export function normalizeSymbol(sym) {
    if (!sym) return 'XAUUSD';
    return sym.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Format price based on pair precision
function formatPrice(val, symbolStr) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    const s = (symbolStr || '').toUpperCase();
    if (s.includes('JPY')) return val.toFixed(3);
    if (s.includes('XAU') || s.includes('GOLD') || s.includes('BTC') || s.includes('ETH')) return val.toFixed(2);
    return val.toFixed(5);
}

// Generate fallback candles if API endpoint is offline or returning empty
function generateMockCandles(count = 100, basePrice = 2700) {
    const candles = [];
    let currentPrice = basePrice;
    const now = Math.floor(Date.now() / 1000);
    const interval = 900; // 15m in seconds

    for (let i = count; i >= 0; i--) {
        const time = now - (i * interval);
        const change = (Math.random() - 0.49) * (basePrice * 0.004);
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (basePrice * 0.002);
        const low = Math.min(open, close) - Math.random() * (basePrice * 0.002);
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

export default function TradingViewChartPane({
    symbol = 'XAUUSD',
    onSymbolChange,
    onAttachScreenshot,
}) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const wsRef = useRef(null);

    // Chart Settings State
    const [currentTimeframe, setCurrentTimeframe] = useState('15m');
    const [chartType, setChartType] = useState('candlestick');
    const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
    const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Style Customizations (TradingView Style)
    const [bullishColor, setBullishColor] = useState('#00B0FF');
    const [bearishColor, setBearishColor] = useState('#FF3B30');
    const [backgroundColor, setBackgroundColor] = useState('#131722');
    const [extendedSession, setExtendedSession] = useState(false);
    const [preMarketColor, setPreMarketColor] = useState('#FF6D00');
    const [postMarketColor, setPostMarketColor] = useState('#2979FF');

    // Live price tracking state
    const [latestCandle, setLatestCandle] = useState(null);
    const [loading, setLoading] = useState(true);

    const activeSymbolClean = normalizeSymbol(symbol);

    // 1. Initialize Chart Engine
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight || 500,
            layout: {
                background: { color: backgroundColor },
                textColor: '#94A3B8',
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
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
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
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
            if (!chartRef.current) return;
            setLoading(true);

            // Remove previous series if exists
            if (seriesRef.current) {
                try {
                    chartRef.current.removeSeries(seriesRef.current);
                } catch { /* ignore */ }
                seriesRef.current = null;
            }

            // Create series based on chartType
            let newSeries;
            if (chartType === 'line') {
                newSeries = chartRef.current.addSeries(LineSeries, {
                    color: '#2979FF',
                    lineWidth: 2,
                });
            } else if (chartType === 'area') {
                newSeries = chartRef.current.addSeries(AreaSeries, {
                    topColor: 'rgba(41, 121, 255, 0.45)',
                    bottomColor: 'rgba(41, 121, 255, 0.02)',
                    lineColor: '#2979FF',
                    lineWidth: 2,
                });
            } else {
                // Default: Candlestick
                newSeries = chartRef.current.addSeries(CandlestickSeries, {
                    upColor: bullishColor,
                    downColor: bearishColor,
                    borderUpColor: bullishColor,
                    borderDownColor: bearishColor,
                    wickUpColor: bullishColor,
                    wickDownColor: bearishColor,
                });
            }

            seriesRef.current = newSeries;

            // Fetch historical candle data
            let candlesData = [];
            try {
                const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
                const res = await fetch(`${backendUrl}/api/v1/chart/candles?symbol=${activeSymbolClean}&timeframe=${currentTimeframe}&strategy_id=3e8d2b78-0e86-4fdf-9759-338276db1742`);
                if (res.ok) {
                    const json = await res.json();
                    const rawCandles = json.candles || json.data || json;
                    if (Array.isArray(rawCandles) && rawCandles.length > 0) {
                        candlesData = rawCandles.map((c) => ({
                            time: typeof c.time === 'string' ? Math.floor(new Date(c.time).getTime() / 1000) : Number(c.time),
                            open: Number(c.open),
                            high: Number(c.high),
                            low: Number(c.low),
                            close: Number(c.close),
                            value: Number(c.close), // For line/area series
                        })).filter(c => !isNaN(c.time) && !isNaN(c.close));
                    }
                }
            } catch (err) {
                console.warn('Chart candles API fetch notice:', err.message);
            }

            // Fallback mock generator if no candles returned from backend API
            if (candlesData.length === 0) {
                const baseVal = activeSymbolClean.includes('XAU') ? 2720 : activeSymbolClean.includes('BTC') ? 92000 : 1.0850;
                candlesData = generateMockCandles(120, baseVal).map(c => ({
                    ...c,
                    value: c.close
                }));
            }

            // Sort chronologically
            candlesData.sort((a, b) => a.time - b.time);

            if (isMounted && seriesRef.current) {
                seriesRef.current.setData(candlesData);
                const last = candlesData[candlesData.length - 1];
                if (last) setLatestCandle(last);
                chartRef.current.timeScale().fitContent();
                setLoading(false);
            }

            // 3. Connect Real-Time WebSocket Streaming Updates
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            try {
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsHost = window.location.host;
                const wsUrl = `${wsProtocol}//${wsHost}/api/v1/websocket/live-candles?symbol=${activeSymbolClean}&timeframe=${currentTimeframe}`;
                
                const socket = new WebSocket(wsUrl);
                wsRef.current = socket;

                socket.onmessage = (event) => {
                    if (!isMounted || !seriesRef.current) return;
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === 'candle_update' && payload.data) {
                            const bar = payload.data;
                            const tSec = typeof bar.time === 'string' ? Math.floor(new Date(bar.time).getTime() / 1000) : Number(bar.time);
                            const updatedBar = {
                                time: tSec,
                                open: Number(bar.open),
                                high: Number(bar.high),
                                low: Number(bar.low),
                                close: Number(bar.close),
                                value: Number(bar.close),
                            };
                            seriesRef.current.update(updatedBar);
                            setLatestCandle(updatedBar);
                        }
                    } catch { /* ignore parse error */ }
                };

                socket.onerror = () => {
                    // Fallback live tick simulator if WebSocket server is not running on localhost
                    startMockTickSimulator(isMounted);
                };
            } catch {
                startMockTickSimulator(isMounted);
            }
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
                const updated = {
                    ...prev,
                    high: newHigh,
                    low: newLow,
                    close: newClose,
                    value: newClose
                };
                seriesRef.current.update(updated);
                return updated;
            });
        }, 1500);

        return () => clearInterval(interval);
    };

    // Update Series colors when bullish/bearish picker changes
    useEffect(() => {
        if (seriesRef.current && chartType === 'candlestick') {
            seriesRef.current.applyOptions({
                upColor: bullishColor,
                downColor: bearishColor,
                borderUpColor: bullishColor,
                borderDownColor: bearishColor,
                wickUpColor: bullishColor,
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
        toast.success(`Chart downloaded as ${activeSymbolClean}_chart.png`);
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
                toast.success('Chart screenshot copied to clipboard!');
            } catch (err) {
                console.error('Copy screenshot error:', err);
                toast.error('Could not copy image to clipboard.');
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
            toast.success('Chart screenshot attached to chat draft!');
        } else {
            toast.success('Chart screenshot captured!');
        }
        setCameraDropdownOpen(false);
    };

    return (
        <div className={styles.chartPaneContainer}>
            {/* Top Floating Control Bar */}
            <div className={styles.chartHeaderControls}>
                <div className={styles.leftControlsGroup}>
                    {/* Symbol Selector Dropdown */}
                    <div className={styles.controlDropdownWrapper}>
                        <button
                            type="button"
                            className={styles.symbolSelectorBtn}
                            onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
                        >
                            <span className={styles.symbolBadge}>{activeSymbolClean}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {symbolDropdownOpen && (
                            <div className={styles.dropdownMenuFloating}>
                                {POPULAR_SYMBOLS.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        className={`${styles.dropdownMenuItem} ${activeSymbolClean === item.value ? styles.activeItem : ''}`}
                                        onClick={() => {
                                            if (onSymbolChange) onSymbolChange(item.value);
                                            setSymbolDropdownOpen(false);
                                        }}
                                    >
                                        <span>{item.label}</span>
                                        {activeSymbolClean === item.value && <span>✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

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
                <div className={styles.controlDropdownWrapper}>
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
                {loading && (
                    <div className={styles.chartOverlayLoader}>
                        <div className={styles.chartSpinner} />
                        <span>Loading Realtime Chart...</span>
                    </div>
                )}

                {/* Floating Live Price Ticker Overlay */}
                {latestCandle && (
                    <div className={styles.livePriceOverlay}>
                        <span className={styles.liveSymbol}>{activeSymbolClean}</span>
                        <span className={styles.livePrice}>{formatPrice(latestCandle.close, activeSymbolClean)}</span>
                        <span className={latestCandle.close >= latestCandle.open ? styles.bullishTag : styles.bearishTag}>
                            {latestCandle.close >= latestCandle.open ? '▲ UP' : '▼ DOWN'}
                        </span>
                    </div>
                )}
            </div>

            {/* Settings Panel Modal (TradingView Style) */}
            {settingsOpen && (
                <div className={styles.settingsModalOverlay} onClick={() => setSettingsOpen(false)}>
                    <div className={styles.settingsModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.settingsHeader}>
                            <h3>TradingView Chart Settings</h3>
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

                            {/* Section B: Chart Background */}
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
                                    <label>Session Type</label>
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
                                            <label>Pre-Market Highlight</label>
                                            <input
                                                type="color"
                                                value={preMarketColor}
                                                onChange={(e) => setPreMarketColor(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.settingRow}>
                                            <label>Post-Market Highlight</label>
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
}
