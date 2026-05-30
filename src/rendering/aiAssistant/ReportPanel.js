'use client';

import React, { useRef, useEffect } from 'react';
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

const PriceChart = ({ data, symbol = 'Asset' }) => {
    const ohlc = data?.ohlc_data?.ohlc_1h || [];
    const trendlines = data?.indicators?.trendlines;

    const series = [{
        name: 'Candles',
        data: ohlc.map((d) => ({
            x: new Date(d.timestamp),
            y: [
                parseFloat(d.open),
                parseFloat(d.high),
                parseFloat(d.low),
                parseFloat(d.close)
            ]
        }))
    }];

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
                formatter: (val) => val.toFixed(4)
            }
        },
        grid: {
            borderColor: 'rgba(15, 92, 242, 0.08)',
            strokeDashArray: 4
        },
        annotations: trendlines ? {
            yaxis: [
                {
                    y: trendlines.support?.intercept,
                    borderColor: '#10b981',
                    label: {
                        borderColor: '#10b981',
                        style: { color: '#fff', background: '#10b981' },
                        text: 'Support'
                    }
                },
                {
                    y: trendlines.resistance?.intercept,
                    borderColor: '#ef4444',
                    label: {
                        borderColor: '#ef4444',
                        style: { color: '#fff', background: '#ef4444' },
                        text: 'Resistance'
                    }
                }
            ]
        } : {},
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
    onDownload
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
