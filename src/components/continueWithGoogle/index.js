'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './continueWithGoogle.module.scss';
import { authApi } from '@/lib/api';
import { persistAuthSession } from '@/lib/authSession';

const GoogleIcon = '/assets/icons/google.svg';

const ContinueWithGoogle = () => {
    const router = useRouter();
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const initialized = useRef(false);
    const btnContainerRef = useRef(null);
    // Keep a stable ref to the latest handler so the Google SDK always calls current logic
    const callbackRef = useRef(null);

    callbackRef.current = async (response) => {
        // response.credential is the Google ID token
        if (!response?.credential) {
            setError('Google sign-in failed.');
            return;
        }

        setError('');
        setPending(false);
        try {
            const result = await authApi.googleLogin(response.credential);

            if (result?.data?.access_token) {
                persistAuthSession(result);
                router.push('/dashboard');
            } else {
                // Case B: new user awaiting admin approval
                setPending(true);
            }
        } catch (err) {
            setError(typeof err.message === 'string' ? err.message : 'Google sign-in failed.');
        }
    };

    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const init = () => {
            if (initialized.current) return;

            const container = btnContainerRef.current;
            if (!container) return;

            initialized.current = true;

            window.google.accounts.id.disableAutoSelect();

            // ID token flow — sends `credential` (JWT) to the backend
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => callbackRef.current(response),
                auto_select: false,
                context: 'signin',
            });

            container.innerHTML = '';
            const width = Math.min(400, Math.max(240, container.offsetWidth || 320));

            // Invisible native button handles auth; custom label below stays consistent on live + local
            window.google.accounts.id.renderButton(container, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width,
            });
        };

        if (window.google?.accounts?.id) {
            init();
        } else {
            const scriptId = 'google-gsi-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = init;
                document.head.appendChild(script);
            } else {
                const interval = setInterval(() => {
                    if (window.google?.accounts?.id) {
                        clearInterval(interval);
                        init();
                    }
                }, 100);
            }
        }
    }, []);

    return (
        <div className={styles.continueWithGoogle}>
            {error && <p className={styles.error} role="alert">{error}</p>}
            {pending && (
                <p className={styles.pending} role="status">
                    Sign up successful! Your account is awaiting admin approval.
                </p>
            )}
            <div className={styles.googleBtnWrapper}>
                <div className={styles.customGoogleBtn} aria-hidden="true">
                    <img src={GoogleIcon} alt="" />
                    <span>Sign in with Google</span>
                </div>
                <div
                    ref={btnContainerRef}
                    id="google-signin-btn"
                    className={styles.googleNativeBtn}
                    aria-label="Sign in with Google"
                />
            </div>
        </div>
    );
};

export default ContinueWithGoogle;

