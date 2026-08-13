'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './continueWithGoogle.module.scss';
import { authApi, profileApi } from '@/lib/api';
import {
    persistAuthSession,
    extractAccessToken,
    isGooglePendingApproval,
} from '@/lib/authSession';
import { toast } from '@/components/toast';
import { supabase } from '@/lib/supabaseClient';
import PhoneInput from '@/components/phoneInput';
import Button from '@/components/button';
import { isValidPhoneNumber } from 'react-phone-number-input';
import FirebasePhoneModal from '@/components/firebasePhoneModal';

const GoogleIcon = '/assets/icons/google.svg';

const ContinueWithGoogle = ({ redirectTo = '/dashboard', onPendingPhone }) => {
    const router = useRouter();
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const [loading, setLoading] = useState(false);
    const initialized = useRef(false);
    const btnContainerRef = useRef(null);
    const redirectRef = useRef(redirectTo);

    useEffect(() => {
        redirectRef.current = redirectTo;
    }, [redirectTo]);

    // States for phone number step (fallback if no onPendingPhone prop is passed)
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);
    const [userId, setUserId] = useState('');

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
                const data = result?.data ?? result ?? {};
                const uId = String(data.user_id || data.user?.id || data.user?.user_id || '').trim();
                
                // Persist session first so supabase client calls / cookie verification works
                persistAuthSession(result);

                let hasPhone = false;
                let userPhone = data.user?.phone_number || data.phone_number;

                if (!userPhone && supabase && uId) {
                    try {
                        const { data: dbUser } = await supabase
                            .from('users')
                            .select('phone_number')
                            .eq('id', uId)
                            .single();
                        userPhone = dbUser?.phone_number;
                    } catch (e) {
                        console.error('Error checking phone number', e);
                    }
                }

                if (userPhone) {
                    hasPhone = true;
                    // Update user in localStorage and cookies since we found it in supabase
                    if (typeof window !== 'undefined') {
                        const stored = localStorage.getItem('user');
                        if (stored) {
                            const parsed = JSON.parse(stored);
                            parsed.phone_number = userPhone;
                            localStorage.setItem('user', JSON.stringify(parsed));
                        }
                        document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                    }
                }

                if (!hasPhone) {
                    if (onPendingPhone) {
                        onPendingPhone(uId);
                    } else {
                        setUserId(uId);
                        setShowPhoneModal(true);
                    }
                    return;
                }
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
                router.push("/dashboard")
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

    const handleSavePhoneNumber = async (e) => {
        if (e) e.preventDefault();

        if (!phoneNumber) {
            setPhoneError('Phone number is required.');
            return;
        }

        if (!isValidPhoneNumber(phoneNumber)) {
            setPhoneError('Enter a valid phone number.');
            return;
        }

        setSavingPhone(true);
        setPhoneError('');

        try {
            const stored = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
            const firstName = stored.first_name || '';
            const lastName = stored.last_name || '';

            const apiRes = await profileApi.updateProfile({
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
            });

            // Update Supabase users table directly to set is_phone_verified = true
            const activeUid = stored.id || (typeof window !== 'undefined' ? localStorage.getItem('user_id') : null);
            if (supabase && activeUid) {
                try {
                    await supabase
                        .from('users')
                        .update({
                            phone_number: phoneNumber,
                            is_phone_verified: true
                        })
                        .eq('id', activeUid);
                } catch (dbErr) {
                    console.warn("Supabase direct phone verification update error:", dbErr);
                }
            }

            // Update user in localStorage
            if (typeof window !== 'undefined') {
                const parsed = JSON.parse(localStorage.getItem('user') || '{}');
                parsed.phone_number = phoneNumber;
                parsed.is_phone_verified = true;
                localStorage.setItem('user', JSON.stringify(parsed));
                document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                window.dispatchEvent(new CustomEvent('user:updated'));
            }

            toast.success(apiRes?.message || 'Profile completed successfully!');
            setShowPhoneModal(false);

            const target = redirectRef.current || '/dashboard';
            if (typeof window !== 'undefined') {
                window.location.assign(target);
            } else {
                router.replace(target);
                router.refresh();
            }
        } catch (err) {
            console.error('Failed to save phone number:', err);
            const msg = String(err.message || '');
            let userFriendlyMsg = 'Failed to complete profile.';
            if (msg.includes('unique constraint') || msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('already in use')) {
                userFriendlyMsg = 'This phone number is already in use.';
            } else if (msg) {
                userFriendlyMsg = msg;
            }
            setPhoneError(userFriendlyMsg);
            toast.error(userFriendlyMsg);
        } finally {
            setSavingPhone(false);
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

            <FirebasePhoneModal
                isOpen={showPhoneModal}
                phoneNumber={phoneNumber}
                onClose={() => setShowPhoneModal(false)}
                onSuccess={() => {
                    setShowPhoneModal(false);
                    const target = redirectRef.current || '/dashboard';
                    if (typeof window !== 'undefined') {
                        window.location.assign(target);
                    } else {
                        router.replace(target);
                        router.refresh();
                    }
                }}
            />
        </div>
    );
};

export default ContinueWithGoogle;
