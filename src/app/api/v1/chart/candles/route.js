import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EMA, ATR } from 'technicalindicators';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to align indicator values to original candles array
function alignIndicator(candles, indicatorValues, period) {
    const aligned = new Array(candles.length).fill(null);
    for (let i = 0; i < indicatorValues.length; i++) {
        aligned[i + period - 1] = indicatorValues[i];
    }
    return aligned;
}

// SuperTrend Calculation
function calculateSuperTrend(candles, period = 10, multiplier = 3) {
    const highs = candles.map(c => Number(c.high));
    const lows = candles.map(c => Number(c.low));
    const closes = candles.map(c => Number(c.close));

    const atrResult = ATR.calculate({ period, high: highs, low: lows, close: closes });
    const supertrend = new Array(candles.length).fill(null).map(() => ({ value: null, direction: null }));

    let prevFinalUpper = 0;
    let prevFinalLower = 0;
    let prevSuperTrend = 0;

    for (let i = 0; i < candles.length; i++) {
        if (i < period) {
            continue;
        }

        const atr = atrResult[i - period];
        if (atr === undefined || atr === null) continue;

        const hl2 = (highs[i] + lows[i]) / 2;
        const basicUpper = hl2 + multiplier * atr;
        const basicLower = hl2 - multiplier * atr;

        let finalUpper = basicUpper;
        let finalLower = basicLower;

        if (i > period) {
            const prevClose = closes[i - 1];
            finalUpper = (basicUpper < prevFinalUpper || prevClose > prevFinalUpper) ? basicUpper : prevFinalUpper;
            finalLower = (basicLower > prevFinalLower || prevClose < prevFinalLower) ? basicLower : prevFinalLower;
        }

        let currentSuperTrend;
        let direction;

        if (i === period) {
            currentSuperTrend = finalUpper;
            direction = -1;
        } else {
            if (prevSuperTrend === prevFinalUpper) {
                currentSuperTrend = (closes[i] <= finalUpper) ? finalUpper : finalLower;
                direction = (closes[i] <= finalUpper) ? -1 : 1;
            } else {
                currentSuperTrend = (closes[i] >= finalLower) ? finalLower : finalUpper;
                direction = (closes[i] >= finalLower) ? 1 : -1;
            }
        }

        supertrend[i] = { value: currentSuperTrend, direction };

        prevFinalUpper = finalUpper;
        prevFinalLower = finalLower;
        prevSuperTrend = currentSuperTrend;
    }

    return supertrend;
}

// Support & Resistance pivots calculation
const LEFT = 8;
const RIGHT = 8;
function calculateSupportResistance(candles) {
    if (!candles?.length) return { support: [], resistance: [] };

    const highs = candles.map(c => Number(c.high));
    const lows = candles.map(c => Number(c.low));
    const closes = candles.map(c => Number(c.close));
    const total = candles.length;

    const atrValues = ATR.calculate({ period: 14, high: highs, low: lows, close: closes });
    const atrThreshold = atrValues.length ? atrValues[atrValues.length - 1] * 0.7 : 0.0008;

    const touchThreshold = atrThreshold * 0.2;

    const countTouches = (price) =>
        candles.filter(c =>
            Math.abs(Number(c.high) - price) <= touchThreshold ||
            Math.abs(Number(c.low) - price) <= touchThreshold ||
            Math.abs(Number(c.close) - price) <= touchThreshold
        ).length;

    const ageWeight = (index) => 1 + (index / total);
    const minMove = atrThreshold * 1.5;

    const pivotHighs = [];
    let lastPH = null;
    for (let i = LEFT; i < highs.length - RIGHT; i++) {
        const val = highs[i];
        if (lastPH !== null && Math.abs(val - lastPH) < minMove) continue;
        let ok = true;
        for (let j = i - LEFT; j <= i + RIGHT; j++) {
            if (j !== i && highs[j] >= val) { ok = false; break; }
        }
        if (ok) { pivotHighs.push({ price: val, index: i }); lastPH = val; }
    }

    const pivotLows = [];
    let lastPL = null;
    for (let i = LEFT; i < lows.length - RIGHT; i++) {
        const val = lows[i];
        if (lastPL !== null && Math.abs(val - lastPL) < minMove) continue;
        let ok = true;
        for (let j = i - LEFT; j <= i + RIGHT; j++) {
            if (j !== i && lows[j] <= val) { ok = false; break; }
        }
        if (ok) { pivotLows.push({ price: val, index: i }); lastPL = val; }
    }

    const mergeDistance = Math.max(
        atrThreshold * 0.5,
        (closes[closes.length - 1] || 1) * 0.0005
    );

    const mergeZones = (pivots) => {
        const sorted = [...pivots].sort((a, b) => a.price - b.price);
        const zones = [];

        sorted.forEach(({ price, index }) => {
            const last = zones[zones.length - 1];
            if (last && Math.abs(price - last.price) < mergeDistance) {
                const midPrice = Number(((last.price + price) / 2).toFixed(4));
                const lastScore = countTouches(last.price) * ageWeight(last.index);
                const curScore = countTouches(price) * ageWeight(index);
                zones[zones.length - 1] = {
                    price: midPrice,
                    index: curScore >= lastScore ? index : last.index,
                    touches: countTouches(midPrice),
                    strength: Math.round(lastScore + curScore)
                };
            } else {
                const touches = countTouches(price);
                const strength = Math.round(touches * ageWeight(index));
                zones.push({ price: Number(price.toFixed(4)), index, touches, strength });
            }
        });

        return zones.sort((a, b) => b.strength - a.strength).slice(0, 3);
    };

    return {
        resistance: mergeZones(pivotHighs),
        support: mergeZones(pivotLows)
    };
}

