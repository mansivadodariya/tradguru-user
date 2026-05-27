'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './forgotPassword.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import { authApi } from '@/lib/api';
import { validateForgotPassword } from '@/lib/validation';

const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleEmailChange = (e) => {
        const val = e.target.value.trimStart();
        setEmail(val);
        if (emailError) setEmailError('');
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const fieldError = validateForgotPassword(email);
        if (fieldError) {
            setEmailError(fieldError);
            return;
        }

        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.box}>
                <div className={styles.layer}></div>
                <div className={styles.lineimage}>
                    <img src={LineImage} alt="" aria-hidden="true" />
                </div>
                <div className={styles.relative}>
                    <div className={styles.icon}>
                        <img src={AuthIcon} alt="" aria-hidden="true" />
                    </div>
                    <div className={styles.text}>
                        <h2>Forgot Password</h2>
                        <p>Enter your email and we&apos;ll send you a link to reset your password.</p>
                    </div>
                    {sent ? (
                        <div className={styles.success} role="status">
                            <p>Check your email for a reset link.</p>
                            <div className={styles.accountText}>

                                <Link href="/login">Back to Log in</Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate>
                            <div className={styles.spacingGrid}>
                                <Input label="Email" placeholder=" johnfrans@gmail.com" type="email" name="email" value={email} onChange={handleEmailChange} error={emailError} />
                                {error && <p className={styles.error} role="alert">{error}</p>}
                                <Button text={loading ? 'Sending...' : 'Send Reset Link'} icon={ArrowIcon} disabled={loading} />
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
