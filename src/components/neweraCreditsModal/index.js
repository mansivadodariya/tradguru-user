'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './neweraCreditsModal.module.scss';
import Input from '@/components/input';
import { neweraApi } from '@/lib/api';
import { toast } from '@/components/toast';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';
import { extractAvailableCredits, notifyCreditsUpdated, refreshCreditsFromServer } from '@/lib/credits';

function parseCreditAmount(res) {
    if (!res) return null;
    const candidates = [
        extractAvailableCredits(res),
        extractAvailableCredits(res?.data),
        res?.data?.credits_given,
        res?.data?.credits,
        res?.credits_given,
        res?.credits,
        res?.data?.data?.credits_given,
        res?.data?.data?.credits,
        res?.data?.available_credits,
        res?.data?.availableCredits,
    ];
    for (const val of candidates) {
        if (val !== undefined && val !== null && val !== '') {
            const num = Number(val);
            if (!isNaN(num)) return num;
        }
    }
    return null;
}

function renderWithBoldPlaceholders(templateText, replacements) {
    let parts = [templateText];

    Object.entries(replacements).forEach(([placeholder, value]) => {
        const nextParts = [];
        parts.forEach((part) => {
            if (typeof part === 'string' && part.includes(placeholder)) {
                const subParts = part.split(placeholder);
                subParts.forEach((sub, idx) => {
                    nextParts.push(sub);
                    if (idx < subParts.length - 1) {
                        nextParts.push(<strong key={`${placeholder}-${idx}`}>{value}</strong>);
                    }
                });
            } else {
                nextParts.push(part);
            }
        });
        parts = nextParts;
    });

    return parts;
}

