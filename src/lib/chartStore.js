/**
 * Global Chart Store & Service Manager
 * Handles single API hit deduplication for HTTP candle fetches and WebSocket live connections per pair/timeframe.
 */

// Dynamic Symbol Precision Utility
export function getSymbolPrecision(symbol) {
    const sym = (symbol || '').replace('/', '').toUpperCase();
    if (sym.includes('JPY')) {
        return { precision: 3, minMove: 0.001 };      // Yen Pairs (3 Decimals: USDJPY, GBPJPY)
    } else if (sym.includes('XAU') || sym.includes('BTC') || sym.includes('GOLD') || sym.includes('ETH')) {
        return { precision: 2, minMove: 0.01 };       // Gold / Crypto / Commodities (2 Decimals: XAUUSD)
    } else {
        return { precision: 5, minMove: 0.00001 };    // Standard Forex (5 Decimals: EURUSD, NZDUSD, GBPUSD, AUDUSD, USDCAD, USDCHF)
    }
}

export function applySymbolPrecision(series, symbol) {
    if (!series || !symbol) return;
    const sym = symbol.replace('/', '').toUpperCase();
    const precision = sym.includes('JPY') ? 3 : ((sym.includes('XAU') || sym.includes('BTC')) ? 2 : 5);
    const minMove = sym.includes('JPY') ? 0.001 : ((sym.includes('XAU') || sym.includes('BTC')) ? 0.01 : 0.00001);
    series.applyOptions({ priceFormat: { type: 'price', precision, minMove } });
}

// 1. Single HTTP REST API Fetch Cache & Deduplication
const activeFetches = new Map();

export async function fetchChartCandlesOnce(symbol, timeframe = '15m', strategyId = '3e8d2b78-0e86-4fdf-9759-338276db1742') {
    const cleanSymbol = (symbol || 'XAUUSD').replace('/', '').toUpperCase();
    const key = `${cleanSymbol}:${timeframe}:${strategyId}`;

    if (activeFetches.has(key)) {
        return activeFetches.get(key);
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.thetradermaster.com').replace(/\/+$/, '');
    const url = `${baseUrl}/api/v1/chart/candles?symbol=${cleanSymbol}&timeframe=${timeframe}&strategy_id=${strategyId}`;

    const fetchPromise = fetch(url, {
        headers: {
            'accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    })
    .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .catch((err) => {
        activeFetches.delete(key);
        throw err;
    })
    .then((data) => {
        // Keep in cache briefly to handle near-simultaneous mounts across multiple components
        setTimeout(() => {
            activeFetches.delete(key);
        }, 4000);
        return data;
    });

    activeFetches.set(key, fetchPromise);
    return fetchPromise;
}

// 2. Shared Singleton WebSocket Manager (Deduplicated WS Connection per Pair/Timeframe)
const activeSockets = new Map();

export function subscribeLiveCandles(symbol, timeframe, onCandleUpdate) {
    const cleanSymbol = (symbol || 'XAUUSD').replace('/', '').toUpperCase();
    const key = `${cleanSymbol}:${timeframe}`;

    if (!activeSockets.has(key)) {
        let wsBase = process.env.NEXT_PUBLIC_WS_CANDLES_URL;
        if (!wsBase) {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (backendUrl) {
                const wsScheme = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
                const cleanHost = backendUrl.replace(/^https?:\/\//, '');
                wsBase = `${wsScheme}//${cleanHost}/api/v1/websocket/live-candles`;
            } else if (typeof window !== 'undefined') {
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsHost = window.location.host || 'localhost:8000';
                wsBase = `${wsProtocol}//${wsHost}/api/v1/websocket/live-candles`;
            } else {
                wsBase = 'wss://api.thetradermaster.com/api/v1/websocket/live-candles';
            }
        }
        const wsUrl = `${wsBase}${wsBase.includes('?') ? '&' : '?'}symbol=${cleanSymbol}&timeframe=${timeframe}`;

        const entry = {
            socket: null,
            subscribers: new Set(),
            isConnecting: true,
        };

        try {
            const socket = new WebSocket(wsUrl);
            entry.socket = socket;

            socket.onopen = () => {
                entry.isConnecting = false;
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'candle_update' && payload.data) {
                        entry.subscribers.forEach((cb) => cb(payload.data));
                    }
                } catch {
                    /* ignore JSON parse errors */
                }
            };

            socket.onerror = (err) => {
                console.warn(`WebSocket error for ${key}:`, err);
            };

            socket.onclose = () => {
                activeSockets.delete(key);
            };
        } catch (e) {
            console.warn(`WebSocket creation failed for ${key}:`, e);
        }

        activeSockets.set(key, entry);
    }

    const wsEntry = activeSockets.get(key);
    if (wsEntry && onCandleUpdate) {
        wsEntry.subscribers.add(onCandleUpdate);
    }

    // Unsubscribe cleanup function
    return () => {
        const entry = activeSockets.get(key);
        if (entry) {
            if (onCandleUpdate) {
                entry.subscribers.delete(onCandleUpdate);
            }
            if (entry.subscribers.size === 0) {
                if (entry.socket && (entry.socket.readyState === WebSocket.OPEN || entry.socket.readyState === WebSocket.CONNECTING)) {
                    entry.socket.close();
                }
                activeSockets.delete(key);
            }
        }
    };
}
