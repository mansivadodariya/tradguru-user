'use client';
import React, { useState } from 'react';
import styles from './verifyEmailModal.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
const AuthIcon = '/assets/icons/auth.svg';
const LineImage = '/assets/images/line.png';
const ArrowIcon = '/assets/icons/arrow.svg';

export default function VerifyEmailModal({ onVerify, onClose, loading, error }) {
    const [token, setToken] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onVerify(token);
    };

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="verify-title">
            <div className={styles.box}>
                <div className={styles.layer}></div>
                <div className={styles.lineimage}>
                    <img src={LineImage} alt='' aria-hidden="true" />
                </div>
                <div className={styles.relative}>
                    <div className={styles.icon} onClick={onClose} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClose?.()}>
                        <img src={AuthIcon} alt='' aria-hidden="true" />
                    </div>
                    <div className={styles.text}>
                        <h2 id="verify-title">Verify Email</h2>
                        <p>We sent a verification token to your email. Paste it below to confirm your account.</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.spacingGrid}>
                            <Input
                                label='Verification Token'
                                placeholder=' Paste your token here'
                                name='token'
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                maxLength={100}
                            />
                            {error && <p className={styles.error} role="alert">{error}</p>}
                            <Button type="submit" text={loading ? 'Verifying...' : 'Verify Email'} icon={ArrowIcon} disabled={loading} />
                        </div>
                    </form>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
                </div>
            </div>
        </div>
    );
}
