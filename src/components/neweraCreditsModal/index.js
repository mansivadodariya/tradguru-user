'use client';

import React, { useState } from 'react';
import styles from './neweraCreditsModal.module.scss';
import Input from '@/components/input';
import { neweraApi } from '@/lib/api';
import { toast } from '@/components/toast';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabaseClient';
import { notifyCreditsUpdated, refreshCreditsFromServer } from '@/lib/credits';

export default function NeweraCreditsModal({ userId, onClose, onSuccess }) {
    const [email, setEmail] = useState('');
    const [login, setLogin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasExistingLink, setHasExistingLink] = useState(false);
    const { theme } = useTheme();

    React.useEffect(() => {
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

    React.useEffect(() => {
        const fetchLinkedAccount = async () => {
            if (!userId || !supabase) return;
            try {
                // 1. Try mt5_accounts
                const { data: mt5Data } = await supabase
                    .from('mt5_accounts')
                    .select('email, login')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (mt5Data && mt5Data.login) {
                    setLogin(String(mt5Data.login));
                    if (mt5Data.email) setEmail(mt5Data.email);
                    setHasExistingLink(true);
                    return;
                }

                // 2. Try newera_credits_sync fallback
                const { data: syncData } = await supabase
                    .from('newera_credits_sync')
                    .select('email, mt5_id')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (syncData && syncData.mt5_id) {
                    setLogin(String(syncData.mt5_id));
                    if (syncData.email) setEmail(syncData.email);
                    setHasExistingLink(true);
                }
            } catch (err) {
                console.error('Error fetching linked account:', err);
            }
        };

        fetchLinkedAccount();
    }, [userId]);

    const syncCredits = async () => {
        if (!userId) return;
        try {
            const freshCredits = await refreshCreditsFromServer();
            if (freshCredits !== null && freshCredits !== undefined && Number(freshCredits) > 0) {
                if (onSuccess) onSuccess(freshCredits);
                onClose?.();
            }
        } catch (err) {
            console.warn("Background auto-sync failed:", err);
        }
    };

    React.useEffect(() => {
        if (!userId || !hasExistingLink) return;

        const interval = setInterval(() => {
            syncCredits();
        }, 5000);

        return () => clearInterval(interval);
    }, [userId, hasExistingLink]);

    const logoSrc = theme === 'dark' ? '/assets/icons/Img1.svg' : '/assets/images/LightNewera.png';

    const handleLoginChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 20) {
            setLogin(val);
        }
    };

    const handleLinkAccount = async (e) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!login.trim()) {
            setError('Login ID is required.');
            return;
        }
        if (login.length > 20) {
            setError('Login ID cannot exceed 20 characters.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await neweraApi.linkAccount(userId, email, login);
            if (res.success) {
                // Store the linked account in mt5_accounts
                try {
                    if (supabase) {
                        const { error: dbError } = await supabase
                            .from('mt5_accounts')
                            .upsert({
                                user_id: userId,
                                email: email,
                                login: Number(login)
                            }, { onConflict: 'login' });
                        if (dbError) {
                            console.error("Failed to save MT5 account to database:", dbError);
                        }
                    }
                } catch (dbErr) {
                    console.error("Database insert error for mt5_accounts:", dbErr);
                }

                // Also store the linked account in newera_credits_sync
                try {
                    if (supabase) {
                        const { error: dbError } = await supabase
                            .from('newera_credits_sync')
                            .insert({
                                user_id: userId,
                                email: email,
                                mt5_id: Number(login),
                                welcome_credits_awarded: true
                            });
                        if (dbError) {
                            console.error("Failed to save newera_credits_sync to database:", dbError);
                        }
                    }
                } catch (dbErr) {
                    console.error("Database insert error for newera_credits_sync:", dbErr);
                }

                setHasExistingLink(true);

                const creditsVal = res.data?.available_credits ?? res.data?.availableCredits ?? res.data?.data?.available_credits;
                if (creditsVal !== undefined && creditsVal !== null) {
                    notifyCreditsUpdated(creditsVal);
                    if (Number(creditsVal) > 0) {
                        toast.success(res.message || 'Account linked successfully! Credits updated.');
                        if (onSuccess) {
                            onSuccess(creditsVal);
                        }
                        onClose?.();
                        return;
                    }
                } else {
                    const freshCredits = await refreshCreditsFromServer();
                    if (freshCredits !== null && freshCredits !== undefined && Number(freshCredits) > 0) {
                        toast.success(res.message || 'Account linked successfully! Credits updated.');
                        if (onSuccess) {
                            onSuccess(freshCredits);
                        }
                        onClose?.();
                        return;
                    }
                }

                toast.success('Account linked successfully! Waiting for credits to update from trades.');
            } else {
                setError(res.message || 'Failed to link account.');
            }
        } catch (err) {
            setError(err?.message || 'An error occurred. Please try again.');
            toast.error(err?.message || 'Failed to link Newera account.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterRedirect = () => {
        window.open('https://trade.newera365.com/client/register/696263e48c3f4', '_blank', 'noopener,noreferrer');
        toast('Newera registration opened. Enter your email address here when done!');
    };

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={styles.box}>
                {/* Visual Brand Border accent */}
                <div className={styles.accentLayer}></div>
                
                {/* Newera Customized Logo Header */}
                <div className={styles.brandHeader}>
                    <div className={styles.logoWrapper}>
                        <img src={logoSrc} alt="Newera Logo" className={styles.logoImg} />
                    </div>
                </div>

                <div className={styles.content}>
                    
                    <h2 id="modal-title" className={styles.title}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Out of Credits</h2>
                    
                    <div className={styles.welcomeText}>
                        <p>Looks like you have run out of trading credits.</p>
                    </div>

                    <div className={styles.optionsContainer}>
                        {/* Register card */}
                        <div className={styles.optionCard}>
                            <div className={styles.optionHeader}>
                                <span className={styles.badgeStep}>1</span>
                                <h3>Create New Account</h3>
                            </div>
                            <p className={styles.optionDesc}>
                                Don't have a Newera account? Register one in a new tab to start trading.
                            </p>
                            <button 
                                type="button" 
                                className={styles.registerBtn} 
                                onClick={handleRegisterRedirect}
                            >
                                Register Account
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Link account card */}
                        <div className={styles.optionCard}>
                            <div className={styles.optionHeader}>
                                <span className={styles.badgeStep}>2</span>
                                <h3>Link Existing Account</h3>
                            </div>
                            <p className={styles.optionDesc}>
                                Enter your Newera email address below to claim your credits.
                            </p>

                            <form onSubmit={handleLinkAccount} className={styles.linkForm}>
                                <div className={styles.inputWrapper}>
                                    <Input
                                        type="email"
                                        placeholder="Enter Email Address"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={true}
                                        required
                                    />
                                </div>
                                <div className={styles.inputWrapper}>
                                    <Input
                                        type="text"
                                        placeholder="Enter Login ID"
                                        name="login"
                                        value={login}
                                        onChange={handleLoginChange}
                                        required
                                    />
                                </div>
                                {error && <p className={styles.error} role="alert">{error}</p>}
                                <button 
                                    type="submit" 
                                    className={styles.submitBtn} 
                                    disabled={loading || !email.trim() || !login.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <span className={styles.spinner}></span>
                                            Linking...
                                        </>
                                    ) : 'Link Account'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
            </div>
        </div>
    );
}
