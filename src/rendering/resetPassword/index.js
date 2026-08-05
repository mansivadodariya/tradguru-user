'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './resetPassword.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import { authApi } from '@/lib/api';
import { validateResetPassword } from '@/lib/validation';
import { toast } from '@/components/toast';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/languageToggle';

const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';

const ResetPassword = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const token = searchParams.get('token') || '';

    const [form, setForm] = useState({ new_password: '', confirm_password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const set = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (!token) {
            toast.error('Reset token is missing or invalid.');
            return;
        }

        const fieldErrors = validateResetPassword(form);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }

        setLoading(true);
        try {
            await authApi.resetPassword(token, form.new_password);
            setDone(true);
        } catch (err) {
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
                        <h2>{t('auth.resetPasswordHeader', 'Reset Password')}</h2>
                        <p>{t('auth.resetPasswordDesc', 'Enter your new password below.')}</p>
                    </div>
                    {done ? (
                        <div className={styles.success} role="status">
                            <p>{t('auth.resetPasswordSuccess', 'Password reset successfully.')}</p>
                            <Link href="/login">{t('auth.backToLogin', 'Back to Log in')}</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate>
                            <div className={styles.spacingGrid}>
                                <Input label={t('auth.newPasswordLabel', 'New Password')} placeholder={t('auth.newPasswordPlaceholder', 'Enter new password')} type="password" name="new_password" value={form.new_password} onChange={set('new_password')} error={errors.new_password} maxLength={50} />
                                <Input label={t('auth.confirmPasswordLabel', 'Confirm Password')} placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm new password')} type="password" name="confirm_password" value={form.confirm_password} onChange={set('confirm_password')} error={errors.confirm_password} maxLength={50} />
                                <Button
                                    type="submit"
                                    fullWidth
                                    text={loading ? t('auth.resettingPasswordBtn', 'Resetting...') : t('auth.resetPasswordHeader', 'Reset Password')}
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

export default ResetPassword;