export default function NeweraCreditsModal({ userId, onClose, onSuccess }) {
    const activeUserId = userId || getStoredUserId();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [welcomeAwarded, setWelcomeAwarded] = useState(false);
    const [depositAwarded, setDepositAwarded] = useState(false);
    const [hasExistingLink, setHasExistingLink] = useState(false);
    const [autoSyncing, setAutoSyncing] = useState(false);
    const [syncChecked, setSyncChecked] = useState(false);
    const [syncStatusMessage, setSyncStatusMessage] = useState('');
    const [welcomeCredits, setWelcomeCredits] = useState('100');
    const [depositThreshold, setDepositThreshold] = useState('150');
    const [depositCredits, setDepositCredits] = useState('100');
    const [tradeCreditsPerLot, setTradeCreditsPerLot] = useState('200');
    const isSyncingRef = useRef(false);
    const { theme } = useTheme();
    const { t } = useLanguage();

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.email) {
                    setEmail(parsed.email);
                }
            }
        } catch (e) {
            console.error('Error reading user email for Newera link:', e);
        }
    }, []);

    // Fetch dynamic system settings from system_settings table
    useEffect(() => {
        const fetchSystemSettings = async () => {
            if (!supabase) return;
            try {
                const { data } = await supabase
                    .from('system_settings')
                    .select('key, value')
                    .in('key', [
                        'newera_welcome_credits',
                        'newera_deposit_threshold',
                        'newera_deposit_credits',
                        'newera_trade_credits_per_lot'
                    ]);

                if (data && Array.isArray(data)) {
                    data.forEach((item) => {
                        if (item.key === 'newera_welcome_credits' && item.value) {
                            setWelcomeCredits(String(item.value));
                        }
                        if (item.key === 'newera_deposit_threshold' && item.value) {
                            setDepositThreshold(String(item.value));
                        }
                        if (item.key === 'newera_deposit_credits' && item.value) {
                            setDepositCredits(String(item.value));
                        }
                        if (item.key === 'newera_trade_credits_per_lot' && item.value) {
                            setTradeCreditsPerLot(String(item.value));
                        }
                    });
                }
            } catch (err) {
                console.error('Error fetching Newera system_settings:', err);
            }
        };

        fetchSystemSettings();
    }, []);

    // 1. Fetch account link and flags from Supabase newera_credits_sync or mt5_accounts
    useEffect(() => {
        const fetchLinkedAccount = async () => {
            const uid = userId || getStoredUserId();
            if (!uid || !supabase) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // 1. Try newera_credits_sync first
                const { data: syncData } = await supabase
                    .from('newera_credits_sync')
                    .select('email, welcome_credits_awarded, deposit_credits_awarded')
                    .eq('user_id', uid)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (syncData) {
                    if (syncData.email) setEmail(syncData.email);
                    setWelcomeAwarded(Boolean(syncData.welcome_credits_awarded));
                    setDepositAwarded(Boolean(syncData.deposit_credits_awarded));
                    setHasExistingLink(true);
                    setLoading(false);
                    return;
                }

                // 2. Try mt5_accounts fallback
                const { data: mt5Data } = await supabase
                    .from('mt5_accounts')
                    .select('email')
                    .eq('user_id', uid)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (mt5Data && mt5Data.email) {
                    setEmail(mt5Data.email);
                    setWelcomeAwarded(true);
                    setDepositAwarded(false);
                    setHasExistingLink(true);
                } else {
                    setWelcomeAwarded(false);
                    setDepositAwarded(false);
                }
            } catch (err) {
                console.error('Error fetching linked account:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLinkedAccount();
    }, [userId]);

    // Helper for syncing Phase 2 or Phase 3
    const syncCredits = useCallback(async () => {
        const uid = activeUserId;
        if (!uid || !email || isSyncingRef.current) return;
        isSyncingRef.current = true;
        setAutoSyncing(true);

        try {
            const res = await neweraApi.linkAccount(uid, email);

            // Synchronize flags returned by API response if available
            const apiRes = res?.data || res;
            if (apiRes) {
                if (apiRes.welcome_credits_awarded !== undefined && apiRes.welcome_credits_awarded !== null) {
                    setWelcomeAwarded(Boolean(apiRes.welcome_credits_awarded));
                }
                if (apiRes.deposit_credits_awarded !== undefined && apiRes.deposit_credits_awarded !== null) {
                    setDepositAwarded(Boolean(apiRes.deposit_credits_awarded));
                }
            }

            let earnedAmount = parseCreditAmount(res);

            // Fallback check from server stats
            if (earnedAmount === null || earnedAmount === undefined || earnedAmount <= 0) {
                const freshCredits = await refreshCreditsFromServer();
                if (freshCredits !== null && freshCredits !== undefined) {
                    const freshNum = Number(freshCredits);
                    if (freshNum > 0) {
                        earnedAmount = freshNum;
                    }
                }
            }

            if (earnedAmount !== null && earnedAmount !== undefined && earnedAmount > 0) {
                // If in Phase 2 (welcomeAwarded = true, depositAwarded = false), update deposit_credits_awarded in DB
                if (welcomeAwarded && !depositAwarded && supabase) {
                    try {
                        await supabase
                            .from('newera_credits_sync')
                            .update({ deposit_credits_awarded: true })
                            .eq('user_id', uid);
                        setDepositAwarded(true);
                    } catch (dbErr) {
                        console.error("Error updating deposit_credits_awarded:", dbErr);
                    }
                    toast.success(`Congratulations! You have received ${earnedAmount} deposit credits!`);
                } else if (welcomeAwarded && depositAwarded) {
                    toast.success(`Congratulations! You have received ${earnedAmount} trading credits!`);
                } else {
                    toast.success(`Congratulations! You have received ${earnedAmount} credits!`);
                }

                notifyCreditsUpdated(earnedAmount);
                if (onSuccess) onSuccess(earnedAmount);
                onClose?.();
                return;
            } else {
                setSyncChecked(true);
                setSyncStatusMessage('Checked just now. No new credits available yet.');
            }
        } catch (err) {
            console.warn("Credit sync failed:", err);
            setSyncChecked(true);
            setSyncStatusMessage('Failed to check credits. Retry below.');
        } finally {
            isSyncingRef.current = false;
            setAutoSyncing(false);
        }
    }, [activeUserId, email, welcomeAwarded, depositAwarded, onSuccess, onClose]);

    // Hit syncCredits when tab visibility changes to visible (e.g. after depositing in another tab)
    useEffect(() => {
        if (!activeUserId || !hasExistingLink || !welcomeAwarded || loading) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                syncCredits();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [activeUserId, hasExistingLink, welcomeAwarded, loading, syncCredits]);

    const logoSrc = theme === 'dark' ? '/assets/icons/Img1.svg' : '/assets/images/LightNewera.png';

    const handleLoginChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 20) {
            setLogin(val);
        }
    };

    // Phase 1 - Submit account connection
    const handleLinkAccount = async (e) => {
        e.preventDefault();
        const uid = activeUserId;
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !normalizedEmail.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await neweraApi.linkAccount(uid, normalizedEmail);
            if (res.success) {
                // Store in mt5_accounts
                try {
                    if (supabase) {
                        await supabase
                            .from('mt5_accounts')
                            .upsert({
                                user_id: uid,
                                email: normalizedEmail,
                            }, { onConflict: 'user_id' });
                    }
                } catch (dbErr) {
                    console.error("Database insert error for mt5_accounts:", dbErr);
                }

                // Store in newera_credits_sync setting welcome_credits_awarded = true
                try {
                    if (supabase) {
                        await supabase
                            .from('newera_credits_sync')
                            .upsert({
                                user_id: uid,
                                email: normalizedEmail,
                                welcome_credits_awarded: true,
                                deposit_credits_awarded: false
                            });
                    }
                } catch (dbErr) {
                    console.error("Database insert error for newera_credits_sync:", dbErr);
                }

                setHasExistingLink(true);
                setWelcomeAwarded(true);

                let earnedAmount = parseCreditAmount(res);
                if (earnedAmount === null || earnedAmount <= 0) {
                    const freshCredits = await refreshCreditsFromServer();
                    if (freshCredits !== null && freshCredits !== undefined) {
                        earnedAmount = Number(freshCredits);
                    }
                }

                if (earnedAmount !== null && earnedAmount > 0) {
                    notifyCreditsUpdated(earnedAmount);
                    toast.success(`Congratulations! You have received ${earnedAmount} welcome credits for linking your Newera account.`);
                    if (onSuccess) onSuccess(earnedAmount);
                    onClose?.();
                    return;
                }

                toast.success('Account linked successfully! Welcome credits will update shortly.');
            } else {
                const apiMsg = res.message || res.detail || 'Failed to link account.';
                setError(apiMsg);
                toast.error(apiMsg);
            }
        } catch (err) {
            const apiMsg = err?.detail || err?.message || 'An error occurred. Please try again.';
            setError(apiMsg);
            toast.error(apiMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegisterRedirect = () => {
        window.open('https://trade.newera365.com/client/register/6a68798de0aaa', '_blank', 'noopener,noreferrer');
        toast('Newera registration opened. Enter your email address here when done!');
    };

    // Determine current phase (Only rendered when loading is false)
    const isPhase1 = !welcomeAwarded;
    const isPhase2 = welcomeAwarded && !depositAwarded;
    const isPhase3 = welcomeAwarded && depositAwarded;

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={styles.box}>
                {/* Visual Brand Border accent */}
                <div className={styles.accentLayer}></div>
                
                {/* Newera Logo Header */}
                <div className={styles.brandHeader}>
                    <div className={styles.logoWrapper}>
                        <img src={logoSrc} alt="Newera Logo" className={styles.logoImg} />
                    </div>
                </div>

                <div className={styles.content}>
                    {/* While checking database status, render Loading view */}
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinnerLarge}></div>
                            <p {...getBidiProps(t('neweraModal.loadingDetails', 'Loading account details...'))}>
                                {t('neweraModal.loadingDetails', 'Loading account details...')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Phase 1 Header & Content */}
                            {isPhase1 && (
                                <>
                                    <h2 id="modal-title" className={styles.title}>
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" fill="#DC2626" />
                                            <path d="M12 7v6M12 16.5h.01" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>{t('neweraModal.welcomeBonus', 'Welcome Bonus')}</span>
                                    </h2>
                                    <div className={styles.welcomeText}>
                                        <p>
                                            {renderWithBoldPlaceholders(
                                                t('neweraModal.welcomeBonusSub', 'Connect your Newera trading account and receive your {credits} welcome credits instantly.'),
                                                { '{credits}': welcomeCredits }
                                            )}
                                        </p>
                                    </div>

                                    <div className={styles.optionsContainer}>
                                        {/* Step 1: Register card */}
                                        <div className={styles.optionCard}>
                                            <div className={styles.optionHeader}>
                                                <span className={styles.badgeStep}>1</span>
                                                <h3 {...getBidiProps(t('neweraModal.createNewAccount', 'Create New Account'))}>
                                                    {t('neweraModal.createNewAccount', 'Create New Account')}
                                                </h3>
                                            </div>
                                            <p className={styles.optionDesc}>
                                                {renderWithBoldPlaceholders(
                                                    t('neweraModal.createNewAccountDesc', "Don't have a Newera account? Register one in a new tab to start trading and get {credits} free credits."),
                                                    { '{credits}': welcomeCredits }
                                                )}
                                            </p>
                                            <button 
                                                type="button" 
                                                className={styles.registerBtn} 
                                                onClick={handleRegisterRedirect}
                                            >
                                                <span {...getBidiProps(t('neweraModal.registerAccountBtn', 'Register Account'))}>
                                                    {t('neweraModal.registerAccountBtn', 'Register Account')}
                                                </span>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Step 2: Link account card */}
                                        <div className={styles.optionCard}>
                                            <div className={styles.optionHeader}>
                                                <span className={styles.badgeStep}>2</span>
                                                <h3 {...getBidiProps(t('neweraModal.linkExistingAccount', 'Link Existing Account'))}>
                                                    {t('neweraModal.linkExistingAccount', 'Link Existing Account')}
                                                </h3>
                                            </div>
                                            <p className={styles.optionDesc}>
                                                {renderWithBoldPlaceholders(
                                                    t('neweraModal.linkExistingAccountDesc', 'Enter your Newera account email address below to claim your {credits} free credits.'),
                                                    { '{credits}': welcomeCredits }
                                                )}
                                            </p>

                                            <form onSubmit={handleLinkAccount} className={styles.linkForm}>
                                                <div className={styles.inputWrapper}>
                                                    <Input
                                                        type="email"
                                                        placeholder={t('neweraModal.enterEmailPlaceholder', 'Enter Email Address')}
                                                        name="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                            required
                                                            disabled
                                                    />
                                                </div>
                                                {error && <p className={styles.error} role="alert">{error}</p>}
                                                <button 
                                                    type="submit" 
                                                    className={styles.submitBtn} 
                                                    disabled={submitting || !email.trim() || !email.includes('@')}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <span className={styles.spinner}></span>
                                                            <span {...getBidiProps(t('neweraModal.linkingBtn', 'Linking...'))}>
                                                                {t('neweraModal.linkingBtn', 'Linking...')}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span {...getBidiProps(t('neweraModal.linkAccountBtn', 'Link Account'))}>
                                                            {t('neweraModal.linkAccountBtn', 'Link Account')}
                                                        </span>
                                                    )}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Phase 2 Header & Content: Deposit Bonus */}
                            {isPhase2 && (
                                <div className={styles.phaseContainer}>
                                    <h2 id="modal-title" className={styles.title} {...getBidiProps(t('neweraModal.depositBonusTitle', 'Deposit & Earn More Credits'))}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        {t('neweraModal.depositBonusTitle', 'Deposit & Earn More Credits')}
                                    </h2>

                                    <div className={styles.autoStatusCard}>
                                        {email && (
                                            <div className={styles.accountInfoBadge}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                    <polyline points="22,6 12,13 2,6"></polyline>
                                                </svg>
                                                <span {...getBidiProps(`${t('neweraModal.linkedEmail', 'Linked Email:')} ${email}`)}>
                                                    {t('neweraModal.linkedEmail', 'Linked Email:')} {email}
                                                </span>
                                            </div>
                                        )}

                                        <p className={styles.statusMessage}>
                                            {renderWithBoldPlaceholders(
                                                t('neweraModal.depositBonusDesc', 'Deposit {threshold} into your Newera trading account to receive {credits} additional credits.'),
                                                {
                                                    '{threshold}': String(depositThreshold).startsWith('$') ? depositThreshold : `$${depositThreshold}`,
                                                    '{credits}': depositCredits
                                                }
                                            )}
                                        </p>

                                        <div className={styles.statusIndicator}>
                                            {autoSyncing ? (
                                                <>
                                                    <div className={styles.pulseDot}></div>
                                                    <span {...getBidiProps(t('neweraModal.syncingCredits', 'Syncing credits from Newera...'))}>
                                                        {t('neweraModal.syncingCredits', 'Syncing credits from Newera...')}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                    </svg>
                                                    <span {...getBidiProps(syncStatusMessage || t('neweraModal.checkedJustNow', 'Checked just now.'))}>
                                                        {syncStatusMessage || t('neweraModal.checkedJustNow', 'Checked just now.')}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        className={styles.recheckBtn} 
                                                        onClick={syncCredits}
                                                        disabled={autoSyncing}
                                                    >
                                                        <span {...getBidiProps(t('neweraModal.checkAgainBtn', 'Check Again'))}>
                                                            {t('neweraModal.checkAgainBtn', 'Check Again')}
                                                        </span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phase 3 Header & Content: Per Lot Credits */}
                            {isPhase3 && (
                                <div className={styles.phaseContainer}>
                                    <h2 id="modal-title" className={styles.title} {...getBidiProps(t('neweraModal.earnByTradingTitle', 'Earn Credits by Trading'))}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        {t('neweraModal.earnByTradingTitle', 'Earn Credits by Trading')}
                                    </h2>

                                    <div className={styles.autoStatusCard}>
                                        {email && (
                                            <div className={styles.accountInfoBadge}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                    <polyline points="22,6 12,13 2,6"></polyline>
                                                </svg>
                                                <span {...getBidiProps(`${t('neweraModal.linkedEmail', 'Linked Email:')} ${email}`)}>
                                                    {t('neweraModal.linkedEmail', 'Linked Email:')} {email}
                                                </span>
                                            </div>
                                        )}

                                        <p className={styles.statusMessage}>
                                            {renderWithBoldPlaceholders(
                                                t('neweraModal.earnByTradingDesc', "You've used all your available credits. Continue trading with your Newera account and earn {credits} credits for every lot traded."),
                                                { '{credits}': tradeCreditsPerLot }
                                            )}
                                        </p>

                                        <div className={styles.statusIndicator}>
                                            {autoSyncing ? (
                                                <>
                                                    <div className={styles.pulseDot}></div>
                                                    <span {...getBidiProps(t('neweraModal.syncingVolume', 'Syncing trading volume...'))}>
                                                        {t('neweraModal.syncingVolume', 'Syncing trading volume...')}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                    </svg>
                                                    <span {...getBidiProps(syncStatusMessage || t('neweraModal.checkedJustNow', 'Checked just now.'))}>
                                                        {syncStatusMessage || t('neweraModal.checkedJustNow', 'Checked just now.')}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        className={styles.recheckBtn} 
                                                        onClick={syncCredits}
                                                        disabled={autoSyncing}
                                                    >
                                                        <span {...getBidiProps(t('neweraModal.checkAgainBtn', 'Check Again'))}>
                                                            {t('neweraModal.checkAgainBtn', 'Check Again')}
                                                        </span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
            </div>
        </div>
    );
}
