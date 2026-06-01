'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import ContinueWithGoogle from '@/components/continueWithGoogle';
import { authApi } from '@/lib/api';
import { persistAuthSession, getAuthRedirectTarget } from '@/lib/authSession';
import { validateLogin } from '@/lib/validation';
import { toast } from '@/components/toast';

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
                    <div className={styles.text}>
                        <h2>Log In</h2>
                        <p>Log in to your account to continue building and editing your onboarding flows.</p>
                    </div>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className={styles.spacingGrid}>
                            <Input icon={EmailIcon} placeholder="Email" type="email" name="email" value={form.email} onChange={set('email')} error={errors.email} />
                            <Input icon={Lock} placeholder="Password" type="password" name="password" value={form.password} onChange={set('password')} error={errors.password} />
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
                    <ContinueWithGoogle redirectTo={redirectTo} />
                </div>
            </div>
        </div>
    );
};

export default Login;
