'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import styles from './aiStrategyPage.module.scss';

// Helper to generate realistic candlestick data for demo/preview
function generateCandleData(symbol, timeframe) {
    const candles = [];
    const volumes = [];
    const ema20 = [];
    const ema50 = [];

    let basePrice = 2345.50;
    let step = 1.25;
    let isJpy = false;
    let isForex = false;

    const symUpper = symbol.toUpperCase().replace('/', '');
    if (symUpper.endsWith('JPY')) {
        basePrice = 155.40;
        step = 0.15;
        isJpy = true;
    } else if (symUpper === 'EURUSD') {
        basePrice = 1.08500;
        step = 0.0008;
        isForex = true;
    } else if (symUpper === 'GBPUSD') {
        basePrice = 1.29200;
        step = 0.0009;
        isForex = true;
    }

    const now = Math.floor(Date.now() / 1000);
    const count = 120;
    const interval = timeframe === '5M' ? 300 : timeframe === '15M' ? 900 : timeframe === '1D' ? 86400 : 3600;

    let currentPrice = basePrice - count * 0.2 * step;
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

        // Exponential moving averages
        ema20Val = ema20Val * (1 - 2 / 21) + close * (2 / 21);
        ema50Val = ema50Val * (1 - 2 / 51) + close * (2 / 51);

        const formattedTime = time;

        candles.push({
            time: formattedTime,
            open: parseFloat(open.toFixed(isForex ? 5 : isJpy ? 3 : 2)),
            high: parseFloat(high.toFixed(isForex ? 5 : isJpy ? 3 : 2)),
            low: parseFloat(low.toFixed(isForex ? 5 : isJpy ? 3 : 2)),
            close: parseFloat(close.toFixed(isForex ? 5 : isJpy ? 3 : 2)),
        });

        volumes.push({
            time: formattedTime,
            value: vol,
            color: close >= open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
        });

        ema20.push({
            time: formattedTime,
            value: parseFloat(ema20Val.toFixed(isForex ? 5 : isJpy ? 3 : 2)),
        });

        ema50.push({
            time: formattedTime,
            value: parseFloat(ema50Val.toFixed(isForex ? 5 : isJpy ? 3 : 2)),
        });
    }

    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[0];
    const changeAmt = lastCandle.close - prevCandle.open;
    const changePct = (changeAmt / prevCandle.open) * 100;

    return {
        candles,
        volumes,
        ema20,
        ema50,
        currentPrice: lastCandle.close,
        changeAmt,
        changePct,
        high: Math.max(...candles.map(c => c.high)),
        low: Math.min(...candles.map(c => c.low)),
        isForex,
        isJpy,
    };
}

