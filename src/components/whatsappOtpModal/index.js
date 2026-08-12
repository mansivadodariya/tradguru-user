'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './whatsappOtpModal.module.scss';
import { authApi } from '@/lib/api';
import { toast } from '@/components/toast';

export default function WhatsAppOtpModal({
    isOpen,
    phoneNumber,
    onClose,
    onSuccess,
    autoTriggerSend = true,
}) {
    const [step, setStep] = useState('otp'); // 'otp' | 'success'
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(30);
    const [sendingOtp, setSendingOtp] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!isOpen) {
            setStep('otp');
            setOtpValues(['', '', '', '', '', '']);
            setError('');
            setLoading(false);
            return;
        }

        // Auto focus first input
        setTimeout(() => {
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        }, 150);

        if (autoTriggerSend && phoneNumber) {
            handleSendOtp(phoneNumber);
        }
    }, [isOpen, phoneNumber]);

    // Resend cooldown timer
    useEffect(() => {
        if (!isOpen || resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, resendCooldown]);

    const handleSendOtp = async (phone) => {
        if (!phone) return;
        setSendingOtp(true);
        setError('');
        try {
            await authApi.sendWhatsAppOtp(phone);
            toast.success(`WhatsApp verification code sent to ${phone}`);
            setResendCooldown(30);
        } catch (err) {
            console.error('Send WhatsApp OTP error:', err);
            const msg = err.message || 'Failed to send WhatsApp verification code.';
            setError(msg);
            toast.error(msg);
        } finally {
            setSendingOtp(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            // Paste full code handling
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otpValues];
            digits.forEach((d, i) => {
                newOtp[i] = d;
            });
            setOtpValues(newOtp);
            setError('');
            const nextFocus = Math.min(digits.length, 5);
            if (inputRefs.current[nextFocus]) {
                inputRefs.current[nextFocus].focus();
            }
            return;
        }

        const digit = value.replace(/\D/g, '');
        const newOtp = [...otpValues];
        newOtp[index] = digit;
        setOtpValues(newOtp);
        setError('');

        if (digit && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        const otp = otpValues.join('');
        if (otp.length < 6) {
            setError('Please enter all 6 digits of the WhatsApp OTP code.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authApi.verifyWhatsAppOtp(phoneNumber, otp);
            // Switch to animated success modal popup!
            setStep('success');
            
            // Auto complete / redirect after showing the beautiful success animation
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 2500);
        } catch (err) {
            console.error('Verify WhatsApp OTP error:', err);
            const msg = err.message || 'Invalid verification code. Please check and try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const isComplete = otpValues.join('').length === 6;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={styles.modalOverlay} onClick={onClose}>
                <motion.div
                    className={styles.modalCard}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {onClose && step === 'otp' && (
                        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}

                    {step === 'otp' ? (
                        <div>
                            <div className={styles.header}>
                                <div className={styles.iconBadge}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                    </svg>
                                </div>
                                <h2 className={styles.title}>Verify WhatsApp Number</h2>
                                <p className={styles.subtitle}>
                                    We sent a 6-digit verification OTP to <strong>{phoneNumber}</strong> via WhatsApp.
                                </p>
                            </div>

                            <form onSubmit={handleVerify}>
                                <div className={styles.otpContainer}>
                                    {otpValues.map((val, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => (inputRefs.current[idx] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={val}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className={`${styles.otpInput} ${val ? styles.filled : ''} ${error ? styles.error : ''}`}
                                        />
                                    ))}
                                </div>

                                {error && <div className={styles.errorMessage}>{error}</div>}

                                <div className={styles.resendRow}>
                                    <span>Didn't receive the code?</span>
                                    <button
                                        type="button"
                                        className={styles.resendBtn}
                                        disabled={resendCooldown > 0 || sendingOtp}
                                        onClick={() => handleSendOtp(phoneNumber)}
                                    >
                                        {sendingOtp
                                            ? 'Sending...'
                                            : resendCooldown > 0
                                            ? `Resend in ${resendCooldown}s`
                                            : 'Resend OTP'}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.actionBtn}
                                    disabled={loading || !isComplete}
                                >
                                    {loading ? (
                                        <>
                                            <div className={styles.spinner} />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <span>Verify Code & Continue</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className={styles.successContainer}>
                            <motion.div
                                className={styles.successAnimationWrapper}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <div className={styles.pulseRing} />
                                <div className={styles.successCircle}>
                                    <svg className={styles.checkSvg} viewBox="0 0 52 52">
                                        <motion.path
                                            fill="none"
                                            d="M14 27 l10 10 l20 -20"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                                        />
                                    </svg>
                                </div>
                            </motion.div>

                            <motion.div
                                className={styles.verifiedBadge}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>WhatsApp Verified</span>
                            </motion.div>

                            <motion.h3
                                className={styles.successTitle}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                Number Added Successfully!
                            </motion.h3>

                            <motion.p
                                className={styles.successText}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                            >
                                Your phone number has been verified with WhatsApp. Unlocking dashboard access...
                            </motion.p>

                            <motion.button
                                className={styles.actionBtn}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                onClick={() => {
                                    if (onSuccess) onSuccess();
                                }}
                            >
                                <span>Continue to Dashboard</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
