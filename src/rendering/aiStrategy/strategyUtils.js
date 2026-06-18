// 28 FX currency pairs list
export const pairs = [
    "EUR/USD", "USD/JPY", "GBP/USD", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD", "XAU/USD",
    "EUR/GBP", "EUR/CHF", "EUR/JPY", "EUR/AUD", "EUR/CAD", "EUR/NZD",
    "GBP/JPY", "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/NZD",
    "CHF/JPY", "CAD/JPY", "AUD/JPY", "NZD/JPY",
    "AUD/CHF", "AUD/CAD", "AUD/NZD", "CAD/CHF", "NZD/CHF"
];

// Formatting Helper for Forex pip values
export function formatPairCurrency(val, symbol) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    
    let symUpper = (symbol || '').toUpperCase().replace("/", "");
    let prefix = "$";
    if (symUpper.includes("INR")) prefix = "$";
    else if (symUpper.includes("EUR")) prefix = "$";
    else if (symUpper.includes("GBP")) prefix = "$";
    else if (symUpper.includes("JPY")) prefix = "$";
    
    // JPY pairs (e.g. USDJPY, EURJPY)
    if (symUpper.endsWith("JPY")) {
        return `${prefix}${val.toFixed(3)}`;
    }
    // Gold / Spot metals
    if (symUpper.includes("XAU") || symUpper.includes("GOLD") || symUpper.includes("XAG")) {
        return `${prefix}${val.toFixed(2)}`;
    }
    // Standard Forex pairs (show 5 decimals for pips accuracy)
    if (symUpper.length === 6) {
        return `${prefix}${val.toFixed(5)}`;
    }
    return `${prefix}${val.toFixed(2)}`;
}

// Mock initial data generator for FX pairs
export function getMockInitialData(pair) {
    const symUpper = pair.toUpperCase().replace("/", "");
    let basePrice = 1.25000;
    
    if (symUpper.endsWith("JPY")) {
        basePrice = 155.250;
    } else if (symUpper.includes("XAU") || symUpper.includes("GOLD")) {
        basePrice = 2335.50;
    } else if (symUpper === "USDCAD") {
        basePrice = 1.36500;
    } else if (symUpper === "USDCHF") {
        basePrice = 0.89500;
    } else if (symUpper === "AUDUSD") {
        basePrice = 0.66500;
    } else if (symUpper === "NZDUSD") {
        basePrice = 0.61200;
    } else if (symUpper === "EURGBP") {
        basePrice = 0.85200;
    }

    const isJpy = symUpper.endsWith("JPY");
    const isGold = symUpper.includes("XAU") || symUpper.includes("GOLD");
    const multiplier = isJpy ? 100 : isGold ? 1000 : 1;

    const now = Math.floor(Date.now() / 1000);
    return {
        "5m": { time: now - 120, open: basePrice - 0.001 * multiplier, high: basePrice + 0.003 * multiplier, low: basePrice - 0.002 * multiplier, close: basePrice, tick_volume: 480 },
        "15m": { time: now - 340, open: basePrice - 0.002 * multiplier, high: basePrice + 0.006 * multiplier, low: basePrice - 0.004 * multiplier, close: basePrice, tick_volume: 1250 },
        "1h": { time: now - 1800, open: basePrice - 0.005 * multiplier, high: basePrice + 0.012 * multiplier, low: basePrice - 0.008 * multiplier, close: basePrice, tick_volume: 5240 },
        "1d": { time: now - 43200, open: basePrice - 0.020 * multiplier, high: basePrice + 0.045 * multiplier, low: basePrice - 0.035 * multiplier, close: basePrice, tick_volume: 42100 }
    };
}

// Mock initial strategy signal generator
export function getMockStrategySignal(pair) {
    const hash = pair.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (hash % 3 === 0) {
        const symUpper = pair.toUpperCase().replace("/", "");
        const isJpy = symUpper.endsWith("JPY");
        const isGold = symUpper.includes("XAU") || symUpper.includes("GOLD");
        
        let entry = 1.25000;
        if (isJpy) entry = 155.250;
        else if (isGold) entry = 2335.50;
        else if (symUpper === "USDCAD") entry = 1.36500;
        else if (symUpper === "USDCHF") entry = 0.89500;
        else if (symUpper === "AUDUSD") entry = 0.66500;
        else if (symUpper === "NZDUSD") entry = 0.61200;

        const direction = hash % 2 === 0 ? "BUY" : "SELL";
        return {
            active: true,
            direction,
            entry: direction === "BUY" ? entry - 0.001 : entry + 0.001
        };
    }
    return null;
}

// Format Helpers
export function formatCurrency(val, symbol = 'XAUUSD') {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    let prefix = "$";
    const upperSymbol = symbol.toUpperCase();
    if (upperSymbol.includes("INR")) prefix = "$";
    else if (upperSymbol.includes("EUR")) prefix = "$";
    else if (upperSymbol.includes("GBP")) prefix = "$";
    else if (upperSymbol.includes("JPY")) prefix = "$";
    return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function formatVolume(val, symbol = 'XAUUSD') {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    const upperSymbol = symbol.toUpperCase();
    if (upperSymbol.includes("INR")) {
        if (val >= 10000000) return (val / 10000000).toFixed(2) + 'Cr';
        if (val >= 100000) return (val / 100000).toFixed(1) + 'L';
    }
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
}

export const MOCK_LIVE_DATA = {
    "5m": { time: 1718600000 - 120, open: 2331.20, high: 2335.60, low: 2329.80, close: 2334.50, tick_volume: 480 },
    "15m": { time: 1718600000 - 340, open: 2328.50, high: 2336.10, low: 2327.40, close: 2334.50, tick_volume: 1250 },
    "1h": { time: 1718600000 - 1800, open: 2322.40, high: 2339.80, low: 2320.10, close: 2334.50, tick_volume: 5240 },
    "1d": { time: 1718600000 - 43200, open: 2310.50, high: 2345.00, low: 2308.20, close: 2334.50, tick_volume: 42100 }
};

export const MOCK_STRATEGY_SIGNAL = {
    active: true,
    direction: "BUY",
    entry: 2331.50,
    sl: 2320.00,
    tp1: 2348.50,
    tp2: 2365.00,
    timestamp: 1718600000 - 600,
    confidence: 85,
    rvol: "1.8x",
    risk_reward: "1:2.5",
    rsi: 62.4,
    scanners_count: 3
};

export const MOCK_SCANNER_DATA = {
    success: true,
    total_matches: 3,
    analysis_summary: {
        "XAUUSD": {
            strength_score: 3,
            trend_direction: "bullish",
            ema_alignment: "bullish_alignment"
        }
    },
    scanner_results: {
        "breakout_scanners": [{ detail: "H1 Resistance Breakout" }],
        "momentum_scanners": [{ detail: "RSI Bullish Momentum" }],
        "volume_scanners": [{ detail: "High Relative Volume Spike" }]
    }
};
