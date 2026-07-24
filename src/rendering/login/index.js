'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import ContinueWithGoogle from '@/components/continueWithGoogle';
import { authApi } from '@/lib/api';
import { persistAuthSession, getAuthRedirectTarget, getStoredUser, getStoredUserId, clearAuthSession } from '@/lib/authSession';
import { validateLogin } from '@/lib/validation';
import { toast } from '@/components/toast';
import PhoneInput from '@/components/phoneInput';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { supabase } from '@/lib/supabaseClient';

const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const EmailIcon = '/assets/icons/sms.svg';
const Lock = '/assets/icons/lock.svg';

const Login = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = getAuthRedirectTarget(searchParams);
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // States for phone step after Google Sign-in
    const [pendingPhoneUserId, setPendingPhoneUserId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);

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

                    // User deleted/not found
                    if (error || !data) {
                        clearAuthSession();
                        toast.error('Your account has been deleted. Please contact admin.');
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

        setSavingPhone(true);
        setPhoneError('');

        try {
            const apiRes = await fetch('/api/v1/user/phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: pendingPhoneUserId, phone_number: phoneNumber }),
            });
            const apiData = await apiRes.json();
            if (!apiRes.ok || apiData.error) {
                throw new Error(apiData.error || 'Failed to save phone number.');
            }

            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.phone_number = phoneNumber;
                    localStorage.setItem('user', JSON.stringify(parsed));
                }
                document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                window.dispatchEvent(new CustomEvent('user:updated'));
            }

            toast.success('Phone number saved successfully!');
            window.location.assign(redirectTo);
        } catch (err) {
            console.error('Failed to save phone number:', err);
            const msg = String(err.message || '');
            let userFriendlyMsg = 'Failed to save phone number.';
            if (msg.includes('unique constraint') || msg.includes('duplicate key') || msg.includes('already exists')) {
                userFriendlyMsg = 'This phone number is already in use.';
            }
            setPhoneError(userFriendlyMsg);
            toast.error(userFriendlyMsg);
        } finally {
            setSavingPhone(false);
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
                                <h2>Complete Your Profile</h2>
                                <p>Please enter your phone number to continue.</p>
                            </div>
                            <form onSubmit={handleSavePhoneNumber} noValidate>
                                <div className={styles.spacingGrid}>
                                    <PhoneInput
                                        label="Phone Number"
                                        value={phoneNumber}
                                        onChange={(val) => {
                                            setPhoneNumber(val || '');
                                            setPhoneError('');
                                        }}
                                        placeholder="Phone number"
                                        error={phoneError}
                                        defaultCountry="AE"
                                    />
                                    <Button
                                        text={savingPhone ? 'Saving...' : 'Continue'}
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
                                        Back to Home
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className={styles.text}>
                                <h2>Log In</h2>
                                <p>Log in to your account to continue building and editing your onboarding flows.</p>
                            </div>
                            <form onSubmit={handleSubmit} noValidate>
                                <div className={styles.spacingGrid}>
                                    <Input icon={EmailIcon} placeholder="Email" type="email" name="email" value={form.email} onChange={set('email')} error={errors.email} maxLength={100} />
                                    <Input icon={Lock} placeholder="Password" type="password" name="password" value={form.password} onChange={set('password')} error={errors.password} maxLength={50} />
                                    <div className={styles.forgotRow}>
                                        <Link href="/forgot-password">Forgot password?</Link>
                                    </div>
                                    <Button text={loading ? 'Logging in...' : 'Log in'} icon={ArrowIcon} disabled={loading} type="submit" />
                                </div>
                            </form>
                            <div className={styles.accountText}>
                                <p>Don&apos;t have an account? <Link href="/signup">Sign up</Link></p>
                            </div>
                            <div className={styles.orText}><span>or</span></div>
                            <ContinueWithGoogle redirectTo={redirectTo} onPendingPhone={setPendingPhoneUserId} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
