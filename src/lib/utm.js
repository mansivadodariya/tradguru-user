/**
 * Utility to capture, persist, and build UTM links.
 */

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign'];

/**
 * Capture UTM parameters from the current URL query string and store them in sessionStorage.
 */
export function captureUtmParameters() {
    if (typeof window === 'undefined') return;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        let hasUtm = false;
        const utmData = {};

        UTM_PARAMS.forEach(param => {
            if (urlParams.has(param)) {
                utmData[param] = urlParams.get(param);
                hasUtm = true;
            }
        });

        if (hasUtm) {
            sessionStorage.setItem('tg_utm_parameters', JSON.stringify(utmData));
        }
    } catch (e) {
        console.error('Error capturing UTM parameters:', e);
    }
}

/**
 * Retrieve saved UTM parameters from sessionStorage and current URL, merging them with defaults.
 */
export function getUtmParameters(defaults = {}) {
    if (typeof window === 'undefined') return defaults;

    const merged = { ...defaults };

    try {
        // 1. Get from sessionStorage
        const saved = sessionStorage.getItem('tg_utm_parameters');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(merged, parsed);
        }

        // 2. Override with current URL if present
        const urlParams = new URLSearchParams(window.location.search);
        UTM_PARAMS.forEach(param => {
            if (urlParams.has(param)) {
                merged[param] = urlParams.get(param);
            }
        });
    } catch (e) {
        console.error('Error retrieving UTM parameters:', e);
    }

    return merged;
}

/**
 * Append UTM parameters to a given URL.
 */
export function appendUtmParameters(url, defaults = {}) {
    try {
        const utmParams = getUtmParameters(defaults);
        const urlObj = new URL(url);

        Object.keys(utmParams).forEach(key => {
            if (utmParams[key]) {
                urlObj.searchParams.set(key, utmParams[key]);
            }
        });

        return urlObj.toString();
    } catch (e) {
        console.error('Error appending UTM parameters to URL:', e);
        return url;
    }
}
