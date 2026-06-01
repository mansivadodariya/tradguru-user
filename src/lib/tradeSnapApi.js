function getAccessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

/**
 * Normalize one trade record to the shape used by AnalysisResultItem (webapp parity).
 */
export function normalizeTradeRecord(trade) {
    if (!trade || typeof trade !== 'object') return null;
    if (trade.error) return trade;

    const targets = trade.targets ?? trade.Targets ?? {};

    return {
        ...trade,
        symbol: trade.symbol ?? trade.Symbol,
        trade_call: trade.trade_call ?? trade.tradeCall,
        Trade: trade.Trade ?? trade.trade,
        timeframe: trade.timeframe ?? trade.Timeframe,
        confidence: trade.confidence ?? trade.Confidence,
        entry: trade.entry ?? trade.Entry,
        stop_loss: trade.stop_loss ?? trade.Stop_loss ?? trade.stopLoss,
        risk_reward: trade.risk_reward ?? trade.Risk_reward,
        rationale: trade.rationale ?? trade.Rationale,
        targets: targets && typeof targets === 'object' ? targets : {},
        Support_price: trade.Support_price ?? trade.support_price,
        Resistance_price: trade.Resistance_price ?? trade.resistance_price,
        Current_price: trade.Current_price ?? trade.current_price,
    };
}

function unwrapAnalysisPayload(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    if (Array.isArray(raw)) return raw;

    if (raw.Response && typeof raw.Response === 'object') {
        const inner = raw.Response;
        if (inner.trade_call || inner.Trade || inner.entry || inner.Targets || inner.targets) {
            return inner;
        }
    }

    if (
        raw.response &&
        typeof raw.response === 'object' &&
        !raw.trade_call &&
        !raw.Trade &&
        !raw.entry
    ) {
        const inner = raw.response;
        if (inner.trade_call || inner.Trade || inner.entry || inner.Targets || inner.targets) {
            return inner;
        }
    }

    return raw;
}

/**
 * Extract trade analysis from API / history payloads (supports ai_response, Response, etc.).
 * @returns {object[]}
 */
export function extractTradesFromPayload(payload) {
    if (!payload) return [];

    let raw =
        payload.ai_response ??
        payload.aiResponse ??
        payload.Response ??
        payload.response ??
        null;

    if (!raw) {
        if (
            payload.trade_call ||
            payload.Trade ||
            payload.entry ||
            payload.Targets ||
            payload.targets
        ) {
            raw = payload;
        } else if (payload.status === 'success' && payload.Response) {
            raw = payload.Response;
        } else {
            raw = payload.analysis ?? payload.result ?? payload.data ?? payload;
        }
    }

    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw);
        } catch {
            return [];
        }
    }

    raw = unwrapAnalysisPayload(raw);

    if (Array.isArray(raw)) {
        return raw.map(normalizeTradeRecord).filter(Boolean);
    }

    const normalized = normalizeTradeRecord(raw);
    return normalized ? [normalized] : [];
}

const TRADE_SNAP_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * @param {Blob[]} fileBlobs - one for single mode, two for multi-timeframe
 * @param {string} [userId]
 */
export async function analyzeTradeScreenshots(fileBlobs, userId) {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated. Please log in again.');

    const formData = new FormData();

    fileBlobs.forEach((blob, index) => {
        const name = fileBlobs.length > 1 ? `screenshot${index + 1}.png` : 'screenshot.png';
        formData.append('files', blob, name);
    });

    const storedId =
        userId ||
        (typeof window !== 'undefined' ? localStorage.getItem('user_id') : null);
    if (storedId) {
        formData.append('user_id', storedId);
    }

    const res = await fetch(`${TRADE_SNAP_BASE}/api/v1/analyze`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data?.detail?.message || data?.message || data?.detail || 'Analysis request failed');
    }

    if (data.user_id && typeof window !== 'undefined' && !localStorage.getItem('user_id')) {
        localStorage.setItem('user_id', data.user_id);
    }

    const trades = extractTradesFromPayload(data);
    const ai_response = trades.length === 1 ? trades[0] : trades.length > 1 ? trades : null;

    return { ...data, ai_response };
}

export async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
}
