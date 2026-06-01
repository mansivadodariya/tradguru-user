'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './continueWithGoogle.module.scss';
import { authApi } from '@/lib/api';

const ContinueWithGoogle = () => {
    const router = useRouter();
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const initialized = useRef(false);
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
                // Case A: approved user — store tokens and redirect
                localStorage.setItem('access_token', result.data.access_token);
                localStorage.setItem('refresh_token', result.data.refresh_token);
                // Set cookie so proxy can verify auth on every request
                document.cookie = `auth_token=${result.data.access_token}; path=/; SameSite=Lax`;

                // Store user info for the topbar
                const user = result.data.user || {};
                localStorage.setItem('user', JSON.stringify({
                    id: user.id || user.user_id || '',
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    picture: user.picture || user.profile_picture || '',
                }));

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
            initialized.current = true;

            // Use ID token flow — sends `credential` (JWT) to the backend
            window.google.accounts.id.initialize({
                client_id: clientId,
                // Delegate to ref so the latest router/state is always used
                callback: (response) => callbackRef.current(response),
            });

            window.google.accounts.id.renderButton(
                document.getElementById('google-signin-btn'),
                { theme: 'outline', size: 'large', width: '100%', logo_alignment: 'center' }
            );
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
            {/* Google renders its own branded button here */}
            <div id="google-signin-btn" className={styles.googleBtnWrapper} />
        </div>
    );
};

export default ContinueWithGoogle;

