/**
 * Utility for managing persistent device UUIDs.
 * Used to enforce device-based signup limits on the backend.
 */

const DEVICE_ID_KEY = 'device_id';

/**
 * Safely generates or retrieves a persistent device UUID stored in localStorage.
 * Handles SSR safely in Next.js applications.
 *
 * @returns {string | null} Unique device UUID string or null if SSR.
 */
export function getOrCreateDeviceId() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);

        if (!deviceId) {
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                deviceId = crypto.randomUUID();
            } else {
                // Fallback UUID v4 generator for older environments
                deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = (Math.random() * 16) | 0;
                    const v = c === 'x' ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                });
            }

            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
    } catch (e) {
        console.warn('Failed to access localStorage for device ID:', e);
        return null;
    }
}

/**
 * Retrieves existing device ID from localStorage without generating a new one.
 *
 * @returns {string | null}
 */
export function getDeviceId() {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        return localStorage.getItem(DEVICE_ID_KEY);
    } catch {
        return null;
    }
}
