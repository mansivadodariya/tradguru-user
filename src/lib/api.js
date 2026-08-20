import { extractAvailableCredits, notifyCreditsUpdated } from '@/lib/credits';

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

const DEFAULT_ROLE_ID = '44b71348-74d5-42ef-831a-be7c2da4882e';

// Prevent multiple simultaneous refresh calls
let refreshPromise = null;

import { clearAuthSession } from '@/lib/authSession';

export function clearAuthAndRedirect() {
    if (typeof window === 'undefined') return;
    clearAuthSession();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

export async function tryRefreshToken() {
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

    const isAuthEndpoint = path.startsWith('/auth/');

    if (res.status === 401 && !_isRetry && !isAuthEndpoint) {
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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if ((res.status === 401 || res.status === 403) && !isAuthEndpoint) {
            clearAuthAndRedirect();
            const err = new Error('Session expired. Please log in again.');
            err.status = 401;
            throw err;
        }
        let errorMessage = null;

        // Handle string detail that may contain plain string or embedded JSON
        if (typeof data?.detail === 'string') {
            try {
                const jsonMatch = data.detail.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    errorMessage = parsed?.msg || parsed?.detail || parsed?.message;
                }
            } catch (_) {}
            if (!errorMessage) {
                errorMessage = data.detail;
            }
        }

        if (!errorMessage) {
            errorMessage = data?.detail?.message || data?.message || (typeof data?.detail === 'string' ? data.detail : null) || data?.error || 'Something went wrong';
        }

        const err = new Error(errorMessage);
        err.detail = data?.detail;
        err.status = res.status;
        throw err;
    }



    const credits = extractAvailableCredits(data);
    if (credits !== null) notifyCreditsUpdated(credits);

    return data;
}

import { getOrCreateDeviceId } from '@/lib/deviceId';

export const authApi = {
    signup: (body) => {
        const deviceId = getOrCreateDeviceId();
        const headers = deviceId ? { 'X-Device-Id': deviceId } : {};
        return request('/auth/signup', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ...body,
                role_id: DEFAULT_ROLE_ID,
                ...(deviceId ? { device_id: deviceId } : {})
            }),
        });
    },

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

    googleLogin: (credential) => {
        const deviceId = getOrCreateDeviceId();
        const headers = deviceId ? { 'X-Device-Id': deviceId } : {};
        return request('/auth/google-login', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                credential,
                ...(deviceId ? { device_id: deviceId } : {})
            }),
        });
    },

    verifyPhoneFirebase: (id_token, userId = '') =>
        request('/auth/verify-phone-firebase', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                ...(userId ? { 'X-User-Id': userId } : {}),
            },
            body: JSON.stringify({ id_token, user_id: userId }),
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

    getBlogHistory: (user_id) => {
        const path = (!user_id || user_id === 'all') ? '/users/blog-history' : `/users/blog-history?user_id=${user_id}`;
        return request(path, {
            headers: getAuthHeaders(),
        });
    },

    getQuestionHistory: (user_id) => {
        const path = (!user_id || user_id === 'all') ? '/users/question-history' : `/users/question-history?user_id=${user_id}`;
        return request(path, {
            headers: getAuthHeaders(),
        });
    },

    deleteQuestionHistoryItem: (user_id, history_id) =>
        request(`/users/question-history/${history_id}?user_id=${user_id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }),

    deleteBlogHistoryItem: (user_id, history_id) =>
        request(`/users/blog-history/${history_id}?user_id=${user_id}`, {
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
    getAnalysisHistory: (user_id) => {
        const path = (!user_id || user_id === 'all') ? '/users/analysis-history' : `/users/analysis-history?user_id=${user_id}`;
        return request(path, {
            headers: getAuthHeaders(),
        });
    },

    deleteAnalysisHistoryItem: (user_id, history_id) =>
        request(`/users/analysis-history/${history_id}?user_id=${user_id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }),
};

export const neweraApi = {
    linkAccount: async (user_id, email) => {
        const cleanEmail = String(email || '').trim().toLowerCase();
        const res = await request('/newera/credit', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email: cleanEmail }),
        });

        return {
            success: true,
            message: res?.message || 'Newera account linked successfully!',
            data: res?.data || res || {}
        };
    }
};

export const profileApi = {
    getProfile: () =>
        request('/profile', {
            method: 'GET',
            headers: getAuthHeaders(),
        }),

    updateProfile: ({ first_name = '', last_name = '', phone_number = '' } = {}) =>
        request('/profile', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                first_name,
                last_name,
                phone_number,
            }),
        }),
};

export const depositApi = {
    createDeposit: (payload) =>
        request('/deposit/create', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        }),

    getDepositHistory: (user_id) => {
        const path = (!user_id || user_id === 'all') ? '/deposit/history' : `/deposit/history?user_id=${user_id}`;
        return request(path, {
            headers: getAuthHeaders(),
        });
    },

    getDepositStatus: (deposit_id) =>
        request(`/deposit/${deposit_id}/status`, {
            headers: getAuthHeaders(),
        }),
};




