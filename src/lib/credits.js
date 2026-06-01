import { getStoredUserId } from '@/lib/authSession';

export const CREDITS_UPDATED_EVENT = 'credits:updated';

/**
 * Read available credits from common API response shapes.
 */
export function extractAvailableCredits(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const candidates = [
        payload?.data?.available_credits,
        payload?.data?.availableCredits,
        payload?.available_credits,
        payload?.availableCredits,
        payload?.data?.credits?.available,
        payload?.credits?.available,
        payload?.data?.user?.available_credits,
        payload?.user?.available_credits,
    ];

    for (const val of candidates) {
        if (val !== undefined && val !== null && val !== '') {
            const num = Number(val);
            return Number.isNaN(num) ? val : num;
        }
    }
    return null;
}

export function notifyCreditsUpdated(availableCredits) {
    if (typeof window === 'undefined') return;
    if (availableCredits === undefined || availableCredits === null) return;

    window.dispatchEvent(
        new CustomEvent(CREDITS_UPDATED_EVENT, {
            detail: { available_credits: availableCredits },
        })
    );
}

/** Sync credits from dashboard stats (when response body has no credit field). */
export async function refreshCreditsFromServer() {
    const userId = getStoredUserId();
    if (!userId) return null;

    try {
        const { dashboardApi } = await import('@/lib/api');
        const res = await dashboardApi.getStats(userId);
        const credits = extractAvailableCredits(res) ?? res?.data?.available_credits ?? null;
        if (credits !== null && credits !== undefined) {
            notifyCreditsUpdated(credits);
        }
        return credits;
    } catch {
        return null;
    }
}

/** Apply credits from an API payload, or refetch from server if missing. */
export async function syncCreditsAfterAction(payload) {
    const fromResponse = extractAvailableCredits(payload);
    if (fromResponse !== null) {
        notifyCreditsUpdated(fromResponse);
        return fromResponse;
    }
    return refreshCreditsFromServer();
}
