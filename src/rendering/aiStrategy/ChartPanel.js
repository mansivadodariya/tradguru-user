'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import styles from './aiStrategy.module.scss';
import { useTheme } from '@/context/ThemeContext';

// Helper to calculate milliseconds until the next HH:01:00
function getMsUntilNextHourOOne() {
    const now = new Date();
    const next = new Date(now);

    next.setMinutes(1);
    next.setSeconds(0);
    next.setMilliseconds(0);

    // If we are already past the 1st minute of this hour, schedule for the next hour
    if (now.getMinutes() >= 1) {
        next.setHours(now.getHours() + 1);
    }

    const diff = next.getTime() - now.getTime();
    // Fallback safety (if diff is negative or 0, set to 1 hour)
    return diff > 0 ? diff : 3600000;
}

function formatPairCurrency(val, symbol) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    let symUpper = (symbol || '').toUpperCase().replace("/", "");
    if (symUpper.endsWith("JPY")) return val.toFixed(3);
    if (symUpper.includes("XAU") || symUpper.includes("GOLD") || symUpper.includes("XAG")) return val.toFixed(2);
    if (symUpper.length === 6) return val.toFixed(5);
    return val.toFixed(2);
}

function generateFallbackCandles(symbol = 'XAUUSD', timeframe = '1H') {
    const candlesList = [];
    let basePrice = 2700.00;
    let step = 1.5;

    const symUpper = (symbol || '').toUpperCase().replace('/', '');
    if (symUpper.endsWith('JPY')) {
        basePrice = 155.40;
        step = 0.15;
    } else if (symUpper.includes('EUR') || symUpper === 'EURUSD') {
        basePrice = 1.08500;
        step = 0.0008;
    } else if (symUpper.includes('GBP') || symUpper === 'GBPUSD') {
        basePrice = 1.29200;
        step = 0.0009;
    } else if (symUpper.includes('USDCAD')) {
        basePrice = 1.38500;
        step = 0.0008;
    } else if (symUpper.includes('XAU') || symUpper.includes('GOLD')) {
        basePrice = 2735.50;
        step = 2.5;
    }

    const now = Math.floor(Date.now() / 1000);
    const count = 120;
    const interval = timeframe === '5M' ? 300 : timeframe === '15M' ? 900 : timeframe === '1D' ? 86400 : 3600;

    let currentPrice = basePrice - count * 0.15 * step;
    let ema20Val = currentPrice;
    let ema50Val = currentPrice;

    for (let i = 0; i < count; i++) {
        const time = now - (count - i) * interval;
        const change = (Math.random() - 0.47) * step * 2;
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * step * 0.8;
        const low = Math.min(open, close) - Math.random() * step * 0.8;
        const vol = Math.floor(Math.random() * 4000) + 1200;

        currentPrice = close;
        ema20Val = ema20Val * (1 - 2 / 21) + close * (2 / 21);
        ema50Val = ema50Val * (1 - 2 / 51) + close * (2 / 51);
        const supertrend_dir = close >= ema20Val ? 1 : -1;
        const supertrend_val = supertrend_dir === 1 ? low - step * 0.5 : high + step * 0.5;

        candlesList.push({
            time,
            open: Number(open.toFixed(4)),
            high: Number(high.toFixed(4)),
            low: Number(low.toFixed(4)),
            close: Number(close.toFixed(4)),
            tick_volume: vol,
            ema20: Number(ema20Val.toFixed(4)),
            ema50: Number(ema50Val.toFixed(4)),
            supertrend_value: Number(supertrend_val.toFixed(4)),
            supertrend_direction: supertrend_dir,
        });
    }
    return candlesList;
}

