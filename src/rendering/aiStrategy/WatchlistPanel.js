'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import styles from './aiStrategy.module.scss';
import { SearchIcon } from './icons';
import { useLanguage } from '@/context/LanguageContext';

const PAIRS = [
    "XAU/USD",
    "EUR/USD",
    "GBP/USD",
    "GBP/JPY",
    "EUR/JPY",
    "USD/CAD"
];

function formatPairCurrency(val, symbol) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    let symUpper = (symbol || '').toUpperCase().replace("/", "");
    if (symUpper.endsWith("JPY")) return val.toFixed(3);
    if (symUpper.includes("XAU") || symUpper.includes("GOLD") || symUpper.includes("XAG")) return val.toFixed(2);
    if (symUpper.length === 6) return val.toFixed(5);
    return val.toFixed(2);
}

function getMockInitialData(pair) {
    const symUpper = pair.toUpperCase().replace("/", "");
    let basePrice = 1.25000;
    if (symUpper.endsWith("JPY")) basePrice = 155.250;
    else if (symUpper.includes("XAU") || symUpper.includes("GOLD")) basePrice = 2335.50;
    else if (symUpper === "USDCAD") basePrice = 1.36500;
    else if (symUpper === "USDCHF") basePrice = 0.89500;
    else if (symUpper === "AUDUSD") basePrice = 0.66500;
    else if (symUpper === "NZDUSD") basePrice = 0.61200;

    const multiplier = symUpper.endsWith("JPY") ? 100 : (symUpper.includes("XAU") || symUpper.includes("GOLD")) ? 1000 : 1;
    const now = Math.floor(Date.now() / 1000);
    return {
        "5m": { time: now - 120, open: basePrice - 0.001 * multiplier, high: basePrice + 0.003 * multiplier, low: basePrice - 0.002 * multiplier, close: basePrice, tick_volume: 480 },
        "15m": { time: now - 340, open: basePrice - 0.002 * multiplier, high: basePrice + 0.006 * multiplier, low: basePrice - 0.004 * multiplier, close: basePrice, tick_volume: 1250 },
        "1h": { time: now - 1800, open: basePrice - 0.005 * multiplier, high: basePrice + 0.012 * multiplier, low: basePrice - 0.008 * multiplier, close: basePrice, tick_volume: 5240 },
        "1d": { time: now - 43200, open: basePrice - 0.020 * multiplier, high: basePrice + 0.045 * multiplier, low: basePrice - 0.035 * multiplier, close: basePrice, tick_volume: 42100 }
    };
}

// Stable hash score helper for other pairs
function getHashedScore(pair) {
    const hash = pair.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 50) + 30; // Score between 30 and 80
}

function getScoreSeverityClass(score) {
    if (score >= 70) return styles.scoreBullish;
    if (score >= 45) return styles.scoreNeutral;
    return styles.scoreBearish;
}

function getScoreLabel(score) {
    if (score >= 70) return 'Bullish';
    if (score >= 45) return 'Neutral';
    return 'Bearish';
}

