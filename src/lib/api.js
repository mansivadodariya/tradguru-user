const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

const DEFAULT_ROLE_ID = '44b71348-74d5-42ef-831a-be7c2da4882e';

async function request(path, options = {}) {
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.detail || 'Something went wrong');
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
        request('/fx/chat', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ pair, message, user_id }),
        }),

    generateBlog: (input_data, is_content) =>
        request('/fx/blog_generation', {
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
};

