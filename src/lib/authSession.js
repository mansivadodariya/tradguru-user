/**
 * Shared auth session helpers — login, Google login, and API calls must use the same shape.
 */

/** Read access_token from login / google-login API bodies (nested or flat). */
export function extractAccessToken(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const candidates = [
        payload?.data?.access_token,
        payload?.data?.token,
        payload?.access_token,
        payload?.token,
    ];

    for (const token of candidates) {
        if (typeof token === 'string' && token.trim()) return token.trim();
    }
    return null;
}

/** True when API indicates a new Google user waiting for admin approval (no tokens). */
export function isGooglePendingApproval(payload) {
    if (extractAccessToken(payload)) return false;

    const data = payload?.data ?? payload ?? {};
    if (data.pending_approval || data.requires_approval || data.is_approved === false) {
        return true;
    }

    const message = String(payload?.message || data?.message || '');
    return /awaiting|approval|pending|admin/i.test(message);
}

export function getAuthRedirectTarget(searchParams) {
    if (!searchParams) return '/dashboard';
    return (
        searchParams.get('redirect') ||
        searchParams.get('from') ||
        '/dashboard'
    );
}

export function getStoredUserId() {
    if (typeof window === 'undefined') return '';
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            const id = parsed?.id || parsed?.user_id;
            if (id) return String(id);
        }
    } catch {
        /* ignore */
    }
    const standalone = localStorage.getItem('user_id');
    return standalone ? String(standalone) : '';
}

export function getStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) return JSON.parse(stored);
    } catch {
        /* ignore */
    }
    return null;
}

/**
 * Persist tokens + user after email or Google login.
 * @param {object} payload API body (`{ data: { access_token, user_id, user?, ... } }` or flat)
 */
export function persistAuthSession(payload) {
    if (typeof window === 'undefined') return null;

    const data = payload?.data ?? payload ?? {};
    const userId = String(
        data.user_id || data.user?.id || data.user?.user_id || ''
    ).trim();

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;

    if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        document.cookie = `auth_token=${accessToken}; path=/; SameSite=Lax`;
    }
    if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
    }
    if (userId) {
        localStorage.setItem('user_id', userId);
    }

    const user = data.user || {};
    const sessionUser = {
        id: userId || user.id || user.user_id || '',
        user_id: userId || user.user_id || user.id || '',
        first_name: user.first_name || data.first_name || '',
        last_name: user.last_name || data.last_name || '',
        email: user.email || data.email || '',
        picture: user.picture || user.profile_picture || data.picture || '',
    };

    localStorage.setItem('user', JSON.stringify(sessionUser));
    window.dispatchEvent(new CustomEvent('user:updated'));
    return sessionUser;
}

export function clearAuthSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}
