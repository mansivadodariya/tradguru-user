'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import styles from './aiStrategy.module.scss';

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

export default function ChartPanel({ symbol, strategyId, timeframe = 'H1', nearestSupport, nearestResistance, onRefreshNeeded }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const refreshTimeoutRef = useRef(null);

    // Fetch and populate chart data
    const fetchAndPlotData = async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);

        const cleanSymbol = symbol.replace('/', '').toUpperCase();
        let url = `/api/v1/chart/candles?symbol=${cleanSymbol}&timeframe=${timeframe}`;
        if (strategyId) {
            url += `&strategy_id=${strategyId}`;
        }

        try {
            const res = await fetch(url, {
                headers: { 
                    'accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (!res.ok) throw new Error('Failed to fetch candles data');
            const data = await res.json();
            
            const candlesList = data.candles || [];
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
            const ema200Data = [];
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
                if (c.ema200 !== null && c.ema200 !== undefined) {
                    ema200Data.push({ time: ts, value: c.ema200 });
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
            series.ema200.setData(ema200Data);
            series.supertrend.setData(supertrendData);

            // S/R price lines
            // Clear previous price lines
            if (chartRef.current.priceLines) {
                chartRef.current.priceLines.forEach(pl => {
                    try { series.candle.removePriceLine(pl); } catch (e) {}
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

        const rect = containerRef.current.getBoundingClientRect();
        const chart = createChart(containerRef.current, {
            width: rect.width || 600,
            height: 450,
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#64748b',
                fontSize: 11,
                fontFamily: "'Outfit', sans-serif",
            },
            grid: {
                vertLines: { color: 'rgba(18, 18, 18, 0.04)' },
                horzLines: { color: 'rgba(18, 18, 18, 0.04)' },
            },
            crosshair: {
                vertLine: { color: '#0B56DB30', width: 1 },
                horzLine: { color: '#0B56DB30', width: 1 },
            },
            timeScale: {
                borderColor: 'rgba(18, 18, 18, 0.08)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 10,
                barSpacing: 8,
            },
            rightPriceScale: {
                borderColor: 'rgba(18, 18, 18, 0.08)',
                scaleMargins: { top: 0.1, bottom: 0.2 },
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

        const ema200Series = chart.addSeries(LineSeries, {
            color: '#a855f7',
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
                ema200: ema200Series,
                supertrend: supertrendSeries,
            },
            priceLines: [],
        };

        const handleResize = () => {
            if (containerRef.current && chartRef.current) {
                const r = containerRef.current.getBoundingClientRect();
                chartRef.current.chart.applyOptions({ width: r.width, height: 450 });
            }
        };
        window.addEventListener('resize', handleResize);

        // Fetch data initially
        fetchAndPlotData();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, [symbol, timeframe]);

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

    return (
        <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
                <div className={styles.chartTitleArea}>
                    <h3>{symbol}</h3>
                    <span className={styles.chartTimeframeBadge}>{timeframe}</span>
                </div>
                
                {/* Custom Chart Legend */}
                <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendColor} ${styles.ema20}`} />
                        <span>EMA 20</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendColor} ${styles.ema50}`} />
                        <span>EMA 50</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendColor} ${styles.ema200}`} />
                        <span>EMA 200</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendColor} ${styles.supertrend}`} />
                        <span>SuperTrend</span>
                    </div>
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
            </div>
        </div>
    );
}
