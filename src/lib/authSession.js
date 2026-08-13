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
        if (stored && stored !== 'undefined' && stored !== 'null') {
            const parsed = JSON.parse(stored);
            const id = parsed?.id || parsed?.user_id;
            if (id && id !== 'undefined' && id !== 'null') return String(id);
        }
    } catch {
        /* ignore */
    }
    const standalone = localStorage.getItem('user_id');
    return (standalone && standalone !== 'undefined' && standalone !== 'null') ? String(standalone) : '';
}

export function getStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('user');
        if (stored && stored !== 'undefined' && stored !== 'null') return JSON.parse(stored);
    } catch {
        /* ignore */
    }
    return null;
}

import { supabase } from '@/lib/supabaseClient';

/**
 * Hydrate missing user identity fields (first_name, last_name, email, profile_picture)
 * from Supabase or backend API and update localStorage & fire user:updated event.
 */
export async function hydrateUserFromProfile(userId, currentUser = null) {
    if (typeof window === 'undefined') return currentUser;
    const uid = userId || getStoredUserId();
    if (!uid) return currentUser;

    const existing = currentUser || getStoredUser() || {};
    const hasIdentity = Boolean(
        existing?.first_name || existing?.last_name || existing?.name || existing?.email
    );

    // If identity fields already exist, return existing user
    if (hasIdentity) {
        return existing;
    }

    try {
        let profileData = null;

        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('first_name, last_name, email, name, phone_number, profile_picture')
                    .eq('id', uid)
                    .maybeSingle();

                if (data && !error) {
                    profileData = data;
                }
            } catch (sbErr) {
                console.warn('Supabase profile hydration warning:', sbErr);
            }
        }

        if (!profileData || (!profileData.first_name && !profileData.last_name && !profileData.name && !profileData.email)) {
            const token = localStorage.getItem('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1` : '';
            if (token && baseUrl) {
                try {
                    const res = await fetch(`${baseUrl}/profile`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                            'ngrok-skip-browser-warning': 'true',
                        },
                    });
                    if (res.ok) {
                        const resJson = await res.json();
                        profileData = resJson?.data || resJson;
                    }
                } catch (apiErr) {
                    console.warn('Backend profile fetch error:', apiErr);
                }
            }
        }

        if (profileData) {
            const fullName = profileData.name || profileData.full_name || '';
            const nameParts = fullName.trim().split(/\s+/);
            const firstName = profileData.first_name || (nameParts[0] !== '' ? nameParts[0] : '') || existing.first_name || '';
            const lastName = profileData.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '') || existing.last_name || '';

            const mergedUser = {
                ...existing,
                id: uid,
                user_id: uid,
                first_name: firstName,
                last_name: lastName,
                name: profileData.name || existing.name || (firstName || lastName ? `${firstName} ${lastName}`.trim() : ''),
                email: profileData.email || existing.email || '',
                phone_number: profileData.phone_number || existing.phone_number || '',
                profile_picture: profileData.profile_picture || profileData.picture || existing.profile_picture || '',
            };

            localStorage.setItem('user', JSON.stringify(mergedUser));
            window.dispatchEvent(new CustomEvent('user:updated'));
            return mergedUser;
        }
    } catch (e) {
        console.warn('Failed to hydrate user profile:', e);
    }

    return existing;
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
    const fullName = user.name || data.name || user.full_name || data.full_name || '';
    const nameParts = fullName.trim().split(/\s+/);

    let existingLogins = [];
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed?.last_logins)) existingLogins = parsed.last_logins;
        }
    } catch (_) {}

    const incomingLogins = Array.isArray(user.last_logins || data.last_logins)
        ? (user.last_logins || data.last_logins)
        : existingLogins;

    const now = new Date().toISOString();
    let updatedLogins = [...incomingLogins];
    if (updatedLogins.length === 0 || updatedLogins[updatedLogins.length - 1] !== now) {
        updatedLogins.push(now);
    }
    updatedLogins = updatedLogins.slice(-5);

    const sessionUser = {
        id: userId || user.id || user.user_id || '',
        user_id: userId || user.user_id || user.id || '',
        first_name: user.first_name || data.first_name || (nameParts[0] !== '' ? nameParts[0] : '') || '',
        last_name: user.last_name || data.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '') || '',
        email: user.email || data.email || '',
        phone_number: user.phone_number || data.phone_number || '',
        referral_code: user.referral_code || data.referral_code || '',
        last_logins: updatedLogins,
    };

    const hasPhone = Boolean(sessionUser.phone_number);
    document.cookie = `has_phone=${hasPhone}; path=/; SameSite=Lax`;

    localStorage.setItem('user', JSON.stringify(sessionUser));
    window.dispatchEvent(new CustomEvent('user:updated'));

    // If sessionUser is missing identity info, trigger async profile hydration
    if (sessionUser.id && (!sessionUser.first_name && !sessionUser.last_name && !sessionUser.name)) {
        hydrateUserFromProfile(sessionUser.id, sessionUser);
    }

    return sessionUser;
}

export function clearAuthSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'has_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

export function setPhoneVerifiedInSession(phoneNumber) {
    if (typeof window === 'undefined') return;
    if (phoneNumber) {
        document.cookie = 'has_phone=true; path=/; SameSite=Lax';
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                parsed.phone_number = phoneNumber;
                parsed.is_phone_verified = true;
                localStorage.setItem('user', JSON.stringify(parsed));
            } catch (_) {}
        }
        window.dispatchEvent(new CustomEvent('user:updated'));
    }
}

