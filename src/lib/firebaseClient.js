'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';

const cleanEnv = (val, fallback = '') => {
    if (!val) return fallback;
    return String(val).replace(/^["']|["']$/g, '').trim() || fallback;
};

const firebaseConfig = {
    apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 'AIzaSyAeuqPAkgx_fuyIQ_zFq-Md6nE8HPQXi1w'),
    authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, 'the-trader-master.firebaseapp.com'),
    projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'the-trader-master'),
    storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, 'the-trader-master.firebasestorage.app'),
    messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, '638080398853'),
    appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, '1:638080398853:web:141fd5c1fcb143e72c4e6c'),
};

export function getFirebaseApp() {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
    const app = getFirebaseApp();
    return getAuth(app);
}

/**
 * Setup RecaptchaVerifier on a DOM element (containerId e.g. "recaptcha-container").
 */
export function initRecaptcha(containerId = 'recaptcha-container', options = {}) {
    if (typeof window === 'undefined') return null;

    const auth = getFirebaseAuth();

    if (window.recaptchaVerifier) {
        try {
            window.recaptchaVerifier.clear();
        } catch (_) {}
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
        size: options.size || 'invisible',
        callback: (response) => {
            if (options.onSuccess) options.onSuccess(response);
        },
        'expired-callback': () => {
            if (options.onExpired) options.onExpired();
        },
        ...options,
    });

    window.recaptchaVerifier = verifier;
    return verifier;
}

/**
 * Step 1: Send SMS OTP via Firebase signInWithPhoneNumber.
 * @param {string} phoneNumber E.164 formatted phone string (e.g. "+14155552671")
 * @param {object} recaptchaVerifier RecaptchaVerifier instance
 */
export async function sendFirebaseSmsOtp(phoneNumber, recaptchaVerifier) {
    const auth = getFirebaseAuth();
    const verifier = recaptchaVerifier || window.recaptchaVerifier;

    if (!verifier) {
        throw new Error('reCAPTCHA verifier is not initialized.');
    }

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
}

/**
 * Step 2: Verify 6-digit OTP code using confirmationResult.confirm(otpCode).
 * @param {object} confirmationResult Result object from signInWithPhoneNumber
 * @param {string} otpCode 6-digit OTP code string
 * @returns {Promise<{ idToken: string, phoneNumber: string, user: object }>}
 */
export async function verifyFirebaseSmsOtp(confirmationResult, otpCode) {
    const result = confirmationResult || window.confirmationResult;
    if (!result) {
        throw new Error('No active SMS verification session found. Please request a new code.');
    }

    const cleanCode = String(otpCode || '').replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
        throw new Error('Please enter all 6 digits of your SMS verification code.');
    }

    try {
        const userCredential = await result.confirm(cleanCode);
        const user = userCredential.user;
        const idToken = await user.getIdToken(true);

        return {
            idToken,
            phoneNumber: user.phoneNumber || '',
            user,
        };
    } catch (err) {
        if (err.code === 'auth/invalid-verification-code') {
            throw new Error('Invalid verification code. Please check the 6-digit code sent to your mobile phone.');
        }
        if (err.code === 'auth/code-expired') {
            throw new Error('This verification code has expired. Please click "Resend SMS OTP" to get a new code.');
        }
        throw err;
    }
}
