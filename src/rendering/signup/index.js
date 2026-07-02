
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './signup.module.scss';
import Input from '@/components/input';
import PhoneInput from '@/components/phoneInput';
import Button from '@/components/button';
import ContinueWithGoogle from '@/components/continueWithGoogle';
import { getAuthRedirectTarget, getStoredUser, getStoredUserId } from '@/lib/authSession';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { validateSignup } from '@/lib/validation';
import { toast } from '@/components/toast';
import { supabase } from '@/lib/supabaseClient';
import { isValidPhoneNumber } from 'react-phone-number-input';

const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const Profile = '/assets/icons/profile.svg';
const EmailIcon = '/assets/icons/sms.svg';
const Lock = '/assets/icons/lock.svg';

const Signup = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
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

    useEffect(() => {
        const checkSession = async () => {
            const uid = getStoredUserId();
            if (uid) {
                const user = getStoredUser();
                if (!user?.phone_number && supabase) {
                    try {
                        const { data } = await supabase
                            .from('users')
                            .select('phone_number')
                            .eq('id', uid)
                            .single();
                        if (!data?.phone_number) {
                            setPendingPhoneUserId(uid);
                        } else {
                            if (user) {
                                user.phone_number = data.phone_number;
                                localStorage.setItem('user', JSON.stringify(user));
                            }
                            window.location.assign(redirectTo);
                        }
                    } catch (e) {
                        console.error('Error fetching user phone status', e);
                    }
                }
            }
        };

        const needPhone = searchParams?.get('need_phone');
        const queryUid = searchParams?.get('uid');
        if (needPhone && queryUid) {
            setPendingPhoneUserId(queryUid);
        } else {
            checkSession();
        }
    }, [searchParams, redirectTo]);

    const set = (field) => (e) => {
        let val = e.target.value.trimStart();
        // Block numbers and special characters for name fields — only allow letters and spaces
        if (field === 'first_name' || field === 'last_name') {
            val = val.replace(/[^a-zA-Z\s]/g, '');
        }
        setForm((f) => ({ ...f, [field]: val }));
        // clear field error on change
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
            await authApi.signup(payload);
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

        setSavingPhone(true);
        setPhoneError('');

        try {
            if (!supabase) {
                throw new Error('Database client is not initialized.');
            }

            const { error: updateErr } = await supabase
                .from('users')
                .update({ phone_number: phoneNumber })
                .eq('id', pendingPhoneUserId);

            if (updateErr) throw updateErr;

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
                            <h2>Check your email</h2>
                            <p>We sent a verification link to <strong>{form.email}</strong>. Click the link to activate your account.</p>
                            <p className={styles.note}>
                                <strong>Note:</strong> If you don't find the email in your inbox, please check your spam folder.
                            </p>
                        </div>
                        <div className={styles.accountText}>
                            <p><Link href="/login">Back to Log in</Link></p>
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
                                        defaultCountry="IN"
                                    />
                                    <Button
                                        text={savingPhone ? 'Saving...' : 'Continue'}
                                        type="submit"
                                        disabled={savingPhone}
                                        icon={ArrowIcon}
                                    />
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className={styles.text}>
                                <h2>Sign Up</h2>
                                <p>Get set up so you can start your first onboarding experience.</p>
                            </div>
                            <form onSubmit={handleSubmit} noValidate>
                                <div className={styles.spacingGrid}>
                                    <div className={styles.twoCol}>
                                        <Input icon={Profile} placeholder="First Name" name="first_name" value={form.first_name} onChange={set('first_name')} error={errors.first_name} maxLength={50} />
                                        <Input icon={Profile} placeholder="Last Name" name="last_name" value={form.last_name} onChange={set('last_name')} error={errors.last_name} maxLength={50} />
                                    </div>
                                    <Input icon={EmailIcon} placeholder="Email" type="email" name="email" value={form.email} onChange={set('email')} error={errors.email} maxLength={100} />
                                    <PhoneInput
                                        label=""
                                        placeholder="Phone no"
                                        value={form.phone_number}
                                        onChange={setPhone}
                                        error={errors.phone_number}
                                        defaultCountry="IN"
                                    />
                                    <div className={styles.twoCol}>
                                        <Input icon={Lock} placeholder="Password" type="password" name="password" value={form.password} onChange={set('password')} error={errors.password} maxLength={50} />
                                        <Input icon={Lock} placeholder="Confirm Password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} maxLength={50} />
                                    </div>
                                    <Input
                                        icon={Profile}
                                        placeholder="Referral Code (Optional)"
                                        name="referral_code"
                                        value={form.referral_code}
                                        onChange={set('referral_code')}
                                        error={errors.referral_code}
                                        maxLength={50}
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        text={loading ? 'Signing up...' : 'Sign up'}
                                        icon={ArrowIcon}
                                        disabled={loading}
                                    />
                                </div>
                            </form>
                            <div className={styles.accountText}>
                                <p>Already have an account? <Link href="/login">Log in</Link></p>
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

export default Signup;
