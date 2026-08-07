'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './aiStrategy.module.scss';
import Loader from '@/components/loader';
import { getStoredUserId } from '@/lib/authSession';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import StrategyDropdown from './StrategyDropdown';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import {
    pairs,
    formatPairCurrency,
    getMockInitialData,
    getMockStrategySignal,
    formatCurrency,
    formatVolume,
    MOCK_LIVE_DATA,
    MOCK_STRATEGY_SIGNAL,
    MOCK_SCANNER_DATA
} from './strategyUtils';
import {
    RadarIcon,
    ArrowRightIcon,
    VolumeIcon,
    RiskRewardIcon
} from './icons';

const WatchlistPanel = dynamic(() => import('./WatchlistPanel'), { ssr: false });
const ChartPanel = dynamic(() => import('./ChartPanel'), { ssr: false });
const AnalysisPanel = dynamic(() => import('./AnalysisPanel'), { ssr: false });


export default function AiStrategy({ initialTab = 'live' }) {
    const { t } = useLanguage();
    const activeTab = initialTab;
    const router = useRouter();
    const [symbol, setSymbol] = useState('XAUUSD');
    const [symbolInput, setSymbolInput] = useState('XAUUSD');
    const [timeframe, setTimeframe] = useState('1h'); // '5m', '15m', '1h', '1d'

    // 3-panel layout state variables
    const [selectedSymbol, setSelectedSymbol] = useState('XAU/USD');
    const [selectedSymbolPriceInfo, setSelectedSymbolPriceInfo] = useState(null);
    const [selectedStrategyId, setSelectedStrategyId] = useState('');
    const [activeAnalysis, setActiveAnalysis] = useState(null);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const [wsStatus, setWsStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
    
    // Strategy tab states
    const [selectedStrategySymbol, setSelectedStrategySymbol] = useState('XAUUSD');
    const [activeSignals, setActiveSignals] = useState({});
    const [strategyAnalysis, setStrategyAnalysis] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [showPairSelector, setShowPairSelector] = useState(true);

    // Global Timeframe (live tab)
    const [globalTimeframe, setGlobalTimeframe] = useState('1h');

    const [mounted, setMounted] = useState(false);

    // Live WebSockets console logs
    const [logs, setLogs] = useState([]);

    const addLog = useCallback((message, isSystem = false) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => {
            const nextLogs = [
                ...prev,
                { id: Math.random().toString(), time: timestamp, text: message, isSystem }
            ]
            if (nextLogs.length > 80) {
                return nextLogs.slice(nextLogs.length - 80);
            }
            return nextLogs;
        });
    }, []);

    const handleHourlyRefresh = useCallback(() => {
        setRefreshCounter(prev => prev + 1);
        addLog('Triggering automatic hourly refresh at HH:01:00...', true);
    }, [addLog]);

    useEffect(() => {
        setMounted(true);
        setLogs([
            { id: 'init', time: new Date().toLocaleTimeString(), text: 'Terminal initialized. Booting streams for 6 pairs...', isSystem: true }
        ]);

        if (typeof window !== 'undefined') {
            const savedSymbol = sessionStorage.getItem('selectedStrategySymbol');
            if (savedSymbol) {
                setSelectedSymbol(savedSymbol);
                sessionStorage.removeItem('selectedStrategySymbol');
            }
        }
    }, []);

    useEffect(() => {
        setSelectedSymbolPriceInfo(null);
    }, [selectedSymbol]);

    const clearLogs = () => {
        setLogs([{ id: 'clear', time: new Date().toLocaleTimeString(), text: 'Log cleared.', isSystem: true }]);
    };

    const handleSetGlobalTimeframe = (tf) => {
        setGlobalTimeframe(tf);
        addLog(`Switched global timeframe to ${tf}`, true);
    };

    // Live Candle Data (XAUUSD strategy tab)
    const [liveData, setLiveData] = useState(MOCK_LIVE_DATA);
    const [candleStartTimes, setCandleStartTimes] = useState({
        "5m": MOCK_LIVE_DATA["5m"].time,
        "15m": MOCK_LIVE_DATA["15m"].time,
        "1h": MOCK_LIVE_DATA["1h"].time,
        "1d": MOCK_LIVE_DATA["1d"].time
    });
    const [countdownTexts, setCountdownTexts] = useState({ "5m": "-:-", "15m": "-:-", "1h": "-:-", "1d": "-:-" });
    const [priceTickColor, setPriceTickColor] = useState('normal'); // 'up' | 'down' | 'normal'
    const [lastPrices, setLastPrices] = useState({ "5m": 0, "15m": 0, "1h": 0, "1d": 0 });

    // Scanner / Strength Data (REST Polled - strategy tab)
    const [scannerData, setScannerData] = useState(MOCK_SCANNER_DATA);
    const [scannerLoading, setScannerLoading] = useState(false);

    // Active Strategy signal (strategy tab)
    const [strategySignal, setStrategySignal] = useState(MOCK_STRATEGY_SIGNAL);

    // Refs for Socket connection (strategy tab)
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    // Logger Helper for strategy tab
    const addStrategyLog = (message, isSystem = false) => {
        console.log(`[WebSocket Strategy] ${isSystem ? 'SYSTEM: ' : ''}${message}`);
    };

    // WebSocket URL generator
    const getWsUrl = (type, currentSymbol) => {
        let base = type === 'live' 
            ? process.env.NEXT_PUBLIC_WS_LIVE_URL 
            : process.env.NEXT_PUBLIC_WS_STRATEGY_URL;
            
        if (!base) {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (backendUrl) {
                const protocol = backendUrl.startsWith('https://') ? 'wss://' : 'ws://';
                const host = backendUrl.replace(/^(https?:\/\/)/, '');
                base = `${protocol}${host}/api/v1/ws/${type}`;
            } else if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                base = `ws://localhost:8000/api/v1/ws/${type}`;
            } else {
                base = `wss://thirsty-spoiler-cartel.ngrok-free.dev/api/v1/ws/${type}`;
            }
        }
        
        if (currentSymbol) {
            return `${base}?symbol=${currentSymbol}`;
        }
        return base;
    };

    // WebSocket Connection Management (runs only on Strategy tab)
    const connectWS = (type, currentSymbol) => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        const wsUrl = getWsUrl(type, currentSymbol);
        addStrategyLog(`Connecting to WebSocket Relay: ${wsUrl}`, true);
        setWsStatus('connecting');

        try {
            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                addStrategyLog(`Connected successfully to MT5 ${type === 'live' ? 'Live Bridge' : 'Strategy Feed'}!`, true);
                setWsStatus('connected');
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (type === 'live') {
                        if (payload.type === 'initial_state' || payload.type === 'candle_update') {
                            addStrategyLog(`Received update for ${currentSymbol}`);
                            setLiveData(payload.data);
                            
                            const nextStartTimes = {};
                            for (const tf in payload.data) {
                                nextStartTimes[tf] = payload.data[tf].time;
                            }
                            setCandleStartTimes(nextStartTimes);

                            const candle = payload.data[timeframe];
                            if (candle) {
                                const prevPrice = lastPrices[timeframe];
                                const currentPrice = candle.close;
                                if (prevPrice > 0 && currentPrice !== prevPrice) {
                                    setPriceTickColor(currentPrice > prevPrice ? 'up' : 'down');
                                }
                                setLastPrices((prev) => ({ ...prev, [timeframe]: currentPrice }));
                            }

                            if (payload.strategy_signal) {
                                setStrategySignal(payload.strategy_signal);
                            }
                        }
                    } else {
                        // Strategy feed
                        if (payload.type === 'initial_strategy_state' && Array.isArray(payload.active_setups)) {
                            addStrategyLog(`Received initial strategy state with ${payload.active_setups.length} setups`);
                            const newSigs = {};
                            payload.active_setups.forEach(setup => {
                                if (setup.symbol) {
                                    const sName = setup.symbol.replace("/", "").toUpperCase();
                                    newSigs[sName] = setup;
                                }
                            });
                            setActiveSignals(newSigs);
                            
                            const keys = Object.keys(newSigs);
                            if (keys.length > 0) {
                                if (newSigs["XAUUSD"]) {
                                    setSelectedStrategySymbol("XAUUSD");
                                } else {
                                    setSelectedStrategySymbol(keys[0]);
                                }
                            }
                        } else if (payload.symbol && payload.signal) {
                            const sName = payload.symbol.replace("/", "").toUpperCase();
                            addStrategyLog(`Received strategy update for ${sName}`);
                            setActiveSignals(prev => ({
                                ...prev,
                                [sName]: {
                                    ...prev[sName],
                                    ...payload
                                }
                            }));
                        } else if (payload.strategy_signal) {
                            const sig = payload.strategy_signal;
                            const sName = (sig.symbol || payload.symbol || currentSymbol || '').replace("/", "").toUpperCase();
                            if (sName) {
                                addStrategyLog(`Received strategy alert for ${sName}`);
                                setActiveSignals(prev => ({
                                    ...prev,
                                    [sName]: {
                                        ...prev[sName],
                                        symbol: sig.symbol || payload.symbol || currentSymbol,
                                        signal: { ...sig }
                                    }
                                }));
                            }
                        } else if (payload.type === 'initial_state' || payload.type === 'strategy_update') {
                            addStrategyLog(`Received strategy status update`);
                            const data = payload.data || {};
                            if (data.symbol && data.signal) {
                                const sName = data.symbol.replace("/", "").toUpperCase();
                                setActiveSignals(prev => ({
                                    ...prev,
                                    [sName]: {
                                        ...prev[sName],
                                        ...data
                                    }
                                }));
                            } else if (data.strategy_signal) {
                                const sig = data.strategy_signal;
                                const sName = (sig.symbol || data.symbol || currentSymbol || '').replace("/", "").toUpperCase();
                                if (sName) {
                                    setActiveSignals(prev => ({
                                        ...prev,
                                        [sName]: {
                                            ...prev[sName],
                                            symbol: sig.symbol || data.symbol || currentSymbol,
                                            signal: { ...sig }
                                        }
                                    }));
                                }
                            } else if (Array.isArray(data)) {
                                const newSigs = {};
                                data.forEach(item => {
                                    const sig = item.strategy_signal || item;
                                    if (sig && sig.symbol) {
                                        const sName = sig.symbol.replace("/", "").toUpperCase();
                                        newSigs[sName] = {
                                            symbol: sig.symbol,
                                            signal: { ...sig }
                                        };
                                    } else if (item.symbol && item.signal) {
                                        const sName = item.symbol.replace("/", "").toUpperCase();
                                        newSigs[sName] = item;
                                    }
                                });
                                setActiveSignals(prev => ({ ...prev, ...newSigs }));
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error processing websocket payload:", e);
                }
            };

            socket.onerror = () => {
                addStrategyLog("WebSocket encountered an error.", true);
            };

            socket.onclose = () => {
                addStrategyLog("Connection lost. Reconnecting in 3 seconds...", true);
                setWsStatus('disconnected');
                reconnectTimerRef.current = setTimeout(() => connectWS(type, currentSymbol), 3000);
            };
        } catch (err) {
            addStrategyLog(`Failed to connect: ${err.message}`, true);
            setWsStatus('disconnected');
        }
    };

    // Handle WebSocket setup for strategy tab (uses Global Scan by connecting with empty symbol)
    useEffect(() => {
        if (activeTab === 'strategy') {
            connectWS('strategy', '');
        }
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        };
    }, [activeTab]);

    // REST Polling for Scanner Metrics (runs only on Strategy tab)
    const fetchScannerData = async (targetSymbol, targetTf) => {
        try {
            setScannerLoading(true);
            let displayTf = targetTf.toUpperCase();
            
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
            const url = `${backendUrl}/api/v1/scanner/run-all?symbol=${targetSymbol}&timeframe=${displayTf}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("Network status invalid");
            const data = await res.json();
            if (data.success) {
                setScannerData(data);
            }
        } catch (err) {
            console.warn("Failed fetching scanner results:", err.message);
        } finally {
            setScannerLoading(false);
        }
    };

    // Fetch detailed technical analysis for selected pair on Strategy tab
    const fetchStrategyAnalysis = async (targetSymbol) => {
        if (!targetSymbol) return;
        const cleanSym = targetSymbol.replace("/", "").toUpperCase();
        try {
            setAnalysisLoading(true);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
            const url = `${backendUrl}/api/v1/chart/analysis?symbol=${cleanSym}`;
            
            const res = await fetch(url, {
                headers: {
                    'accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (!res.ok) throw new Error("Network status invalid");
            const data = await res.json();
            if (data.success && data.analysis) {
                setStrategyAnalysis(data.analysis);
            }
        } catch (err) {
            console.warn("Failed fetching strategy analysis:", err.message);
        } finally {
            setAnalysisLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'strategy' && selectedStrategySymbol) {
            fetchStrategyAnalysis(selectedStrategySymbol);
        }
    }, [activeTab, selectedStrategySymbol]);

    // Ticks countdown timer logic
    useEffect(() => {
        if (activeTab !== 'strategy') return;
        const durations = {
            "5m": 300,
            "15m": 900,
            "1h": 3600,
            "1d": 86400
        };

        const updateCountdowns = () => {
            const now = Math.floor(Date.now() / 1000);
            const nextTexts = {};

            for (const tf in candleStartTimes) {
                const startTime = candleStartTimes[tf];
                if (!startTime) {
                    nextTexts[tf] = "-:-";
                    continue;
                }

                const duration = durations[tf];
                const elapsed = now - startTime;
                let remaining = duration - elapsed;
                if (remaining < 0) remaining = 0;

                if (remaining >= 86400) {
                    const days = Math.floor(remaining / 86400);
                    const hours = Math.floor((remaining % 86400) / 3600);
                    nextTexts[tf] = `${days}d ${hours}h`;
                } else if (remaining >= 3600) {
                    const hours = Math.floor(remaining / 3600);
                    const minutes = Math.floor((remaining % 3600) / 60);
                    nextTexts[tf] = `${hours}h ${minutes}m`;
                } else {
                    const minutes = Math.floor(remaining / 60);
                    const seconds = remaining % 60;
                    nextTexts[tf] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            }
            setCountdownTexts(nextTexts);
        };

        const timer = setInterval(updateCountdowns, 1000);
        return () => clearInterval(timer);
    }, [activeTab, candleStartTimes]);

    // Reset price change color flash after a delay
    useEffect(() => {
        if (priceTickColor !== 'normal') {
            const timer = setTimeout(() => setPriceTickColor('normal'), 600);
            return () => clearTimeout(timer);
        }
    }, [priceTickColor]);

    // Handler to subscribe to new symbol
    const handleSubscribe = (e) => {
        e.preventDefault();
        const inputVal = symbolInput.trim().toUpperCase();
        if (!inputVal) return;

        addStrategyLog(`Subscribing to symbol: ${inputVal}`, true);
        setSymbol(inputVal);

        if (activeTab === 'strategy') {
            setSelectedStrategySymbol(inputVal);
            if (!activeSignals[inputVal]) {
                setActiveSignals(prev => ({
                    ...prev,
                    [inputVal]: {
                        symbol: inputVal,
                        strategy_name: 'EMA Pullback',
                        signal: {
                            active: false,
                            message: `Monitoring live strategy feed for ${inputVal}. Awaiting next signal trigger.`
                        }
                    }
                }));
            }
        } else {
            setLiveData(null);
            setStrategySignal(null);
            setScannerData(null);
            setCandleStartTimes({ "5m": 0, "15m": 0, "1h": 0, "1d": 0 });
            setLastPrices({ "5m": 0, "15m": 0, "1h": 0, "1d": 0 });
        }
        
        toast.success(`Subscribed to ${inputVal}`);
    };

    const handleCardClick = (sym) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('selectedStrategySymbol', sym);
        }
        router.push('/ai-strategy/live');
    };

    // Parse strength and details from REST scanner output
    const scannerSummary = useMemo(() => {
        if (!scannerData || !scannerData.analysis_summary) return null;
        return scannerData.analysis_summary[symbol] || null;
    }, [scannerData, symbol]);

    const strengthPercentage = useMemo(() => {
        if (!scannerSummary) return 50;
        const score = scannerSummary.strength_score || 0;
        return Math.round(((score + 5) / 10) * 100);
    }, [scannerSummary]);

    const signalPills = useMemo(() => {
        if (!scannerData || !scannerData.scanner_results) return [];
        const items = [];
        for (const scannerName in scannerData.scanner_results) {
            const matches = scannerData.scanner_results[scannerName];
            if (Array.isArray(matches)) {
                matches.forEach((m) => {
                    let typeClass = styles.neutralBadge;
                    if (scannerName.includes("breakout")) typeClass = styles.breakoutBadge;
                    else if (scannerName.includes("momentum")) typeClass = styles.momentumBadge;
                    else if (scannerName.includes("rsi")) typeClass = styles.rsiBadge;
                    else if (scannerName.includes("volume") || scannerName.includes("vol")) typeClass = styles.volumeBadge;
                    else if (scannerName.includes("gap") || scannerName.includes("structure")) typeClass = styles.gapBadge;

                    items.push({
                        id: `${scannerName}-${m.detail}`,
                        name: scannerName.replace(/_/g, ' ').toUpperCase(),
                        detail: m.detail,
                        className: typeClass
                    });
                });
            }
        }
        return items;
    }, [scannerData]);

    const candle = useMemo(() => {
        if (!liveData) return null;
        return liveData[timeframe] || null;
    }, [liveData, timeframe]);

    const priceChangeInfo = useMemo(() => {
        if (!candle) return { val: 0, pct: 0, class: 'neutral' };
        const val = candle.close - candle.open;
        const pct = candle.open > 0 ? (val / candle.open) * 100 : 0;
        return {
            val,
            pct,
            class: val >= 0 ? styles.positive : styles.negative
        };
    }, [candle]);

    // Active setup calculation for the selected symbol on strategy tab
    const activeSetup = activeSignals[selectedStrategySymbol] || (Object.keys(activeSignals).length > 0 ? Object.values(activeSignals)[0] : null);

    // Calculate dynamic signal data or fallback using REST analysis details
    const activeSignal = useMemo(() => {
        if (activeSetup?.signal?.active) {
            return activeSetup.signal;
        }

        if (strategyAnalysis) {
            const currentPrice = strategyAnalysis.current_price || 0;
            const techScore = strategyAnalysis.technical_score || {};
            const directionLabel = techScore.label || '';
            
            let direction = 'HOLD';
            if (directionLabel.toLowerCase().includes('bullish') || directionLabel.toLowerCase().includes('buy')) {
                direction = 'BUY';
            } else if (directionLabel.toLowerCase().includes('bearish') || directionLabel.toLowerCase().includes('sell')) {
                direction = 'SELL';
            }
            
            const isBuy = direction === 'BUY';
            const isSell = direction === 'SELL';
            
            // Calculate a reasonable pip/point spread based on symbol to compute SL/TP
            const currentSym = activeSetup?.symbol || selectedStrategySymbol;
            const isJpy = currentSym.endsWith("JPY");
            const isGold = currentSym.includes("XAU") || currentSym.includes("GOLD");
            const defaultSpread = isGold ? 15.00 : isJpy ? 0.40 : 0.0025;
            
            const levels = strategyAnalysis.levels || {};
            let sl = levels.nearest_support || (isBuy ? (currentPrice - defaultSpread) : (currentPrice + defaultSpread));
            let tp1 = levels.nearest_resistance || (isBuy ? (currentPrice + defaultSpread) : (currentPrice - defaultSpread));
            
            // Ensure proper SL/TP logic based on direction
            if (isBuy) {
                if (sl >= currentPrice) sl = currentPrice - defaultSpread;
                if (tp1 <= currentPrice) tp1 = currentPrice + defaultSpread;
            } else if (isSell) {
                if (sl <= currentPrice) sl = currentPrice + defaultSpread;
                if (tp1 >= currentPrice) tp1 = currentPrice - defaultSpread;
            }
            
            const riskAmt = Math.abs(currentPrice - sl);
            const tp2 = isBuy ? (currentPrice + riskAmt * 2.5) : (currentPrice - riskAmt * 2.5);
            
            let rsiVal = 50;
            const momInd = strategyAnalysis.momentum_indicators || {};
            if (momInd.RSI && typeof momInd.RSI.value === 'number') {
                rsiVal = momInd.RSI.value;
            } else if (momInd.rsi && typeof momInd.rsi.value === 'number') {
                rsiVal = momInd.rsi.value;
            }

            const aiSum = strategyAnalysis.ai_summary || {};
            const reasoning = aiSum.headline || 
                `Dynamic technical indicators suggest a ${directionLabel.toLowerCase()} bias for ${currentSym} on the H1 timeframe. Price stands at ${currentPrice} with the RSI at ${rsiVal.toFixed(1)}.`;

            return {
                active: direction !== 'HOLD',
                direction,
                entry: currentPrice,
                sl,
                tp1,
                tp2,
                timestamp: Math.floor(Date.now() / 1000),
                confidence: techScore.confidence || techScore.total || 60,
                rvol: aiSum.volume || '1.1x',
                risk_reward: isBuy ? '1:1.5' : isSell ? '1:1.5' : '—',
                rsi: rsiVal,
                scanners_count: Object.keys(strategyAnalysis.trend_indicators || {}).length || 3,
                reasoning,
                isFallback: true
            };
        }

        return { active: false };
    }, [activeSetup, strategyAnalysis, selectedStrategySymbol]);

    const strategyActive = activeSetup !== null || strategyAnalysis !== null;
    const strategyDirection = activeSignal?.direction || 'HOLD';
    const confidenceVal = activeSignal?.confidence || 0;
    
    // Circular progress stroke calculations
    const circumference = 188.495;
    const dashoffset = circumference - (confidenceVal / 100) * circumference;

    return (
        <div className={styles.aiStrategyWrapper}>
            {/* Page Title */}
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <h2>
                        {activeTab === 'live'
                            ? t('aiStrategy.liveAnalysisFeedTitle', 'Live Analysis Feed')
                            : t('aiStrategy.title', 'AI Strategy')}
                    </h2>
                    <p>
                        {activeTab === 'live' 
                            ? t('aiStrategy.liveAnalysisFeedSubtitle', 'Real-Time FX Live Grid providing instant market feeds and strategy indicators.')
                            : t('aiStrategy.subtitle', 'Real-time technical metrics, scanner signals, and AI Expert Advisor strategies streamed from MetaTrader 5.')
                        }
                    </p>
                </div>
                {activeTab === 'live' && (
                    <div className={styles.headerDropdownCorner}>
                        <StrategyDropdown onSelect={setSelectedStrategyId} />
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className={styles.contentBody}>
                <AnimatePresence mode="wait">
                    {activeTab === 'live' ? (
                        <motion.div 
                            key="live-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={styles.liveTabContainer}
                        >

                            {/* Three Panel Layout */}
                            <div className={styles.threePanelLayout}>
                                {/* Panel 1: Watchlist */}
                                <WatchlistPanel 
                                    selectedSymbol={selectedSymbol}
                                    onSelectSymbol={setSelectedSymbol}
                                    globalTimeframe={globalTimeframe}
                                    addLog={addLog}
                                    activeAnalysis={activeAnalysis}
                                    onActivePriceUpdate={setSelectedSymbolPriceInfo}
                                />

                                {/* Panel 2: Chart */}
                                <ChartPanel 
                                    symbol={selectedSymbol}
                                    strategyId={selectedStrategyId}
                                    timeframe={globalTimeframe === '1h' ? '1H' : globalTimeframe}
                                    nearestSupport={activeAnalysis?.levels?.nearest_support}
                                    nearestResistance={activeAnalysis?.levels?.nearest_resistance}
                                    onRefreshNeeded={handleHourlyRefresh}
                                    livePriceInfo={selectedSymbolPriceInfo}
                                />

                                {/* Panel 3: Analysis */}
                                <AnalysisPanel 
                                    symbol={selectedSymbol}
                                    strategyId={selectedStrategyId}
                                    activeAnalysis={activeAnalysis}
                                    onAnalysisLoaded={setActiveAnalysis}
                                    key={`${selectedSymbol}-${selectedStrategyId}-${refreshCounter}`}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="strategy-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={styles.tabContent}
                        >
                            {/* Strategy Accordion Button */}
                            <div className={styles.strategyAccordion}>
                                <button
                                    className={`${styles.accordionTrigger} ${showPairSelector ? styles.accordionOpen : ''}`}
                                    onClick={() => setShowPairSelector(!showPairSelector)}
                                >
                                    <div className={styles.accordionLeft}>
                                        <span className={`${styles.strategyDot} ${styles.buyDot}`}></span>
                                        <span className={styles.accordionTitle}>EMA Pullback Strategy</span>
                                        {Object.keys(activeSignals).length > 0 && (
                                            <span className={styles.accordionBadge}>
                                                {Object.keys(activeSignals).length} Pairs
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.accordionRight}>
                                        <span className={`${styles.accordionWsBadge} ${styles[wsStatus]}`}>
                                            {wsStatus === 'connected' ? '● Live' : wsStatus === 'connecting' ? '◌ Connecting...' : '○ Offline'}
                                        </span>
                                        <span className={`${styles.dropdownArrow} ${showPairSelector ? styles.open : ''}`}>▼</span>
                                    </div>
                                </button>

                                {/* Accordion Content: All Pair Cards */}
                                <AnimatePresence>
                                    {showPairSelector && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            {Object.keys(activeSignals).length === 0 ? (
                                                <div className={`${styles.noTradeCard} ${styles.accordionEmpty}`}>
                                                    <div className={`${styles.radarIcon} ${styles.radarIconSpinner}`}>
                                                        <RadarIcon />
                                                    </div>
                                                    <h4>Awaiting Strategy Stream</h4>
                                                    <p>Connecting to the live Global Scan strategy feed. Waiting for active setups...</p>
                                                </div>
                                            ) : (
                                                <div className={styles.pairsGrid}>
                                                    {Object.entries(activeSignals).map(([symName, setup]) => {
                                                        const sig = setup.signal || {};
                                                        const sigActive = sig.active;
                                                        const isBuy = sig.direction === 'BUY';
                                                        const confVal = sig.confidence || 0;

                                                        return (
                                                            <div
                                                                key={symName}
                                                                className={`${styles.pairCard} ${sigActive ? (isBuy ? styles.activeBuy : styles.activeSell) : ''}`}
                                                            >
                                                                {/* Card Header */}
                                                                <div className={styles.pairCardHead}>
                                                                    <div className={styles.cardHeaderTitle}>
                                                                        <span className={`${styles.strategyDot} ${sigActive ? (isBuy ? styles.buyDot : styles.sellDot) : styles.holdDot}`}></span>
                                                                        <h4>
                                                                            {setup.symbol || symName}
                                                                            {sig.timestamp && (
                                                                                <span className={styles.timeTag}>
                                                                                    &nbsp;{new Date(sig.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                                                                                </span>
                                                                            )}
                                                                        </h4>
                                                                    </div>
                                                                    <span className={styles.strategyTypeTag}>{setup.strategy_name || 'EMA Pullback'}</span>
                                                                </div>

                                                                {/* Direction Badge */}
                                                                <div className={`${styles.directionBadge} ${sigActive ? (isBuy ? styles.buyColor : styles.sellColor) : styles.holdColor}`}>
                                                                    {sigActive ? (isBuy ? '↑ BUY' : '↓ SELL') : '→ HOLD'}
                                                                </div>

                                                                {/* Trade Details or No Active Trade */}
                                                                {sigActive ? (
                                                                    <>
                                                                        {/* Price Levels */}
                                                                        <div className={styles.levelsCard}>
                                                                            <div className={styles.gridLevelRow}>
                                                                                <span className={styles.gridLevelLabel}>Entry Target</span>
                                                                                <span className={styles.gridLevelValue}>{formatCurrency(sig.entry, symName)}</span>
                                                                            </div>
                                                                            <div className={styles.gridLevelRow}>
                                                                                <span className={styles.gridLevelLabel}>Stop Loss</span>
                                                                                <span className={`${styles.gridLevelValue} ${styles.slColor}`}>{formatCurrency(sig.sl, symName)}</span>
                                                                            </div>
                                                                            <div className={styles.gridLevelRow}>
                                                                                <span className={styles.gridLevelLabel}>Take Profit 1 (1.5 R:R)</span>
                                                                                <span className={`${styles.gridLevelValue} ${styles.tpColor}`}>{formatCurrency(sig.tp1, symName)}</span>
                                                                            </div>
                                                                            {sig.tp2 && (
                                                                                <div className={styles.gridLevelRow}>
                                                                                    <span className={styles.gridLevelLabel}>Take Profit 2 (3.0 R:R)</span>
                                                                                    <span className={`${styles.gridLevelValue} ${styles.tpColor}`}>{formatCurrency(sig.tp2, symName)}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Confluence Indicators */}
                                                                        <div className={styles.confluenceBox}>
                                                                            <div className={styles.confluenceStats}>
                                                                                <span className={styles.confKicker}>Confluence Indicators</span>
                                                                                {sig.rvol && (
                                                                                    <div className={styles.confItem}>
                                                                                        <VolumeIcon />
                                                                                        <span>Volume: <strong className={styles.strongText}>STRONG ({sig.rvol})</strong></span>
                                                                                    </div>
                                                                                )}
                                                                                {sig.risk_reward && (
                                                                                    <div className={styles.confItem}>
                                                                                        <RiskRewardIcon />
                                                                                        <span>Risk Reward: <strong>{sig.risk_reward}</strong></span>
                                                                                    </div>
                                                                                )}
                                                                                <span className={`${styles.confStrengthBadge} ${confVal >= 90 ? styles.highConf : styles.medConf}`}>
                                                                                    {confVal >= 90 ? 'HIGH' : 'MEDIUM'} CONFIDENCE
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* AI Analysis & Reasoning */}
                                                                        <div className={styles.strategyReasoning}>
                                                                            <span className={styles.reasoningLabel}>AI Analysis &amp; Reasoning</span>
                                                                            <p>
                                                                                {sig.reasoning ||
                                                                                    `${setup.strategy_name || 'EMA Pullback'} setup detected on H1 timeframe for ${setup.symbol || symName}. ` +
                                                                                    `Price is showing a ${isBuy ? 'bullish' : 'bearish'} bias` +
                                                                                    `${sig.rsi ? ` with RSI at ${Number(sig.rsi).toFixed(1)}` : ''}.` +
                                                                                    `${sig.confidence ? ` Signal confidence: ${sig.confidence}%.` : ''}` +
                                                                                    `${sig.rvol ? ` Volume is elevated at ${sig.rvol}, confirming momentum.` : ''}`
                                                                                }
                                                                            </p>
                                                                        </div>

                                                                        {/* Signal Tags */}
                                                                        <div className={styles.tagFlex}>
                                                                            <span className={styles.strategyTag}>{setup.strategy_name || 'EMA PULLBACK'}</span>
                                                                            <span className={styles.strategyTag}>
                                                                                {isBuy ? 'UPTREND' : 'DOWNTREND'}
                                                                            </span>
                                                                            {sig.rsi && (
                                                                                <span className={styles.strategyTag}>RSI {Number(sig.rsi).toFixed(1)}</span>
                                                                            )}
                                                                            {sig.scanners_count && (
                                                                                <span className={styles.strategyTag}>{sig.scanners_count} SCANNERS</span>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className={styles.inactiveMessage}>
                                                                        <RadarIcon width={16} height={16} />
                                                                        <span>{sig.message || 'No active trade setup'}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
