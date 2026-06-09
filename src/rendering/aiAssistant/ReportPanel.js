'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from './aiAssistant.module.scss';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const WIDGET_REGEX = /(\[WIDGET:[A-Z_]+:[A-Z0-9/]+\])/;

const normalizeAssetSymbol = (symbol = '') => String(symbol).replace('/', '').toUpperCase();

const getAssetData = (visualData, symbol) => {
    const assets = visualData?.assets || {};
    const cleanSymbol = normalizeAssetSymbol(symbol);
    return assets[cleanSymbol] || assets[symbol] || assets[symbol?.replace('/', '')];
};

// Remove nearby duplicate levels within a price threshold
const mergeLevels = (levels, threshold = 0.0008) => {
    const result = [];
    levels.forEach(level => {
        const exists = result.some(x => Math.abs(x - level) < threshold);
        if (!exists) result.push(level);
    });
    return result;
};

// Detect local swing lows (support) — 3 neighbors on each side for stricter filtering
const findLocalSupport = (candles) => {
    const levels = [];
    for (let i = 3; i < candles.length - 3; i++) {
        const cur = Number(candles[i].low);
        if (
            cur < Number(candles[i - 1].low) &&
            cur < Number(candles[i - 2].low) &&
            cur < Number(candles[i - 3].low) &&
            cur < Number(candles[i + 1].low) &&
            cur < Number(candles[i + 2].low) &&
            cur < Number(candles[i + 3].low)
        ) levels.push(cur);
    }
    return mergeLevels(levels).slice(0, 3);
};

// Detect local swing highs (resistance) — 3 neighbors on each side for stricter filtering
const findLocalResistance = (candles) => {
    const levels = [];
    for (let i = 3; i < candles.length - 3; i++) {
        const cur = Number(candles[i].high);
        if (
            cur > Number(candles[i - 1].high) &&
            cur > Number(candles[i - 2].high) &&
            cur > Number(candles[i - 3].high) &&
            cur > Number(candles[i + 1].high) &&
            cur > Number(candles[i + 2].high) &&
            cur > Number(candles[i + 3].high)
        ) levels.push(cur);
    }
    return mergeLevels(levels).sort((a, b) => b - a).slice(0, 3);
};

