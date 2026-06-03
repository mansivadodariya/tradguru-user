import { extractAvailableCredits, notifyCreditsUpdated } from '@/lib/credits';

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

const DEFAULT_ROLE_ID = '44b71348-74d5-42ef-831a-be7c2da4882e';

// Prevent multiple simultaneous refresh calls
let refreshPromise = null;

function clearAuthAndRedirect() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

async function tryRefreshToken() {
    const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('refresh_token')
        : null;

    if (!refreshToken) return null;

    // Deduplicate concurrent refresh calls
    if (!refreshPromise) {
        refreshPromise = fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accept: 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        })
            .then(async (res) => {
                if (!res.ok) return null;
                const data = await res.json().catch(() => null);
                const newToken = data?.data?.access_token || data?.access_token;
                const newRefresh = data?.data?.refresh_token || data?.refresh_token;
                if (!newToken) return null;
                localStorage.setItem('access_token', newToken);
                if (newRefresh) localStorage.setItem('refresh_token', newRefresh);
                document.cookie = `auth_token=${newToken}; path=/; SameSite=Lax`;
                return newToken;
            })
            .catch(() => null)
            .finally(() => { refreshPromise = null; });
    }

    return refreshPromise;
}

async function request(path, options = {}, _isRetry = false) {
    const { headers, ...restOptions } = options;
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...headers,
        },
        ...restOptions,
    });

    if (res.status === 401 && !_isRetry) {
        // Try to refresh and retry once
        const newToken = await tryRefreshToken();
        if (newToken) {
            // Rebuild options with the new token in Authorization header
            const retryOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${newToken}`,
                },
            };
            return request(path, retryOptions, true);
        }
        // Refresh failed — log out
        clearAuthAndRedirect();
        const err = new Error('Session expired. Please log in again.');
        err.status = 401;
        throw err;
    }

    if (res.status === 401 || res.status === 403) {
        clearAuthAndRedirect();
        const err = new Error('Session expired. Please log in again.');
        err.status = 401;
        throw err;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data?.detail?.message || data?.message || 'Something went wrong');

    const credits = extractAvailableCredits(data);
    if (credits !== null) notifyCreditsUpdated(credits);

    return data;
}

export const authApi = {
    signup: (body) =>
        request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ ...body, role_id: DEFAULT_ROLE_ID }),
        }),

    verifyEmail: (token) =>
        request(`/auth/verify-email?token=${encodeURIComponent(token)}`),

    login: (email, password) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, isAdmin: false }),
        }),

    refreshToken: (refresh_token) =>
        request('/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refresh_token }),
        }),

    forgotPassword: (email) =>
        request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    resetPassword: (token, new_password) =>
        request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, new_password }),
        }),

    googleLogin: (credential) =>
        request('/auth/google-login', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        }),
};

function getAuthHeaders() {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
    }
    return {};
}

export const fxApi = {
    chat: (pair, message, user_id) =>
        request('/chat', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ pair, message, user_id }),
        }),

    generateBlog: (input_data, is_content) =>
        request('/blog_generation', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ input_data, is_content }),
        }),

    getBlogHistory: (user_id) =>
        request(`/users/${user_id}/blog-history`, {
            headers: getAuthHeaders(),
        }),

    getQuestionHistory: (user_id) =>
        request(`/users/${user_id}/question-history`, {
            headers: getAuthHeaders(),
        }),

    deleteQuestionHistoryItem: (user_id, history_id) =>
        request(`/users/${user_id}/question-history/${history_id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }),

    deleteBlogHistoryItem: (user_id, history_id) =>
        request(`/users/${user_id}/blog-history/${history_id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }),
};

export const dashboardApi = {
    getStats: (user_id) =>
        request(`/users/${user_id}/dashboard/stats`, {
            headers: getAuthHeaders(),
        }),

    getRecentActivity: (user_id) =>
        request(`/users/${user_id}/dashboard/recent-activity`, {
            headers: getAuthHeaders(),
        }),
};

export const tradeSnapApi = {
    getAnalysisHistory: (user_id) =>
        request(`/users/${user_id}/analysis-history`, {
            headers: getAuthHeaders(),
        }),

    deleteAnalysisHistoryItem: (user_id, history_id) =>
        request(`/users/${user_id}/analysis-history/${history_id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }),
};

