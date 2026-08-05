'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import styles from './verifyEmail.module.scss';
import Loader from '@/components/loader';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/languageToggle';

const AuthIcon = '/assets/icons/auth.svg';
const LineImage = '/assets/images/line.png';

const STATUS = { LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' };

export default function VerifyEmail() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const token = searchParams.get('token') || '';
    const [status, setStatus] = useState(STATUS.LOADING);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setErrorMsg('No verification token found.');
            setStatus(STATUS.ERROR);
            return;
        }
        authApi.verifyEmail(token)
            .then(() => setStatus(STATUS.SUCCESS))
            .catch((err) => {
                setErrorMsg(typeof err.message === 'string' ? err.message : 'Verification failed.');
                setStatus(STATUS.ERROR);
            });
    }, [token]);

    return (
        <div className={styles.page}>
            <div className={styles.box}>
                <div className={styles.layer}></div>
                <div className={styles.lineimage}>
                    <img src={LineImage} alt="" aria-hidden="true" />
                </div>
                <div className={styles.relative}>
                    <div className={styles.icon}>
                        <img src={AuthIcon} alt="" aria-hidden="true" onClick={() => router.push("/")} />
                    </div>

                    {status === STATUS.LOADING && (
                        <div className={styles.text}>
                            <h2>{t('auth.verifyingEmailHeader', 'Verifying your email')}</h2>
                            <p>{t('auth.verifyingWait', 'Please wait a moment...')}</p>
                            <Loader centered />
                        </div>
                    )}

                    {status === STATUS.SUCCESS && (
                        <div className={styles.text}>
                            <div className={styles.checkmark} aria-hidden="true">✓</div>
                            <h2>{t('auth.emailVerifiedHeader', 'Email verified')}</h2>
                            <p>{t('auth.emailVerifiedDesc', 'Your account is active. You can now log in.')}</p>
                            <Link href="/login" className={styles.cta}>{t('auth.goToLogin', 'Go to Log In')}</Link>
                        </div>
                    )}

                    {status === STATUS.ERROR && (
                        <div className={styles.text}>
                            <div className={styles.errorIcon} aria-hidden="true">✕</div>
                            <h2>{t('auth.verificationFailedHeader', 'Verification failed')}</h2>
                            <p>{errorMsg}</p>
                            <Link href="/signup" className={styles.cta}>{t('auth.backToSignUp', 'Back to Sign Up')}</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