// Separate component for watchlist list item
const WatchlistItem = memo(({ pair, isActive, globalTimeframe, addLog, onClick, actualScore, onPriceUpdate }) => {
    const [liveData, setLiveData] = useState(null);
    const [wsStatus, setWsStatus] = useState('disconnected');
    const [tickClass, setTickClass] = useState('normal');

    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const lastWsTickTime = useRef(0);
    const prevPriceRef = useRef(0);

    // Initial Seed
    useEffect(() => {
        setLiveData(getMockInitialData(pair));
    }, [pair]);

    // WebSocket connection matching LiveCard logic
    useEffect(() => {
        let active = true;

        const connect = () => {
            if (!active) return;
            const pairClean = pair.replace("/", "").toUpperCase();

            let base = process.env.NEXT_PUBLIC_WS_LIVE_URL;
            if (!base || base.includes('localhost') || base.includes('127.0.0.1')) {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                if (backendUrl) {
                    const protocol = backendUrl.startsWith('https://') ? 'wss://' : 'ws://';
                    const host = backendUrl.replace(/^(https?:\/\/)/, '');
                    base = `${protocol}${host}/api/v1/ws/live`;
                } else {
                    base = 'wss://thirsty-spoiler-cartel.ngrok-free.dev/api/v1/ws/live';
                }
            }
            const wsUrl = `${base}?symbol=${pairClean}`;

            setWsStatus('connecting');
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!active) return;
                setWsStatus('connected');
            };

            ws.onmessage = (event) => {
                if (!active) return;
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'initial_state' || payload.type === 'candle_update') {
                        lastWsTickTime.current = Date.now();
                        const parsedData = {};
                        if (payload.data) {
                            for (const tf in payload.data) {
                                const c = payload.data[tf];
                                if (c) {
                                    parsedData[tf] = {
                                        ...c,
                                        time: Number(c.time),
                                        open: Number(c.open),
                                        high: Number(c.high),
                                        low: Number(c.low),
                                        close: Number(c.close),
                                        tick_volume: Number(c.tick_volume || 0)
                                    };
                                }
                            }
                        }
                        setLiveData(parsedData);
                    }
                } catch (err) {
                    console.error(`WS error for ${pair}:`, err);
                }
            };

            ws.onerror = () => { };

            ws.onclose = () => {
                if (!active) return;
                setWsStatus('disconnected');
                reconnectTimerRef.current = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            active = false;
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        };
    }, [pair]);

    // Local price simulator fallback
    useEffect(() => {
        const checkAndSimulate = () => {
            const now = Date.now();
            setLiveData(prevData => {
                if (!prevData) return prevData;

                const nowSec = Math.floor(now / 1000);
                const durations = { "5m": 300, "15m": 900, "1h": 3600, "1d": 86400 };
                const nextData = { ...prevData };

                for (const tf in durations) {
                    const dur = durations[tf];
                    const candle = nextData[tf];
                    if (!candle) continue;

                    const currentCandleStart = nowSec - (nowSec % dur);
                    if (candle.time < currentCandleStart) {
                        const lastClose = candle.close;
                        nextData[tf] = {
                            ...candle,
                            time: currentCandleStart,
                            open: lastClose, high: lastClose, low: lastClose, close: lastClose,
                            tick_volume: 0
                        };
                    }
                }

                const lastTick = lastWsTickTime.current || 0;
                if (now - lastTick > 1500) {
                    const candle = nextData[globalTimeframe];
                    if (candle) {
                        const symUpper = pair.toUpperCase().replace("/", "");
                        const tickSize = symUpper.endsWith("JPY") ? 0.001 : (symUpper.includes("XAU") || symUpper.includes("GOLD")) ? 0.01 : 0.00001;
                        const moveTicks = Math.floor(Math.random() * 5) - 2;
                        if (moveTicks !== 0) {
                            const change = moveTicks * tickSize;
                            const newClose = Number(candle.close) + change;
                            nextData[globalTimeframe] = {
                                ...candle,
                                close: newClose,
                                high: newClose > Number(candle.high) ? newClose : Number(candle.high),
                                low: newClose < Number(candle.low) ? newClose : Number(candle.low)
                            };
                        }
                    }
                }
                return nextData;
            });
        };

        const timer = setInterval(checkAndSimulate, 1000);
        return () => clearInterval(timer);
    }, [pair, globalTimeframe]);

    // Flash animation on ticks
    const candle = liveData ? liveData[globalTimeframe] : null;
    const currentPrice = candle?.close || 0;

    useEffect(() => {
        if (!currentPrice) return;
        const prevPrice = prevPriceRef.current;
        if (prevPrice > 0 && currentPrice !== prevPrice) {
            setTickClass(currentPrice > prevPrice ? 'upTick' : 'downTick');
            const timer = setTimeout(() => setTickClass('normal'), 600);
            return () => clearTimeout(timer);
        }
        prevPriceRef.current = currentPrice;
    }, [currentPrice]);

    useEffect(() => {
        if (isActive && onPriceUpdate && candle) {
            const parsedClose = Number(candle.close);
            const parsedOpen = Number(candle.open);
            const parsedHigh = Number(candle.high);
            const parsedLow = Number(candle.low);
            onPriceUpdate({
                symbol: pair,
                price: parsedClose,
                open: parsedOpen,
                high: parsedHigh,
                low: parsedLow,
                close: parsedClose,
                change: parsedClose - parsedOpen,
                changePct: parsedOpen > 0 ? ((parsedClose - parsedOpen) / parsedOpen) * 100 : 0
            });
        }
    }, [isActive, onPriceUpdate, candle, pair]);

    const changeVal = candle ? candle.close - candle.open : 0;
    const changePct = candle && candle.open > 0 ? (changeVal / candle.open) * 100 : 0;
    const isBullish = changeVal >= 0;

    // Use actual score if available, otherwise fallback to stable hash-based score
    const score = actualScore !== undefined && actualScore !== null ? actualScore : getHashedScore(pair);
    const scoreClass = getScoreSeverityClass(score);
    const scoreLabel = getScoreLabel(score);

    return (
        <div
            onClick={onClick}
            className={`${styles.watchlistItem} ${isActive ? styles.activeItem : ''} ${tickClass === 'upTick' ? styles.itemUpTick : tickClass === 'downTick' ? styles.itemDownTick : ''}`}
        >
            <div className={styles.itemLeft}>
                {/* Technical Score Badge */}
                <div className={`${styles.itemScoreBadge} ${scoreClass}`}>
                    {score}
                </div>
                <div className={styles.itemSymbolMeta}>
                    <span className={styles.itemSymbolName}>{pair}</span>
                    <span className={styles.itemSymbolLabel}>{scoreLabel}</span>
                </div>
            </div>

            <div className={styles.itemRight}>
                <span className={`${styles.itemPrice} ${isBullish ? styles.itemBullish : styles.itemBearish}`}>
                    {candle ? formatPairCurrency(candle.close, pair) : '-'}
                </span>
                <span className={`${styles.itemChangePct} ${isBullish ? styles.itemBullish : styles.itemBearish}`}>
                    {isBullish ? '+' : ''}{changePct.toFixed(2)}%
                </span>
            </div>
        </div>
    );
});

