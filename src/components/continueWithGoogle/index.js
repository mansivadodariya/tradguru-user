'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './continueWithGoogle.module.scss';
import { authApi } from '@/lib/api';
import {
    persistAuthSession,
    extractAccessToken,
    isGooglePendingApproval,
} from '@/lib/authSession';
import { toast } from '@/components/toast';

const GoogleIcon = '/assets/icons/google.svg';

const ContinueWithGoogle = ({ redirectTo = '/dashboard' }) => {
    const router = useRouter();
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const [loading, setLoading] = useState(false);
    const initialized = useRef(false);
    const btnContainerRef = useRef(null);
    const redirectRef = useRef(redirectTo);

    redirectRef.current = redirectTo;

    const callbackRef = useRef(null);

    callbackRef.current = async (response) => {
        if (!response?.credential) {
            setError('Google sign-in failed.');
            return;
        }

        setError('');
        setPending(false);
        setLoading(true);

        try {
            const result = await authApi.googleLogin(response.credential);
            const accessToken = extractAccessToken(result);

            if (accessToken) {
                persistAuthSession(result);
                const target = redirectRef.current || '/dashboard';
                // Hard navigation ensures middleware sees auth cookie immediately
                if (typeof window !== 'undefined') {
                    window.location.assign(target);
                } else {
                    router.replace(target);
                    router.refresh();
                }
                return;
            }

            if (isGooglePendingApproval(result)) {
                setPending(true);
                toast.success(
                    result?.message ||
                        'Sign up successful! Your account is awaiting admin approval.'
                );
                return;
            }

            toast.error(
                result?.message || 'Google sign-in could not be completed. Please try again.'
            );
        } catch (err) {
            setError(typeof err.message === 'string' ? err.message : 'Google sign-in failed.');
            toast.error(
                typeof err.message === 'string' ? err.message : 'Google sign-in failed.'
            );
        } finally {
            setLoading(false);
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

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => callbackRef.current(response),
                auto_select: false,
                context: 'signin',
            });

            container.innerHTML = '';
            const width = Math.min(400, Math.max(240, container.offsetWidth || 320));

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
            {loading && (
                <p className={styles.loading} role="status">
                    Signing in with Google...
                </p>
            )}
            {pending && (
                <p className={styles.pending} role="status">
                    Sign up successful! Your account is awaiting admin approval. You will be able
                    to log in after an admin approves your account.
                </p>
            )}
            <div className={styles.googleBtnWrapper}>
                <div className={styles.customGoogleBtn} aria-hidden="true">
                    <img src={GoogleIcon} alt="" />
                    <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
                </div>
                <div
                    ref={btnContainerRef}
                    id="google-signin-btn"
                    className={styles.googleNativeBtn}
                    aria-label="Sign in with Google"
                    aria-busy={loading}
                />
            </div>
        </div>
    );
};

export default ContinueWithGoogle;