export async function GET(request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase client is not configured.' }, {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        const searchParams = request.nextUrl.searchParams;
        const rawSymbol = searchParams.get('symbol') || 'EURUSD';
        const rawTimeframe = searchParams.get('timeframe') || 'H1';
        const limit = parseInt(searchParams.get('limit') || '744', 10);

        // Generate robust variants to query symbol & timeframe
        const symbolVariants = [rawSymbol];
        const upperSymbol = rawSymbol.toUpperCase();
        if (!symbolVariants.includes(upperSymbol)) symbolVariants.push(upperSymbol);
        
        const strippedSymbol = upperSymbol.replace('/', '');
        if (!symbolVariants.includes(strippedSymbol)) symbolVariants.push(strippedSymbol);
        
        if (strippedSymbol.length === 6) {
            const slashSymbol = strippedSymbol.slice(0, 3) + '/' + strippedSymbol.slice(3);
            if (!symbolVariants.includes(slashSymbol)) symbolVariants.push(slashSymbol);
        }

        const tfVariants = [rawTimeframe];
        const lowerTf = rawTimeframe.toLowerCase();
        if (lowerTf === 'h1' || lowerTf === '1h') {
            ['H1', '1h', '1H'].forEach(v => {
                if (!tfVariants.includes(v)) tfVariants.push(v);
            });
        }

        // Query Supabase for latest candles (descending to fetch latest rows up to limit)
        const { data, error } = await supabase
            .from('market_candles')
            .select('*')
            .in('symbol', symbolVariants)
            .in('timeframe', tfVariants)
            .order('time', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ candles: [], support: null, resistance: null }, {
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Chronological order is required for indicator calculations and lightweight-charts
        const candles = data.reverse();

        // Calculate EMAs
        const closePrices = candles.map(c => Number(c.close));
        const ema20Raw = EMA.calculate({ period: 20, values: closePrices });
        const ema50Raw = EMA.calculate({ period: 50, values: closePrices });
        const ema200Raw = EMA.calculate({ period: 200, values: closePrices });

        const ema20 = alignIndicator(candles, ema20Raw, 20);
        const ema50 = alignIndicator(candles, ema50Raw, 50);
        const ema200 = alignIndicator(candles, ema200Raw, 200);

        // Calculate SuperTrend (10, 3)
        const superTrendData = calculateSuperTrend(candles, 10, 3);

        // Map and enrich candles with calculated indicators
        const enrichedCandles = candles.map((c, index) => ({
            time: c.time,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
            tick_volume: Number(c.tick_volume || 0),
            ema20: ema20[index],
            ema50: ema50[index],
            ema200: ema200[index],
            supertrend_value: superTrendData[index]?.value,
            supertrend_direction: superTrendData[index]?.direction
        }));

        // Calculate Support & Resistance Levels
        const srLevels = calculateSupportResistance(candles);
        const strongestSupport = srLevels.support[0]?.price ?? null;
        const strongestResistance = srLevels.resistance[0]?.price ?? null;

        return NextResponse.json({
            candles: enrichedCandles,
            support: strongestSupport,
            resistance: strongestResistance
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });

    } catch (err) {
        console.error('API Error in candles endpoint:', err);
        return NextResponse.json({ error: err.message }, {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
