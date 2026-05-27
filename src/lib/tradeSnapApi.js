import { SignJWT } from 'jose';

const TRADE_SNAP_BASE =
    process.env.NEXT_PUBLIC_TRADE_SNAP_URL || 'https://api.forexbrokerlist.io/trade-snap';
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || 'gKlOOMqk8N9Lbw';

async function getSignedToken() {
    const secret = new TextEncoder().encode(API_SECRET);
    return new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);
}

/**
 * @param {Blob[]} fileBlobs - one for single mode, two for multi-timeframe
 * @param {string} [userId]
 */
export async function analyzeTradeScreenshots(fileBlobs, userId) {
    const apiKey = await getSignedToken();
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
            apiKey,
            'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data?.message || data?.detail || 'Analysis request failed');
    }

    if (data.user_id && typeof window !== 'undefined' && !localStorage.getItem('user_id')) {
        localStorage.setItem('user_id', data.user_id);
    }

    return data;
}

export async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
}
