'use client';

import React, { useState } from 'react';
import styles from './neweraCreditsModal.module.scss';
import Input from '@/components/input';
import { neweraApi } from '@/lib/api';
import { toast } from '@/components/toast';
import { useTheme } from '@/context/ThemeContext';

export default function NeweraCreditsModal({ userId, onClose, onSuccess }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { theme } = useTheme();

    const logoSrc = theme === 'dark' ? '/assets/icons/Img1.svg' : '/assets/images/LightNewera.png';

    const handleLinkAccount = async (e) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await neweraApi.linkAccount(userId, email);
            if (res.success) {
                toast.success(res.message || 'Account linked successfully! Credits updated.');
                if (onSuccess) {
                    onSuccess(res.data.available_credits);
                }
                onClose?.();
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
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                {error && <p className={styles.error} role="alert">{error}</p>}
                                <button 
                                    type="submit" 
                                    className={styles.submitBtn} 
                                    disabled={loading || !email.trim()}
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
