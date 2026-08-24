import { extractAvailableCredits, notifyCreditsUpdated, refreshCreditsFromServer } from '@/lib/credits';
import { tryRefreshToken, clearAuthAndRedirect } from '@/lib/api';

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

    let targets = trade.targets ?? trade.Targets ?? {};
    const rawTargets = trade['Target(s)'] ?? trade['targets(s)'] ?? trade['Targets(s)'];
    if (typeof rawTargets === 'string') {
        const parts = rawTargets.split(',').map(s => s.trim());
        targets = {};
        parts.forEach((part, index) => {
            const split = part.split(':').map(s => s.trim());
            if (split.length === 2) {
                targets[split[0].toLowerCase()] = split[1];
            } else {
                targets[`tp${index + 1}`] = part;
            }
        });
    } else if (rawTargets && typeof rawTargets === 'object') {
        targets = rawTargets;
    }

    return {
        ...trade,
        symbol: trade.symbol ?? trade.Symbol ?? 'Unknown',
        trade_call: trade.trade_call ?? trade.tradeCall ?? trade['Trade Call'] ?? '—',
        Trade: trade.Trade ?? trade.trade ?? trade['Horizon'] ?? '—',
        timeframe: trade.timeframe ?? trade.Timeframe ?? '—',
        confidence: trade.confidence ?? trade.Confidence ?? trade['Confidence'] ?? '0%',
        entry: trade.entry ?? trade.Entry ?? trade['Entry Zone'] ?? '—',
        stop_loss: trade.stop_loss ?? trade.Stop_loss ?? trade.stopLoss ?? trade['Stop-Loss'] ?? '—',
        risk_reward: trade.risk_reward ?? trade.Risk_reward ?? trade['R:R'] ?? '—',
        rationale: trade.rationale ?? trade.Rationale ?? trade['Rationale'] ?? '',
        targets,
        Support_price: trade.Support_price ?? trade.support_price ?? '—',
        Resistance_price: trade.Resistance_price ?? trade.resistance_price ?? '—',
        Current_price: trade.Current_price ?? trade.current_price ?? '—',
    };
}

function unwrapAnalysisPayload(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    if (Array.isArray(raw)) return raw;

    if (raw.Response && typeof raw.Response === 'object') {
        const inner = raw.Response;
        if (inner.trade_call || inner.Trade || inner.entry || inner.Targets || inner.targets || inner['Trade Call'] || inner['Entry Zone']) {
            return inner;
        }
    }

    if (
        raw.response &&
        typeof raw.response === 'object' &&
        !raw.trade_call &&
        !raw.Trade &&
        !raw.entry &&
        !raw['Trade Call'] &&
        !raw['Entry Zone']
    ) {
        const inner = raw.response;
        if (inner.trade_call || inner.Trade || inner.entry || inner.Targets || inner.targets || inner['Trade Call'] || inner['Entry Zone']) {
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
        payload.content ??
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
            payload.targets ||
            payload['Trade Call'] ||
            payload['Entry Zone']
        ) {
            raw = payload;
        } else if (payload.status === 'success' && payload.Response) {
            raw = payload.Response;
        } else {
            raw = payload.analysis ?? payload.result ?? payload.data ?? payload;
        }
    }

    // If raw is an array of history items, we only want the latest history item's content/data for the active view
    if (Array.isArray(raw)) {
        if (raw.length > 0 && raw[0] && typeof raw[0] === 'object' && (raw[0].content || Array.isArray(raw[0].data))) {
            raw = raw[0];
        }
    }

    // If raw is a single history item object (which has a nested content string or data array of trades)
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        if (raw.content) {
            raw = raw.content;
        } else if (Array.isArray(raw.data)) {
            raw = raw.data;
        } else if (raw.analysis_data && Array.isArray(raw.analysis_data)) {
            raw = raw.analysis_data;
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
export async function analyzeTradeScreenshots(fileBlobs, userId, _isRetry = false) {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated. Please log in again.');

    const formData = new FormData();

    fileBlobs.forEach((blob, index) => {
        const name = fileBlobs.length > 1 ? `screenshot${index + 1}.png` : 'screenshot.png';
        formData.append('files', blob, name);
        if (index === 0) {
            formData.append('image', blob, name);
        }
    });

    const storedId =
        userId ||
        (typeof window !== 'undefined' ? localStorage.getItem('user_id') : null);
    if (storedId) {
        formData.append('user_id', storedId);
    }

    let res;
    try {
        res = await fetch(`${TRADE_SNAP_BASE}/api/v1/ai-snap`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true',
            },
            body: formData,
        });
    } catch {
        res = await fetch(`${TRADE_SNAP_BASE}/api/v1/analyze`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true',
            },
            body: formData,
        });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const isAuthError = res.status === 401 || res.status === 403 ||
            (typeof data?.detail === 'string' && data.detail.toLowerCase().includes('token'));

        if (isAuthError && !_isRetry) {
            const newToken = await tryRefreshToken();
            if (newToken) {
                return analyzeTradeScreenshots(fileBlobs, userId, true);
            }
        }

        if (isAuthError) {
            clearAuthAndRedirect();
            const err = new Error('Session expired. Please log in again.');
            err.status = 401;
            throw err;
        }

        const err = new Error(data?.detail?.message || data?.message || data?.detail || 'Analysis request failed');
        err.detail = data?.detail;
        err.status = res.status;
        throw err;
    }

    if (data.user_id && typeof window !== 'undefined' && !localStorage.getItem('user_id')) {
        localStorage.setItem('user_id', data.user_id);
    }

    const trades = extractTradesFromPayload(data);
    const ai_response = trades.length === 1 ? trades[0] : trades.length > 1 ? trades : null;

    const credits = extractAvailableCredits(data);
    if (credits !== null) {
        notifyCreditsUpdated(credits);
    } else {
        refreshCreditsFromServer();
    }

    return { ...data, ai_response };
}

export async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
}