export default function InteractiveCandlestickChart() {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef({});

    const [symbol, setSymbol] = useState('XAU/USD');
    const [timeframe, setTimeframe] = useState('1H');
    const [chartData, setChartData] = useState(null);
    const [hoveredCandle, setHoveredCandle] = useState(null);

    const initAndRenderChart = useCallback(() => {
        if (!containerRef.current) return;

        // Clear existing chart container
        if (chartRef.current) {
            chartRef.current.chart.remove();
            chartRef.current = null;
        }

        const data = generateCandleData(symbol, timeframe);
        setChartData(data);

        const width = containerRef.current.clientWidth || 800;
        const height = 440;

        // White Theme Chart Setup
        const chart = createChart(containerRef.current, {
            width,
            height,
            layout: {
                background: { type: 'solid', color: '#FFFFFF' },
                textColor: '#475569',
                fontSize: 12,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: 'rgba(0, 0, 0, 0.05)' },
                horzLines: { color: 'rgba(0, 0, 0, 0.05)' },
            },
            crosshair: {
                vertLine: { color: '#0047FF', width: 1, style: 3 },
                horzLine: { color: '#0047FF', width: 1, style: 3 },
            },
            timeScale: {
                borderColor: '#E2E8F0',
                timeVisible: true,
                secondsVisible: false,
                barSpacing: 9,
                rightOffset: 12,
            },
            rightPriceScale: {
                borderColor: '#E2E8F0',
                scaleMargins: { top: 0.1, bottom: 0.25 },
            },
        });

        // Candlestick Series
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#EF4444',
            borderUpColor: '#10B981',
            borderDownColor: '#EF4444',
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
        });
        candleSeries.setData(data.candles);

        // Volume Series
        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.75, bottom: 0 },
        });
        volumeSeries.setData(data.volumes);

        // EMA 20 Series
        const ema20Series = chart.addSeries(LineSeries, {
            color: '#2563EB',
            lineWidth: 2,
            title: 'EMA 20',
        });
        ema20Series.setData(data.ema20);

        // EMA 50 Series
        const ema50Series = chart.addSeries(LineSeries, {
            color: '#9333EA',
            lineWidth: 2,
            title: 'EMA 50',
        });
        ema50Series.setData(data.ema50);

        // Add Support and Resistance Lines
        const supPrice = data.low + (data.high - data.low) * 0.2;
        const resPrice = data.high - (data.high - data.low) * 0.15;

        candleSeries.createPriceLine({
            price: supPrice,
            color: 'rgba(16, 185, 129, 0.8)',
            lineWidth: 1,
            lineStyle: 2,
            title: `Support: ${supPrice.toFixed(data.isForex ? 5 : 2)}`,
        });

        candleSeries.createPriceLine({
            price: resPrice,
            color: 'rgba(239, 68, 68, 0.8)',
            lineWidth: 1,
            lineStyle: 2,
            title: `Resistance: ${resPrice.toFixed(data.isForex ? 5 : 2)}`,
        });

        chart.timeScale().fitContent();

        // Crosshair move handler
        chart.subscribeCrosshairMove((param) => {
            if (!param || !param.time || !param.seriesData) {
                setHoveredCandle(null);
                return;
            }
            const candle = param.seriesData.get(candleSeries);
            if (candle) {
                setHoveredCandle(candle);
            }
        });

        chartRef.current = { chart, candleSeries, volumeSeries };
        seriesRef.current = { candleSeries, volumeSeries, ema20Series, ema50Series };

        const handleResize = () => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.chart.applyOptions({
                    width: containerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [symbol, timeframe]);

    useEffect(() => {
        initAndRenderChart();
    }, [initAndRenderChart]);

    // Zoom Controls
    const handleZoomIn = () => {
        if (chartRef.current) {
            chartRef.current.chart.timeScale().zoomIn();
        }
    };

    const handleZoomOut = () => {
        if (chartRef.current) {
            chartRef.current.chart.timeScale().zoomOut();
        }
    };

    const handleResetZoom = () => {
        if (chartRef.current) {
            chartRef.current.chart.timeScale().fitContent();
        }
    };

    const decimals = chartData?.isForex ? 5 : chartData?.isJpy ? 3 : 2;

    return (
        <div className={styles.chartWrapperCard}>
            {/* Header Controls Bar */}
            <div className={styles.chartHeaderBar}>
                <div className={styles.symbolInfoGroup}>
                    <div className={styles.symbolSelector}>
                        {['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY'].map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`${styles.pairBtn} ${symbol === s ? styles.activePair : ''}`}
                                onClick={() => setSymbol(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {chartData && (
                        <div className={styles.priceMeta}>
                            <span className={styles.livePrice}>
                                ${chartData.currentPrice.toFixed(decimals)}
                            </span>
                            <span className={`${styles.changeBadge} ${chartData.changeAmt >= 0 ? styles.green : styles.red}`}>
                                {chartData.changeAmt >= 0 ? '+' : ''}
                                {chartData.changeAmt.toFixed(decimals)} ({chartData.changePct.toFixed(2)}%)
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.rightControlsGroup}>
                    {/* Timeframe selector */}
                    <div className={styles.tfSelector}>
                        {['5M', '15M', '1H', '1D'].map((tf) => (
                            <button
                                key={tf}
                                type="button"
                                className={`${styles.tfBtn} ${timeframe === tf ? styles.activeTf : ''}`}
                                onClick={() => setTimeframe(tf)}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Zoom in / Zoom out / Fit buttons */}
                    <div className={styles.zoomButtonsGroup}>
                        <button type="button" onClick={handleZoomIn} title="Zoom In (+)" className={styles.zoomBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>
                        <button type="button" onClick={handleZoomOut} title="Zoom Out (-)" className={styles.zoomBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>
                        <button type="button" onClick={handleResetZoom} title="Fit Chart" className={styles.zoomBtnText}>
                            Fit View
                        </button>
                    </div>
                </div>
            </div>

            {/* OHLC Bar Overlay */}
            {hoveredCandle && (
                <div className={styles.ohlcOverlay}>
                    <span>O: <strong>{hoveredCandle.open?.toFixed(decimals)}</strong></span>
                    <span>H: <strong>{hoveredCandle.high?.toFixed(decimals)}</strong></span>
                    <span>L: <strong>{hoveredCandle.low?.toFixed(decimals)}</strong></span>
                    <span>C: <strong>{hoveredCandle.close?.toFixed(decimals)}</strong></span>
                </div>
            )}

            {/* Interactive Canvas Container */}
            <div ref={containerRef} className={styles.canvasContainer} />

            {/* Chart Footer Indicator Legend */}
            <div className={styles.chartFooterLegend}>
                <div className={styles.legendItem}>
                    <span className={styles.colorDot} style={{ background: '#10B981' }} />
                    <span>Bullish Candle</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.colorDot} style={{ background: '#EF4444' }} />
                    <span>Bearish Candle</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.colorDot} style={{ background: '#2563EB' }} />
                    <span>EMA 20</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.colorDot} style={{ background: '#9333EA' }} />
                    <span>EMA 50</span>
                </div>
                <span className={styles.zoomHintText}>Scroll or pinch canvas to zoom in/out • Drag to pan</span>
            </div>
        </div>
    );
}
