'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './paymentStatusModal.module.scss';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';
import { refreshCreditsFromServer } from '@/lib/credits';

function PaymentStatusModalContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { t, language } = useLanguage();

    const [modalState, setModalState] = useState(null); // 'success' | 'failed' | null
    const [details, setDetails] = useState({ credits: '', amount: '', plan: '' });

    useEffect(() => {
        if (!searchParams) return;

        const payment = (searchParams.get('payment') || '').toLowerCase();
        const successParam = (searchParams.get('success') || '').toLowerCase();
        const status = (searchParams.get('status') || '').toLowerCase();

        const isSuccess =
            payment === 'success' ||
            successParam === 'true' ||
            status === 'success';

        const isFailed =
            payment === 'failed' ||
            payment === 'cancel' ||
            payment === 'cancelled' ||
            payment === 'error' ||
            successParam === 'false' ||
            status === 'failed' ||
            status === 'cancel' ||
            status === 'cancelled' ||
            status === 'error';

        if (isSuccess) {
            setModalState('success');
            setDetails({
                credits: searchParams.get('credits') || '',
                amount: searchParams.get('amount') || '',
                plan: searchParams.get('plan') || '',
            });

            // Automatically refresh user credits from server on success!
            refreshCreditsFromServer();
            cleanSearchParams();
        } else if (isFailed) {
            setModalState('failed');
            setDetails({
                credits: searchParams.get('credits') || '',
                amount: searchParams.get('amount') || '',
                plan: searchParams.get('plan') || '',
            });
            cleanSearchParams();
        }
    }, [searchParams]);

    const cleanSearchParams = () => {
        if (typeof window === 'undefined') return;
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('payment');
            url.searchParams.delete('success');
            url.searchParams.delete('status');
            url.searchParams.delete('credits');
            url.searchParams.delete('amount');
            url.searchParams.delete('plan');
            url.searchParams.delete('tx_id');
            url.searchParams.delete('transaction_id');
            window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        } catch (_) {
            /* ignore */
        }
    };

    const handleClose = () => {
        setModalState(null);
    };

    if (!modalState) return null;

    const isSuccess = modalState === 'success';

    return (
        <div className={styles.modalOverlay} onClick={handleClose} role="dialog" aria-modal="true">
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={handleClose}
                    aria-label={t('common.close', 'Close')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Animated Icon */}
                <div className={styles.iconWrapper}>
                    {isSuccess ? (
                        <>
                            <div className={styles.successGlow} />
                            <svg className={styles.svgIcon} viewBox="0 0 52 52">
                                <circle className={styles.successCircle} cx="26" cy="26" r="25" fill="none" />
                                <path className={styles.successCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </>
                    ) : (
                        <>
                            <div className={styles.errorGlow} />
                            <svg className={styles.svgIcon} viewBox="0 0 52 52">
                                <circle className={styles.errorCircle} cx="26" cy="26" r="25" fill="none" />
                                <line className={styles.errorCross1} x1="16" y1="16" x2="36" y2="36" />
                                <line className={styles.errorCross2} x1="36" y1="16" x2="16" y2="36" />
                            </svg>
                        </>
                    )}
                </div>

                {/* Heading & Subtitle */}
                <h2 {...getBidiProps(isSuccess ? t('paymentStatus.successTitle', 'Payment Successful!') : t('paymentStatus.failedTitle', 'Payment Canceled / Failed'), styles.title)}>
                    {isSuccess
                        ? t('paymentStatus.successTitle', 'Payment Successful!')
                        : t('paymentStatus.failedTitle', 'Payment Canceled / Failed')}
                </h2>

                <p {...getBidiProps(isSuccess ? t('paymentStatus.successSubtitle', 'Your transaction was completed successfully. Credits have been added to your account balance.') : t('paymentStatus.failedSubtitle', 'The transaction was canceled or could not be completed. No charges were made.'), styles.subtitle)}>
                    {isSuccess
                        ? t('paymentStatus.successSubtitle', 'Your transaction was completed successfully. Credits have been added to your account balance.')
                        : t('paymentStatus.failedSubtitle', 'The transaction was canceled or could not be completed. No charges were made.')}
                </p>

                {/* Optional Details Badge */}
                {isSuccess && details.credits && (
                    <div className={styles.detailBadge}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>+{Number(details.credits).toLocaleString()} {t('plans.creditsUnit', 'Credits')}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className={styles.buttonGroup}>
                    {isSuccess ? (
                        <>
                            <Link
                                href="/credit-history"
                                className={styles.primaryBtn}
                                onClick={handleClose}
                            >
                                {t('paymentStatus.viewCredits', 'View Credit History')}
                            </Link>
                            <Link
                                href="/dashboard"
                                className={styles.secondaryBtn}
                                onClick={handleClose}
                            >
                                {t('paymentStatus.continue', 'Continue to Dashboard')}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/plans"
                                className={styles.primaryBtn}
                                onClick={handleClose}
                            >
                                {t('paymentStatus.tryAgain', 'Try Again')}
                            </Link>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={handleClose}
                            >
                                {t('paymentStatus.close', 'Close')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PaymentStatusModal() {
    return (
        <Suspense fallback={null}>
            <PaymentStatusModalContent />
        </Suspense>
    );
}
