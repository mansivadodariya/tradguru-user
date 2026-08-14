'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import ContinueWithGoogle from '@/components/continueWithGoogle';
import { authApi, profileApi } from '@/lib/api';
import { persistAuthSession, getAuthRedirectTarget, getStoredUser, getStoredUserId, clearAuthSession } from '@/lib/authSession';
import { validateLogin } from '@/lib/validation';
import { toast } from '@/components/toast';
import PhoneInput from '@/components/phoneInput';
import FirebasePhoneModal from '@/components/firebasePhoneModal';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { supabase } from '@/lib/supabaseClient';

import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/languageToggle';

const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const EmailIcon = '/assets/icons/sms.svg';
const Lock = '/assets/icons/lock.svg';

const Login = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const redirectTo = getAuthRedirectTarget(searchParams);
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // States for phone step after Google Sign-in
    const [pendingPhoneUserId, setPendingPhoneUserId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);

    useEffect(() => {
        console.log('Login mount/update: pendingPhoneUserId =', pendingPhoneUserId);
    }, [pendingPhoneUserId]);

    useEffect(() => {
        const checkSession = async () => {
            const uid = getStoredUserId();
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const hasCookie = typeof document !== 'undefined' && document.cookie.split(';').some(c => c.trim().startsWith('auth_token='));
            console.log('Login checkSession: uid =', uid, 'token =', token, 'hasCookie =', hasCookie);
            if (uid && token && hasCookie && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('phone_number, is_active')
                        .eq('id', uid)
                        .single();

                    console.log('Login checkSession: supabase data =', data, 'error =', error);

                    // User deleted/not found (PGRST116 is Supabase error for 0 rows returned)
                    const isUserDeleted = error?.code === 'PGRST116' || (!data && !error);
                    if (isUserDeleted) {
                        clearAuthSession();
                        toast.error('Your account has been deleted. Please contact admin.');
                        return;
                    }

                    // For other transient errors (network drop, RLS timeout), do not log out the user
                    if (error || !data) {
                        console.error('Login checkSession: Failed to verify user status due to error:', error);
                        return;
                    }

                    // User inactive
                    if (data.is_active === false) {
                        clearAuthSession();
                        toast.error('Your account is inactive. Please contact admin.');
                        return;
                    }

                    const user = getStoredUser();

                    if (!user?.phone_number && !data?.phone_number) {
                        console.log('Login checkSession: No phone number found, setting pending uid =', uid);
                        setPendingPhoneUserId(uid);
                    } else {
                        console.log('Login checkSession: Phone number exists:', data?.phone_number || user?.phone_number);
                        if (user) {
                            user.phone_number = data?.phone_number || user?.phone_number || '';
                            localStorage.setItem('user', JSON.stringify(user));
                        }
                        document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                        window.location.assign(redirectTo);
                    }
                } catch (e) {
                    console.error('Error fetching user status', e);
                }
            }
        };

        const needPhone = searchParams?.get('need_phone');
        const queryUid = searchParams?.get('uid');
        console.log('Login URL params: needPhone =', needPhone, 'queryUid =', queryUid);
        if (needPhone && queryUid) {
            setPendingPhoneUserId(queryUid);
        } else {
            checkSession();
        }
    }, [searchParams, redirectTo]);

    const set = (field) => (e) => {
        const val = e.target.value.trimStart();
        setForm((f) => ({ ...f, [field]: val }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const fieldErrors = validateLogin(form);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }
        setLoading(true);
        try {
            const data = await authApi.login(form.email, form.password);
            persistAuthSession(data);
            window.location.assign(redirectTo);
        } catch (err) {
            toast.dismiss();
            toast.error(typeof err.message === 'string' ? err.message : 'Something went wrong. Please try again.');
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

        setPhoneError('');
        // OTP verification flow commented out for now:
        // setShowOtpModal(true);
        handleOtpSuccess();
    };

    const handleOtpSuccess = async () => {
        setSavingPhone(true);
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
            const activeUid = pendingPhoneUserId || stored.id || (typeof window !== 'undefined' ? localStorage.getItem('user_id') : null);
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

            if (typeof window !== 'undefined') {
                const parsed = JSON.parse(localStorage.getItem('user') || '{}');
                parsed.phone_number = phoneNumber;
                parsed.is_phone_verified = true;
                localStorage.setItem('user', JSON.stringify(parsed));
                document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                window.dispatchEvent(new CustomEvent('user:updated'));
            }

            toast.success(apiRes?.message || 'Phone number verified and saved!');
            window.location.assign(redirectTo);
        } catch (err) {
            console.error('Failed to save phone number after verification:', err);
            const msg = String(err.message || '');
            let userFriendlyMsg = 'Failed to save phone number.';
            if (msg.includes('unique constraint') || msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('already in use')) {
                userFriendlyMsg = 'This phone number is already in use.';
            } else if (msg) {
                userFriendlyMsg = msg;
            }
            setPhoneError(userFriendlyMsg);
            toast.error(userFriendlyMsg);
        } finally {
            setSavingPhone(false);
            setShowOtpModal(false);
        }
    };

    return (
        <div className={styles.loginpage}>
            <div className={styles.box}>
                <div className={styles.layer}></div>
                <div className={styles.lineimage}>
                    <img src={LineImage} alt="" aria-hidden="true" />
                </div>
                <div className={styles.relative}>
                    <div className={styles.icon} onClick={() => router.push("/")}>
                        <img src={AuthIcon} alt="" aria-hidden="true" />
                    </div>
                    {pendingPhoneUserId ? (
                        <>
                            <div className={styles.text}>
                                <h2>{t('auth.completeProfile', 'Complete Your Profile')}</h2>
                                <p>{t('auth.enterPhoneDesc', 'Please enter your phone number to continue.')}</p>
                            </div>
                            <form onSubmit={handleSavePhoneNumber} noValidate>
                                <div className={styles.spacingGrid}>
                                    <PhoneInput
                                        label={t('profile.phoneLabel', 'Phone Number')}
                                        value={phoneNumber}
                                        onChange={(val) => {
                                            setPhoneNumber(val || '');
                                            setPhoneError('');
                                        }}
                                        placeholder={t('profile.phoneLabel', 'Phone number')}
                                        error={phoneError}
                                        defaultCountry="AE"
                                    />
                                    <Button
                                        text={savingPhone ? t('auth.saving', 'Saving...') : t('auth.continue', 'Continue')}
                                        type="submit"
                                        disabled={savingPhone}
                                        icon={ArrowIcon}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearAuthSession();
                                            window.location.assign('/');
                                        }}
                                        className={styles.backBtn}
                                    >
                                        {t('auth.backToHome', 'Back to Home')}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className={styles.text}>
                                <h2>{t('auth.loginHeader', 'Log In')}</h2>
                                <p>{t('auth.loginDesc', 'Log in to your account to access AI strategy tools and market analysis.')}</p>
                            </div>
                            <form onSubmit={handleSubmit} noValidate>
                                <div className={styles.spacingGrid}>
                                    <Input icon={EmailIcon} placeholder={t('auth.emailPlaceholder', 'Email')} type="email" name="email" value={form.email} onChange={set('email')} error={errors.email} maxLength={100} />
                                    <Input icon={Lock} placeholder={t('auth.passwordPlaceholder', 'Password')} type="password" name="password" value={form.password} onChange={set('password')} error={errors.password} maxLength={50} />
                                    <div className={styles.forgotRow}>
                                        <Link href="/forgot-password">{t('auth.forgotPasswordQuestion', 'Forgot password?')}</Link>
                                    </div>
                                    <Button text={loading ? t('auth.loggingInBtn', 'Logging in...') : t('auth.loginBtn', 'Log in')} icon={ArrowIcon} disabled={loading} type="submit" />
                                </div>
                            </form>
                            <div className={styles.accountText}>
                                <p>{t('auth.noAccount', "Don't have an account?")} <Link href="/signup">{t('auth.signupHeader', 'Sign up')}</Link></p>
                            </div>
                            <div className={styles.orText}><span>{t('auth.or', 'or')}</span></div>
                            <ContinueWithGoogle redirectTo={redirectTo} onPendingPhone={setPendingPhoneUserId} />
                        </>
                    )}
                </div>
            </div>

            <FirebasePhoneModal
                isOpen={showOtpModal}
                phoneNumber={phoneNumber}
                onClose={() => setShowOtpModal(false)}
                onSuccess={handleOtpSuccess}
            />
        </div>
    );
};

export default Login;