WatchlistItem.displayName = 'WatchlistItem';

export default function WatchlistPanel({ selectedSymbol, onSelectSymbol, globalTimeframe, addLog, activeAnalysis, onActivePriceUpdate }) {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPairs = PAIRS.filter(pair =>
        pair.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.watchlistPanel}>
            <div className={styles.watchlistHeader}>
                <h3>{t('aiStrategy.watchlistTitle', 'Watchlist')}</h3>
                <span className={styles.watchlistCount}>{PAIRS.length} pairs</span>
            </div>

            {/* Search Box */}
            <div className={styles.watchlistSearchContainer}>
                <SearchIcon className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder={t('aiStrategy.searchPairs', 'Search pairs...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.watchlistSearchInput}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className={styles.searchClearBtn}>×</button>
                )}
            </div>

            {/* Pairs List */}
            <div className={styles.watchlistItemsList}>
                {filteredPairs.length > 0 ? (
                    filteredPairs.map(pair => {
                        const isSelected = pair.replace('/', '').toUpperCase() === selectedSymbol.replace('/', '').toUpperCase();

                        // Pass actual score to list item if this is the currently loaded pair's analysis
                        const isAnalysisMatch = activeAnalysis && activeAnalysis.symbol?.replace('/', '').toUpperCase() === pair.replace('/', '').toUpperCase();
                        const scoreVal = isAnalysisMatch ? activeAnalysis.technical_score?.total : null;

                        return (
                            <WatchlistItem
                                key={pair}
                                pair={pair}
                                isActive={isSelected}
                                globalTimeframe={globalTimeframe}
                                addLog={addLog}
                                onClick={() => onSelectSymbol(pair)}
                                actualScore={scoreVal}
                                onPriceUpdate={isSelected ? onActivePriceUpdate : null}
                            />
                        );
                    })
                ) : (
                    <div className={styles.noPairsFound}>No pairs match "{searchQuery}"</div>
                )}
            </div>
        </div>
    );
}
