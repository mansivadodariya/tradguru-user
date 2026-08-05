'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './forgotPassword.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import { authApi } from '@/lib/api';
import { validateForgotPassword } from '@/lib/validation';
import { toast } from '@/components/toast';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/languageToggle';

const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';

const ForgotPassword = () => {
    const router = useRouter();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleEmailChange = (e) => {
        const val = e.target.value.trimStart();
        setEmail(val);
        if (emailError) setEmailError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

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
            toast.dismiss();
            toast.error(typeof err.message === 'string' ? err.message : 'Something went wrong. Please try again.');
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
                    <div className={styles.icon} onClick={() => router.push("/")}>
                        <img src={AuthIcon} alt="" aria-hidden="true" />
                    </div>
                    <div className={styles.text}>
                        <h2>{t('auth.forgotPasswordTitle', 'Forgot Password')}</h2>
                        <p>{t('auth.forgotPasswordDesc', "Enter your email and we'll send you a link to reset your password. Please check your spam folder as well.")}</p>
                    </div>
                    {sent ? (
                        <div className={styles.success} role="status">
                            <p>{t('auth.checkResetEmail', "Check your email for a reset link. Please check your spam folder if you don't see it in your inbox.")}</p>
                            <div className={styles.accountText}>
                                <Link href="/login">{t('auth.backToLogin', 'Back to Log in')}</Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate>
                            <div className={styles.spacingGrid}>
                                <Input label={t('auth.emailLabel', 'Email')} placeholder={t('auth.emailPlaceholder', 'Email')} type="email" name="email" value={email} onChange={handleEmailChange} error={emailError} maxLength={100} />
                                <Button
                                    type="submit"
                                    fullWidth
                                    text={loading ? t('auth.sending', 'Sending...') : t('auth.sendResetBtn', 'Send Reset Link')}
                                    icon={ArrowIcon}
                                    disabled={loading}
                                />
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
