
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './signup.module.scss';
import Input from '@/components/input';
import PhoneInput from '@/components/phoneInput';
import FirebasePhoneModal from '@/components/firebasePhoneModal';
import Button from '@/components/button';
import ContinueWithGoogle from '@/components/continueWithGoogle';
import { getAuthRedirectTarget, getStoredUser, getStoredUserId, clearAuthSession } from '@/lib/authSession';
import { useSearchParams } from 'next/navigation';
import { authApi, profileApi } from '@/lib/api';
import { validateSignup } from '@/lib/validation';
import { toast } from '@/components/toast';
import { supabase } from '@/lib/supabaseClient';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { getUtmParameters } from '@/lib/utm';

import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/languageToggle';

const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const Profile = '/assets/icons/profile.svg';
const EmailIcon = '/assets/icons/sms.svg';
const Lock = '/assets/icons/lock.svg';

const Signup = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const codeFromQuery = searchParams.get('code') || searchParams.get('referral_code') || '';
    const redirectTo = getAuthRedirectTarget(searchParams);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: '',
        referral_code: codeFromQuery
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // States for phone step after Google Sign-in
    const [pendingPhoneUserId, setPendingPhoneUserId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);

    useEffect(() => {
        console.log('Signup mount/update: pendingPhoneUserId =', pendingPhoneUserId);
    }, [pendingPhoneUserId]);

    useEffect(() => {
        const checkSession = async () => {
            const uid = getStoredUserId();
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const hasCookie = typeof document !== 'undefined' && document.cookie.split(';').some(c => c.trim().startsWith('auth_token='));
            console.log('Signup checkSession: uid =', uid, 'token =', token, 'hasCookie =', hasCookie);
            if (uid && token && hasCookie && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('phone_number, is_active')
                        .eq('id', uid)
                        .single();

                    console.log('Signup checkSession: supabase data =', data, 'error =', error);

                    // User deleted/not found (PGRST116 is Supabase error for 0 rows returned)
                    const isUserDeleted = error?.code === 'PGRST116' || (!data && !error);
                    if (isUserDeleted) {
                        clearAuthSession();
                        toast.error('Your account has been deleted. Please contact admin.');
                        return;
                    }

                    // For other transient errors (network drop, RLS timeout), do not log out the user
                    if (error || !data) {
                        console.error('Signup checkSession: Failed to verify user status due to error:', error);
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
                        console.log('Signup checkSession: No phone number found, setting pending uid =', uid);
                        setPendingPhoneUserId(uid);
                    } else {
                        console.log('Signup checkSession: Phone number exists:', data?.phone_number || user?.phone_number);
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
        console.log('Signup URL params: needPhone =', needPhone, 'queryUid =', queryUid);
        if (needPhone && queryUid) {
            setPendingPhoneUserId(queryUid);
        } else {
            checkSession();
        }
    }, [searchParams, redirectTo]);

    const set = (field) => (e) => {
        let val = e.target.value.trimStart();
        if (field === 'first_name' || field === 'last_name') {
            val = val.replace(/[^a-zA-Z\s]/g, '');
        }
        setForm((f) => ({ ...f, [field]: val }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const setPhone = (value) => {
        setForm((f) => ({ ...f, phone_number: value || '' }));
        if (errors.phone_number) setErrors((prev) => ({ ...prev, phone_number: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fieldErrors = validateSignup(form);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }
        setLoading(true);
        try {
            const { confirmPassword, ...payload } = form;
            const utmParams = getUtmParameters();
            await authApi.signup({
                ...payload,
                utm_source: utmParams.utm_source || null,
                utm_medium: utmParams.utm_medium || null,
                utm_campaign: utmParams.utm_campaign || null
            });

            try {
                if (supabase && (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign)) {
                    const { error: dbErr } = await supabase
                        .from('users')
                        .update({
                            utm_source: utmParams.utm_source || null,
                            utm_medium: utmParams.utm_medium || null,
                            utm_campaign: utmParams.utm_campaign || null
                        })
                        .eq('email', payload.email);
                    if (dbErr) {
                        console.warn("Direct UTM update on registration failed:", dbErr);
                    }
                }
            } catch (dbSyncErr) {
                console.warn("Database UTM sync error on registration:", dbSyncErr);
            }

            setSuccess(true);
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
            const firstName = form.first_name || stored.first_name || '';
            const lastName = form.last_name || stored.last_name || '';

            const apiRes = await profileApi.updateProfile({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
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
                parsed.first_name = firstName.trim() || parsed.first_name || '';
                parsed.last_name = lastName.trim() || parsed.last_name || '';
                parsed.phone_number = phoneNumber;
                parsed.is_phone_verified = true;
                localStorage.setItem('user', JSON.stringify(parsed));
                document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                window.dispatchEvent(new CustomEvent('user:updated'));
            }

            toast.success(apiRes?.message || 'Phone number verified successfully!');
            window.location.assign(redirectTo);
        } catch (err) {
            console.error('Failed to save phone number:', err);
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

    if (success) {
        return (
            <div className={styles.signuppage}>
                <div className={styles.box}>
                    <div className={styles.layer}></div>
                    <div className={styles.relative}>
                        <div className={styles.icon}>
                            <img src={AuthIcon} alt="" aria-hidden="true" onClick={() => router.push("/")} />
                        </div>
                        <div className={styles.text}>
                            <h2>{t('auth.checkEmail', 'Check your email')}</h2>
                            <p>{t('auth.verificationSent', `We sent a verification link to ${form.email}. Click the link to activate your account.`)}</p>
                            <p className={styles.note}>
                                {t('auth.spamNote', "Note: If you don't find the email in your inbox, please check your spam folder.")}
                            </p>
                        </div>
                        <div className={styles.accountText}>
                            <p><Link href="/login">{t('auth.backToLogin', 'Back to Log in')}</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.signuppage}>
            <div className={styles.box}>
                <div className={styles.layer}></div>
                <div className={styles.lineimage}>
                    <img src={LineImage} alt="" aria-hidden="true" />
                </div>
                <div className={styles.relative}>
                    <div className={styles.icon}>
                        <img src={AuthIcon} alt="" aria-hidden="true" onClick={() => router.push("/")} />
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
                                <h2>{t('auth.signupHeader', 'Sign Up')}</h2>
                                <p>{t('auth.signupDesc', 'Get set up so you can start your trading experience.')}</p>
                            </div>
                            <form onSubmit={handleSubmit} noValidate>
                                <div className={styles.spacingGrid}>
                                    <div className={styles.twoCol}>
                                        <Input icon={Profile} placeholder={t('auth.firstNameLabel', 'First Name')} name="first_name" value={form.first_name} onChange={set('first_name')} error={errors.first_name} maxLength={50} />
                                        <Input icon={Profile} placeholder={t('auth.lastNameLabel', 'Last Name')} name="last_name" value={form.last_name} onChange={set('last_name')} error={errors.last_name} maxLength={50} />
                                    </div>
                                    <Input icon={EmailIcon} placeholder={t('auth.emailPlaceholder', 'Email')} type="email" name="email" value={form.email} onChange={set('email')} error={errors.email} maxLength={100} />
                                    <PhoneInput
                                        label=""
                                        placeholder={t('profile.phoneLabel', 'Phone no')}
                                        value={form.phone_number}
                                        onChange={setPhone}
                                        error={errors.phone_number}
                                        defaultCountry="AE"
                                    />
                                    <div className={styles.twoCol}>
                                        <Input icon={Lock} placeholder={t('auth.passwordPlaceholder', 'Password')} type="password" name="password" value={form.password} onChange={set('password')} error={errors.password} maxLength={50} />
                                        <Input icon={Lock} placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm Password')} type="password" name="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} maxLength={50} />
                                    </div>
                                    <Input
                                        icon={Profile}
                                        placeholder={t('auth.referralOptional', 'Referral Code (Optional)')}
                                        name="referral_code"
                                        value={form.referral_code}
                                        onChange={set('referral_code')}
                                        error={errors.referral_code}
                                        maxLength={50}
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        text={loading ? t('auth.signingUpBtn', 'Signing up...') : t('auth.signupHeader', 'Sign up')}
                                        icon={ArrowIcon}
                                        disabled={loading}
                                    />
                                </div>
                            </form>
                            <div className={styles.accountText}>
                                <p>{t('auth.alreadyHaveAccount', 'Already have an account?')} <Link href="/login">{t('auth.loginHeader', 'Log in')}</Link></p>
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

export default Signup;