export default function ChartPanel({ symbol, strategyId, timeframe = '1H', nearestSupport, nearestResistance, onRefreshNeeded, livePriceInfo }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [priceInfo, setPriceInfo] = useState(null);
    const prevPriceRef = useRef(0);
    const [tickClass, setTickClass] = useState('normal');

    const [hoveredData, setHoveredData] = useState(null);
    const [dotPositions, setDotPositions] = useState(null);
    const chartDataRef = useRef({
        candles: [],
        ema20Map: new Map(),
        ema50Map: new Map(),
        supertrendMap: new Map()
    });

    const refreshTimeoutRef = useRef(null);

    // Fetch and populate chart data
    const fetchAndPlotData = async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);

        const cleanSymbol = symbol.replace('/', '').toUpperCase();
        const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
        const effectiveStrategyId = strategyId || '3e8d2b78-0e86-4fdf-9759-338276db1742';
        let url = `${baseUrl}/api/v1/chart/candles?symbol=${cleanSymbol}&timeframe=${timeframe}&strategy_id=${effectiveStrategyId}`;

        let candlesList = [];

        try {
            const res = await fetch(url, {
                headers: {
                    'accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (res.ok) {
                const data = await res.json();
                candlesList = Array.isArray(data?.candles) ? data.candles : [];
            }
        } catch (err) {
            console.error('Error fetching candles from API:', err);
        }

        try {
            if (candlesList.length === 0) {
                setError('No candle data returned');
                setLoading(false);
                return;
            }

            if (!chartRef.current || !containerRef.current) {
                setLoading(false);
                return;
            }

            const chart = chartRef.current.chart;
            const series = chartRef.current.series;

            // Format candles for Lightweight Charts
            const candleData = [];
            const volumeData = [];
            const ema20Data = [];
            const ema50Data = [];
            const supertrendData = [];

            candlesList.forEach((c) => {
                let ts;
                if (typeof c.time === 'number') {
                    ts = c.time;
                } else {
                    ts = Math.floor(new Date(c.time).getTime() / 1000);
                }

                const o = parseFloat(c.open);
                const h = parseFloat(c.high);
                const l = parseFloat(c.low);
                const cl = parseFloat(c.close);
                const vol = parseInt(c.tick_volume || 0);

                candleData.push({ time: ts, open: o, high: h, low: l, close: cl });

                volumeData.push({
                    time: ts,
                    value: vol,
                    color: cl >= o ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                });

                if (c.ema20 !== null && c.ema20 !== undefined) {
                    ema20Data.push({ time: ts, value: c.ema20 });
                }
                if (c.ema50 !== null && c.ema50 !== undefined) {
                    ema50Data.push({ time: ts, value: c.ema50 });
                }
                if (c.supertrend_value !== null && c.supertrend_value !== undefined) {
                    supertrendData.push({
                        time: ts,
                        value: c.supertrend_value,
                        color: c.supertrend_direction === 1 ? '#10b981' : '#ef4444',
                    });
                }
            });

            // Set data into series
            series.candle.setData(candleData);
            series.volume.setData(volumeData);
            series.ema20.setData(ema20Data);
            series.ema50.setData(ema50Data);
            series.supertrend.setData(supertrendData);

            const ema20Map = new Map();
            const ema50Map = new Map();
            const supertrendMap = new Map();

            ema20Data.forEach(d => ema20Map.set(d.time, d.value));
            ema50Data.forEach(d => ema50Map.set(d.time, d.value));
            supertrendData.forEach(d => supertrendMap.set(d.time, d));

            chartDataRef.current = {
                candles: candleData,
                ema20Map,
                ema50Map,
                supertrendMap
            };

            if (candleData.length > 0) {
                const lastCandle = candleData[candleData.length - 1];
                const prevCandle = candleData.length > 1 ? candleData[candleData.length - 2] : lastCandle;
                const price = lastCandle.close;
                const change = price - prevCandle.close;
                const changePct = prevCandle.close > 0 ? (change / prevCandle.close) * 100 : 0;

                const t = lastCandle.time;
                const lastEma20 = ema20Map.get(t);
                const lastEma50 = ema50Map.get(t);
                const lastSupertrend = supertrendMap.get(t);

                setPriceInfo({
                    open: lastCandle.open,
                    high: lastCandle.high,
                    low: lastCandle.low,
                    close: lastCandle.close,
                    price,
                    change,
                    changePct,
                    ema20: lastEma20,
                    ema50: lastEma50,
                    supertrend: lastSupertrend?.value,
                    supertrendColor: lastSupertrend?.color
                });
            } else {
                setPriceInfo(null);
            }

            // S/R price lines
            // Clear previous price lines
            if (chartRef.current.priceLines) {
                chartRef.current.priceLines.forEach(pl => {
                    try { series.candle.removePriceLine(pl); } catch (e) { }
                });
            }
            chartRef.current.priceLines = [];

            if (nearestSupport !== undefined && nearestSupport !== null) {
                const sLine = series.candle.createPriceLine({
                    price: nearestSupport,
                    color: 'rgba(16, 185, 129, 0.6)',
                    lineWidth: 1,
                    lineStyle: 2, // dashed
                    title: `S: ${nearestSupport.toFixed(4)}`,
                });
                chartRef.current.priceLines.push(sLine);
            }

            if (nearestResistance !== undefined && nearestResistance !== null) {
                const rLine = series.candle.createPriceLine({
                    price: nearestResistance,
                    color: 'rgba(239, 68, 68, 0.6)',
                    lineWidth: 1,
                    lineStyle: 2, // dashed
                    title: `R: ${nearestResistance.toFixed(4)}`,
                });
                chartRef.current.priceLines.push(rLine);
            }

            chart.timeScale().fitContent();

        } catch (err) {
            console.error('Error fetching candles:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initialize Chart
    useEffect(() => {
        if (!containerRef.current) return;

        const isDark = theme === 'dark';
        const rect = containerRef.current.getBoundingClientRect();
        const chart = createChart(containerRef.current, {
            width: rect.width || 600,
            height: rect.height || 450,
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: isDark ? '#94a3b8' : '#64748b',
                fontSize: 11,
                fontFamily: "'Outfit', sans-serif",
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(18, 18, 18, 0.04)' },
                horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(18, 18, 18, 0.04)' },
            },
            crosshair: {
                vertLine: { color: isDark ? 'rgba(96, 165, 250, 0.25)' : '#0B56DB30', width: 1 },
                horzLine: { color: isDark ? 'rgba(96, 165, 250, 0.25)' : '#0B56DB30', width: 1 },
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 18, 18, 0.08)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 10,
                barSpacing: 8,
            },
            rightPriceScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(18, 18, 18, 0.08)',
                scaleMargins: { top: 0.05, bottom: 0.04 },
            },
        });

        // Add series
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b98180',
            wickDownColor: '#ef444480',
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.82, bottom: 0 },
        });

        const ema20Series = chart.addSeries(LineSeries, {
            color: '#f59e0b',
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        const ema50Series = chart.addSeries(LineSeries, {
            color: '#3b82f6',
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        const supertrendSeries = chart.addSeries(LineSeries, {
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        chartRef.current = {
            chart,
            series: {
                candle: candleSeries,
                volume: volumeSeries,
                ema20: ema20Series,
                ema50: ema50Series,
                supertrend: supertrendSeries,
            },
            priceLines: [],
        };

        const handleResize = () => {
            if (containerRef.current && chartRef.current?.chart) {
                const r = containerRef.current.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                    chartRef.current.chart.applyOptions({ width: r.width, height: r.height });
                }
            }
        };
        window.addEventListener('resize', handleResize);

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Subscribe to crosshair hover moves to dynamically show OHLC
        chart.subscribeCrosshairMove((param) => {
            if (!param.time) {
                setHoveredData(null);
                setDotPositions(null);
                return;
            }

            const t = param.time;
            const data = chartDataRef.current;
            if (!data.candles || data.candles.length === 0) return;

            const idx = data.candles.findIndex(c => c.time === t);
            if (idx !== -1) {
                const hoveredCandle = data.candles[idx];
                const prevCandle = idx > 0 ? data.candles[idx - 1] : hoveredCandle;

                const open = hoveredCandle.open;
                const high = hoveredCandle.high;
                const low = hoveredCandle.low;
                const close = hoveredCandle.close;

                const change = close - prevCandle.close;
                const changePct = prevCandle.close > 0 ? (change / prevCandle.close) * 100 : 0;

                const ema20 = data.ema20Map.get(t);
                const ema50 = data.ema50Map.get(t);
                const supertrendObj = data.supertrendMap.get(t);

                setHoveredData({
                    open,
                    high,
                    low,
                    close,
                    change,
                    changePct,
                    isBullish: close >= open,
                    ema20,
                    ema50,
                    supertrend: supertrendObj?.value,
                    supertrendColor: supertrendObj?.color
                });

                // Calculate pixel coordinates for the dots overlay
                const chartInstance = chartRef.current.chart;
                const seriesInstance = chartRef.current.series;
                const timeScale = chartInstance.timeScale();

                const x = timeScale.timeToCoordinate(t);
                const positions = {};
                if (x !== null) {
                    if (ema20 !== undefined && ema20 !== null) {
                        const y = seriesInstance.ema20.priceToCoordinate(ema20);
                        if (y !== null) positions.ema20 = { x, y, color: '#f59e0b' };
                    }
                    if (ema50 !== undefined && ema50 !== null) {
                        const y = seriesInstance.ema50.priceToCoordinate(ema50);
                        if (y !== null) positions.ema50 = { x, y, color: '#3b82f6' };
                    }
                    if (supertrendObj?.value !== undefined && supertrendObj?.value !== null) {
                        const y = seriesInstance.supertrend.priceToCoordinate(supertrendObj.value);
                        if (y !== null) positions.supertrend = { x, y, color: supertrendObj.color };
                    }
                }
                setDotPositions(positions);
            } else {
                setHoveredData(null);
                setDotPositions(null);
            }
        });

        // Fetch data initially
        fetchAndPlotData();

        return () => {
            if (resizeObserver) resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, [symbol, timeframe, theme]);

    // Update data when parameters or support/resistance props change
    useEffect(() => {
        if (chartRef.current) {
            fetchAndPlotData();
        }
    }, [symbol, strategyId, timeframe, nearestSupport, nearestResistance]);

    // Handle dynamic next-hour timeout refresh
    useEffect(() => {
        const scheduleNextRefresh = () => {
            const delay = getMsUntilNextHourOOne();

            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }

            refreshTimeoutRef.current = setTimeout(() => {
                // Trigger refresh callback in parent component
                if (onRefreshNeeded) {
                    onRefreshNeeded();
                }
                // Reschedule for next hour
                scheduleNextRefresh();
            }, delay);
        };

        scheduleNextRefresh();

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [symbol, strategyId, timeframe, onRefreshNeeded]);

    useEffect(() => {
        prevPriceRef.current = 0;
        setTickClass('normal');
        setHoveredData(null);
        setDotPositions(null);
    }, [symbol]);

    const activePrice = (livePriceInfo && livePriceInfo.symbol === symbol) ? livePriceInfo : priceInfo;

    useEffect(() => {
        if (!activePrice) return;
        const currentPrice = activePrice.price;
        const prevPrice = prevPriceRef.current;
        if (prevPrice > 0 && currentPrice !== prevPrice) {
            setTickClass(currentPrice > prevPrice ? 'upTick' : 'downTick');
            const timer = setTimeout(() => setTickClass('normal'), 600);
            return () => clearTimeout(timer);
        }
        prevPriceRef.current = currentPrice;
    }, [activePrice]);

    const displayOpen = hoveredData ? hoveredData.open : activePrice?.open;
    const displayHigh = hoveredData ? hoveredData.high : activePrice?.high;
    const displayLow = hoveredData ? hoveredData.low : activePrice?.low;
    const displayClose = hoveredData ? hoveredData.close : (activePrice?.close || activePrice?.price);
    const displayChange = hoveredData ? hoveredData.change : activePrice?.change;
    const displayChangePct = hoveredData ? hoveredData.changePct : activePrice?.changePct;

    const isBullish = hoveredData
        ? hoveredData.isBullish
        : (displayChange !== undefined ? displayChange >= 0 : true);

    const colorClass = isBullish ? styles.itemBullish : styles.itemBearish;

    const displayEma20 = hoveredData ? hoveredData.ema20 : activePrice?.ema20;
    const displayEma50 = hoveredData ? hoveredData.ema50 : activePrice?.ema50;
    const displaySupertrend = hoveredData ? hoveredData.supertrend : activePrice?.supertrend;
    const displaySupertrendColor = hoveredData ? hoveredData.supertrendColor : activePrice?.supertrendColor;

    return (
        <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
                <div className={styles.chartTitleArea}>
                    <h3>{symbol}</h3>
                    <span className={styles.chartTimeframeBadge}>{timeframe}</span>
                    {activePrice && (
                        <div className={styles.chartHeaderOHLCInfo}>
                            <div className={styles.ohlcItem}>
                                <span className={styles.ohlcLabel}>O</span>
                                <span className={`${styles.ohlcValue} ${colorClass}`}>
                                    {formatPairCurrency(displayOpen, symbol)}
                                </span>
                            </div>
                            <div className={styles.ohlcItem}>
                                <span className={styles.ohlcLabel}>H</span>
                                <span className={`${styles.ohlcValue} ${colorClass}`}>
                                    {formatPairCurrency(displayHigh, symbol)}
                                </span>
                            </div>
                            <div className={styles.ohlcItem}>
                                <span className={styles.ohlcLabel}>L</span>
                                <span className={`${styles.ohlcValue} ${colorClass}`}>
                                    {formatPairCurrency(displayLow, symbol)}
                                </span>
                            </div>
                            <div className={styles.ohlcItem}>
                                <span className={styles.ohlcLabel}>C</span>
                                <span className={`${styles.ohlcValue} ${colorClass}`}>
                                    {formatPairCurrency(displayClose, symbol)}
                                </span>
                            </div>
                            {displayChange !== undefined && displayChangePct !== undefined && (
                                <div className={styles.ohlcItem}>
                                    <span className={`${styles.ohlcValue} ${colorClass}`}>
                                        {displayChange >= 0 ? '+' : ''}{formatPairCurrency(displayChange, symbol)} ({displayChange >= 0 ? '+' : ''}{displayChangePct.toFixed(2)}%)
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>               
            </div>

            <div className={styles.chartCanvasContainer}>
                {loading && (
                    <div className={styles.chartOverlay}>
                        <div className={styles.chartSpinner} />
                        <span>Loading chart...</span>
                    </div>
                )}
                {error && (
                    <div className={styles.chartOverlay}>
                        <span className={styles.chartErrorText}>Error: {error}</span>
                        <button onClick={fetchAndPlotData} className={styles.chartRetryBtn}>Retry</button>
                    </div>
                )}
                <div ref={containerRef} className={styles.chartCanvas} />

                {/* Render Indicator Dots Overlay tracking the crosshair */}
                {dotPositions && (
                    <div className={styles.chartDotsOverlay}>
                        {Object.entries(dotPositions).map(([key, pos]) => (
                            <div
                                key={key}
                                className={styles.chartIndicatorDot}
                                style={{
                                    left: `${pos.x}px`,
                                    top: `${pos.y}px`,
                                    backgroundColor: pos.color
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Chart Legend moved to the end of the chart */}
            <div className={styles.chartLegendContainer}>
                <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendColor} ${styles.ema20}`} />
                        <span>EMA 20 </span>

                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendColor} ${styles.ema50}`} />
                        <span>EMA 50 </span>

                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendColor} ${styles.supertrend}`} />
                        <span>SuperTrend </span>

                    </div>
                </div>
            </div>
        </div>
    );
}