const PriceChart = ({ data, symbol = 'Asset' }) => {
    const [showSR, setShowSR] = useState(true);
    const ohlc = data?.ohlc_data?.ohlc_1h || [];

    const supportLevels = findLocalSupport(ohlc);
    const resistanceLevels = findLocalResistance(ohlc);

    // Candlestick series
    const candleSeries = {
        name: 'Candles',
        type: 'candlestick',
        data: ohlc.map((d) => ({
            x: new Date(d.timestamp),
            y: [parseFloat(d.open), parseFloat(d.high), parseFloat(d.low), parseFloat(d.close)]
        }))
    };

    const findLevelIndex = (level, type) =>
        ohlc.findIndex(c =>
            type === 'support' ? Number(c.low) === level : Number(c.high) === level
        );

    const createLevelLine = (level, idx, type) => {
        const start = Math.max(0, idx - 8);
        const end = Math.min(ohlc.length - 1, idx + 8);
        return {
            name: `${type === 'support' ? 'Support' : 'Resistance'} ${idx + 1}`,
            type: 'line',
            data: [
                { x: new Date(ohlc[start].timestamp), y: level },
                { x: new Date(ohlc[end].timestamp), y: level }
            ]
        };
    };

    const supportSeriesArr = supportLevels.map((level, i) =>
        createLevelLine(level, findLevelIndex(level, 'support'), 'support')
    );

    const resistanceSeriesArr = resistanceLevels.map((level, i) =>
        createLevelLine(level, findLevelIndex(level, 'resistance'), 'resistance')
    );

    const series = [candleSeries, ...(showSR ? [...supportSeriesArr, ...resistanceSeriesArr] : [])];

    // Annotations only when SR visible
    const yAxisAnnotations = showSR ? [
        ...supportLevels.map((val) => ({
            y: val,
            borderColor: '#10b981',
            strokeDashArray: 4,
            label: {
                borderColor: '#10b981',
                style: { color: '#fff', background: '#10b981', fontSize: '11px' },
                text: `S ${val.toFixed(4)}`
            }
        })),
        ...resistanceLevels.map((val) => ({
            y: val,
            borderColor: '#ef4444',
            strokeDashArray: 4,
            label: {
                borderColor: '#ef4444',
                style: { color: '#fff', background: '#ef4444', fontSize: '11px' },
                text: `R ${val.toFixed(4)}`
            }
        }))
    ] : [];

    // Colors: candlestick transparent, supports green, resistances red
    const seriesColors = showSR ? [
        'transparent',
        ...supportLevels.map(() => '#10b981'),
        ...resistanceLevels.map(() => '#ef4444')
    ] : ['transparent'];

    // Stroke widths and dash arrays matching series count
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
            align: 'left',
            margin: 10,
            offsetX: 10,
            style: { color: '#0f5cf2', fontSize: '16px', fontWeight: 700 }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            formatter: (seriesName) => {
                if (seriesName.includes('Support')) return seriesName.replace('Support', 'S');
                if (seriesName.includes('Resistance')) return seriesName.replace('Resistance', 'R');
                return seriesName;
            },
            onItemClick: { toggleDataSeries: true },
            onItemHover: { highlightDataSeries: true }
        },
        theme: { mode: 'light' },
        xaxis: {
            type: 'datetime',
            labels: { style: { colors: '#64748b' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            tooltip: { enabled: true },
            labels: {
                style: { colors: '#64748b' },
                formatter: (val) => val?.toFixed(4) ?? val
            }
        },
        grid: {
            borderColor: 'rgba(15, 92, 242, 0.08)',
            strokeDashArray: 4
        },
        annotations: { yaxis: yAxisAnnotations },
        stroke: {
            width: strokeWidths,
            curve: 'straight',
            dashArray: dashArrays
        },
        colors: seriesColors,
        plotOptions: {
            candlestick: {
                colors: { upward: '#10b981', downward: '#ef4444' },
                wick: { useFillColor: true }
            }
        },
        tooltip: {
            theme: 'light',
            x: { format: 'dd MMM HH:mm' }
        }
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

const SentimentRadar = ({ indicators }) => {
    const data = indicators?.voting_scores || indicators?.['4H']?.voting_scores || {};
    const normalize = (val) => (val + 10) * 5;

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
        chart: {
            type: 'radar',
            toolbar: { show: false },
            animations: { enabled: true, speed: 1000 }
        },
        theme: { mode: 'light' },
        labels: ['Trend', 'Momentum', 'Volatility', 'Overall'],
        yaxis: { show: false, min: 0, max: 100 },
        fill: {
            opacity: 0.45,
            type: 'gradient',
            gradient: {
                shade: 'light',
                gradientToColors: ['#0f5cf2'],
                shadeIntensity: 1,
                type: 'horizontal',
                stops: [0, 100]
            }
        },
        stroke: { width: 2, colors: ['#0f5cf2'] },
        markers: { size: 4, colors: ['#0f5cf2'], strokeWidth: 2, strokeColors: '#fff' },
        plotOptions: {
            radar: {
                polygons: {
                    strokeColors: 'rgba(15, 92, 242, 0.15)',
                    connectorColors: 'rgba(15, 92, 242, 0.1)'
                }
            }
        },
        tooltip: { theme: 'light' }
    };

    return (
        <div className={styles.reportRadar}>
            <Chart options={options} series={series} type="radar" height={280} />
        </div>
    );
};

const Gauge = ({ value, title }) => {
    const options = {
        chart: { type: 'radialBar', sparkline: { enabled: true } },
        plotOptions: {
            radialBar: {
                startAngle: -110,
                endAngle: 110,
                hollow: { size: '65%', background: '#f8fafc' },
                track: {
                    background: '#e2e8f0',
                    strokeWidth: '100%',
                    margin: 5
                },
                dataLabels: {
                    name: { show: true, color: '#0f5cf2', offsetY: -10, fontSize: '12px', fontWeight: 600 },
                    value: {
                        show: true,
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#121212',
                        offsetY: 0,
                        formatter: (val) => val.toFixed(1)
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'horizontal',
                gradientToColors: ['#0f5cf2'],
                stops: [0, 100]
            }
        },
        stroke: { lineCap: 'round' },
        labels: [title]
    };

    return (
        <div className={styles.reportGauge}>
            <Chart options={options} series={[value]} type="radialBar" height={220} />
        </div>
    );
};

const ReportPanel = ({
    fullReport,
    visualData,
    isLoading,
    scrollToTopSignal,
    onDownload,
    inline = true
}) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [scrollToTopSignal, fullReport]);

    const renderWidget = (type, symbol, key) => {
        const assetData = getAssetData(visualData, symbol);

        if (!assetData) {
            return (
                <div key={key} className={styles.reportWidgetMissing}>
                    Visualization data for {symbol} is currently unavailable.
                </div>
            );
        }

        switch (type) {
            case 'CANDLESTICK':
                return <PriceChart key={key} data={assetData} symbol={symbol} />;
            case 'SENTIMENT_RADAR':
                return (
                    <div key={key} className={styles.reportWidget}>
                        <h4 className={styles.reportWidgetTitle}>Market Sentiment: {symbol}</h4>
                        <SentimentRadar indicators={assetData.indicators} />
                    </div>
                );
            case 'RSI_GAUGE':
                return (
                    <Gauge
                        key={key}
                        value={assetData.indicators?.momentum_indicators?.RSI?.value
                            || assetData.indicators?.['1H']?.momentum_indicators?.RSI?.value
                            || 50}
                        title={`${symbol} RSI`}
                    />
                );
            case 'ADX_GAUGE':
                return (
                    <Gauge
                        key={key}
                        value={assetData.indicators?.trend_indicators?.ADX?.value
                            || assetData.indicators?.['1H']?.trend_indicators?.ADX?.value
                            || 25}
                        title={`${symbol} Trend Strength`}
                    />
                );
            default:
                return null;
        }
    };

    const renderContent = () => {
        if (!fullReport) return null;

        const parts = fullReport.split(WIDGET_REGEX);

        return parts.map((part, pIdx) => {
            const widgetMatch = part.match(/\[WIDGET:([A-Z_]+):([A-Z0-9/]+)\]/);
            if (widgetMatch) {
                const [, type, symbol] = widgetMatch;
                return renderWidget(type, symbol, pIdx);
            }

            if (!part.trim()) return null;

            return (
                <div key={pIdx} className={styles.reportMarkdown}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {part}
                    </ReactMarkdown>
                </div>
            );
        });
    };

    // Inline mode: renders report content directly without the panel chrome
    if (inline) {
        return (
            <div className={styles.inlineReportContainer}>
                <h3>{fullReport ? 'Analysis Center' : 'No Report Selected'}</h3>

                {isLoading ? (
                    <div className={styles.reportLoading}>Analyzing market data...</div>
                ) : fullReport ? (
                    <div className={styles.reportContent}>{renderContent()}</div>
                ) : (
                    <div className={styles.reportEmpty}>
                        <p className={styles.reportEmptyTitle}>Ready for Analysis</p>
                        <p>Select a report from your chat or start a new conversation to generate a market thesis.</p>
                    </div>
                )}
                {onDownload && (
                    <div className={styles.inlineDownloadRow}>
                        <button type="button" className={styles.inlineDownloadBtn} onClick={onDownload}>
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
                {fullReport ? (
                    <button type="button" className={styles.reportDownloadBtn} onClick={onDownload}>
                        Download Document
                    </button>
                ) : null}
            </div>
            <div className={styles.reportPanelBody} ref={scrollRef}>
                {isLoading ? (
                    <div className={styles.reportLoading}>Analyzing market data...</div>
                ) : fullReport ? (
                    <div className={styles.reportContent}>{renderContent()}</div>
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
