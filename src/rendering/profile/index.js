'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './profile.module.scss';
import Input from '@/components/input';
import PhoneInput from '@/components/phoneInput';
import FirebasePhoneModal from '@/components/firebasePhoneModal';
import Button from '@/components/button';
import CreditHistory from '@/rendering/creditHistory';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/toast';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { profileApi } from '@/lib/api';

import { useLanguage } from '@/context/LanguageContext';

const ArrowIcon = '/assets/icons/arrow.svg';

function getUserFromStorage() {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function parseLogins(rawLogins) {
    if (!rawLogins) return [];
    if (Array.isArray(rawLogins)) return rawLogins;
    if (typeof rawLogins === 'string') {
        const trimmed = rawLogins.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                return JSON.parse(trimmed);
            } catch (_) {}
        }
        if (trimmed) return [trimmed];
    }
    return [];
}

export default function Profile() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get('tab');
    const { t, language } = useLanguage();

    const [activeTab, setActiveTab] = useState(tabParam || 'profile');

    useEffect(() => {
        if (tabParam && ['profile', 'recent_activity', 'credit_history'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastLogins, setLastLogins] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [initialPhone, setInitialPhone] = useState('');
    const [referralCount, setReferralCount] = useState(0);

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        referral_code: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const user = getUserFromStorage();
        if (!user) { router.replace('/login'); return; }
        const id = user.id || user.user_id || '';
        setUserId(id);
        setInitialPhone(user.phone_number || '');

        setForm({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            referral_code: user.referral_code || id || '',
        });

        const initialLogins = parseLogins(user.last_logins);
        if (initialLogins.length > 0) {
            setLastLogins(initialLogins.slice(-5));
        }

        fetchProfile(id);
    }, []);

    const fetchProfile = async (id) => {
        setLoading(true);
        try {
            // First fetch directly from Supabase if available for accurate real-time user data, last_logins & referral count
            if (supabase && id) {
                try {
                    const { data } = await supabase
                        .from('users')
                        .select('first_name, last_name, email, phone_number, referral_code, last_logins')
                        .eq('id', id)
                        .maybeSingle();

                    if (data) {
                        const parsedDbLogins = parseLogins(data.last_logins);
                        if (parsedDbLogins.length > 0) {
                            setLastLogins(parsedDbLogins.slice(-5));
                        }
                        if (data.phone_number) setInitialPhone(data.phone_number);
                        setForm((prev) => ({
                            first_name: data.first_name || prev.first_name || '',
                            last_name: data.last_name || prev.last_name || '',
                            email: data.email || prev.email || '',
                            phone_number: data.phone_number || prev.phone_number || '',
                            referral_code: data.referral_code || prev.referral_code || id || '',
                        }));
                    }

                    // Query count of referees
                    const { count: refCount, error: countErr } = await supabase
                        .from('users')
                        .select('id', { count: 'exact', head: true })
                        .eq('referred_by_id', id);

                    if (!countErr && typeof refCount === 'number') {
                        setReferralCount(refCount);
                    }
                } catch (sbErr) {
                    console.warn('Supabase profile fetch error:', sbErr);
                }
            }

            const apiRes = await profileApi.getProfile();
            const profileData = apiRes?.data || apiRes || {};
            if (profileData) {
                if (profileData.phone_number) setInitialPhone(profileData.phone_number);
                setForm((prev) => ({
                    first_name: profileData.first_name || prev.first_name || '',
                    last_name: profileData.last_name || prev.last_name || '',
                    email: profileData.email || prev.email || '',
                    phone_number: profileData.phone_number || prev.phone_number || '',
                    referral_code: profileData.referral_code || prev.referral_code || id || '',
                }));

                const apiRefCount = profileData.referral_count ?? profileData.referred_count ?? profileData.total_referrals;
                if (typeof apiRefCount === 'number') {
                    setReferralCount(apiRefCount);
                }

                const fetchedLogins = parseLogins(profileData.last_logins);
                if (fetchedLogins.length > 0) {
                    setLastLogins(fetchedLogins.slice(-5));
                }

                const stored = getUserFromStorage() || {};
                const updated = {
                    ...stored,
                    first_name: profileData.first_name || stored.first_name || '',
                    last_name: profileData.last_name || stored.last_name || '',
                    email: profileData.email || stored.email || '',
                    phone_number: profileData.phone_number || stored.phone_number || '',
                    last_logins: fetchedLogins.length > 0 ? fetchedLogins.slice(-5) : stored.last_logins || [],
                };
                localStorage.setItem('user', JSON.stringify(updated));
                window.dispatchEvent(new Event('user:updated'));
            }
        } catch (err) {
            console.warn('Profile fetch warning:', err);
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const errs = {};
        const firstName = form.first_name.trim();
        const lastName = form.last_name.trim();

        if (!firstName) {
            errs.first_name = 'First name is required.';
        } else if (firstName.length < 2) {
            errs.first_name = 'First name must be at least 2 characters.';
        } else if (firstName.length > 50) {
            errs.first_name = 'First name cannot exceed 50 characters.';
        } else if (!/^[a-zA-Z\s]+$/.test(firstName)) {
            errs.first_name = 'First name can only contain letters and spaces.';
        }

        if (!lastName) {
            errs.last_name = 'Last name is required.';
        } else if (lastName.length < 2) {
            errs.last_name = 'Last name must be at least 2 characters.';
        } else if (lastName.length > 50) {
            errs.last_name = 'Last name cannot exceed 50 characters.';
        } else if (!/^[a-zA-Z\s]+$/.test(lastName)) {
            errs.last_name = 'Last name can only contain letters and spaces.';
        }

        if (!form.phone_number) {
            errs.phone_number = 'Phone number is required.';
        } else if (!isValidPhoneNumber(form.phone_number)) {
            errs.phone_number = 'Enter a valid phone number.';
        }

        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let sanitized = value;
        if (name === 'first_name' || name === 'last_name') {
            sanitized = value.replace(/[^a-zA-Z\s]/g, '');
        }
        setForm((prev) => ({ ...prev, [name]: sanitized }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const setPhone = (value) => {
        setForm((prev) => ({ ...prev, phone_number: value || '' }));
        setErrors((prev) => ({ ...prev, phone_number: '' }));
    };

    const performSaveProfile = async () => {
        setSaving(true);
        try {
            const apiRes = await profileApi.updateProfile({
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone_number: form.phone_number,
            });

            const stored = getUserFromStorage() || {};
            if (supabase && stored?.id) {
                try {
                    await supabase
                        .from('users')
                        .update({
                            phone_number: form.phone_number,
                            is_phone_verified: true
                        })
                        .eq('id', stored.id);
                } catch (dbErr) {
                    console.warn("Supabase direct phone verification update error:", dbErr);
                }
            }

            const updated = {
                ...stored,
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone_number: form.phone_number,
                is_phone_verified: true
            };
            localStorage.setItem('user', JSON.stringify(updated));
            document.cookie = 'has_phone=true; path=/; SameSite=Lax';
            setInitialPhone(form.phone_number);
            window.dispatchEvent(new Event('user:updated'));

            toast.success(apiRes?.message || 'Profile updated successfully.');
        } catch (err) {
            toast.error(err.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
            setShowOtpModal(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        performSaveProfile();
    };

    const getActiveReferralCode = () => {
        return form.referral_code || userId || '';
    };

    const handleCopyLink = async () => {
        const code = getActiveReferralCode();
        if (!code) return;
        try {
            const link = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`;
            await navigator.clipboard.writeText(link);
            toast.success('Referral link copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy link.');
        }
    };

    const handleShareLink = async () => {
        const code = getActiveReferralCode();
        if (!code) return;
        const link = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join The Trader Master',
                    text: 'Sign up using my referral code!',
                    url: link
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    toast.error('Failed to share link.');
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(link);
                toast.success('Referral link copied to clipboard!');
            } catch (err) {
                toast.error('Failed to copy link.');
            }
        }
    };

    if (loading) {
        return (
            <div className={styles.centered}>
                <div className={styles.spinner} />
            </div>
        );
    }

    const activeRefCode = getActiveReferralCode();
    const displayLogins = (lastLogins.length > 0 ? [...lastLogins] : []).reverse();

    const subMenuItems = [
        {
            id: 'profile',
            title: t('profile.profileTab', 'Profile'),
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            )
        },
        {
            id: 'recent_activity',
            title: t('profile.recentActivity', 'Recent Activity'),
            count: displayLogins.length,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            )
        },
        {
            id: 'credit_history',
            title: t('creditHistory.title', 'Credit History'),
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
            )
        }
        // Additional submenus can easily be registered here in the future
    ];

    return (
        <div className={styles.profile}>
            <div className={styles.header}>
                <div>
                    <h1>{t('nav.profile', 'Account Settings')}</h1>
                    <p>{t('profile.manageDetails', 'Manage your personal details and view recent account activity')}</p>
                </div>
            </div>

            <div className={styles.profileGrid}>
                {/* Submenu Sidebar */}
                <div className={styles.subSidebar}>
                    <div className={styles.subSidebarNav}>
                        {subMenuItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`${styles.subNavItem} ${isActive ? styles.subNavItemActive : ''}`}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    <div className={styles.subNavItemIcon}>{item.icon}</div>
                                    <div className={styles.subNavItemText}>
                                        <span className={styles.subNavItemTitle}>{item.title}</span>
                                    </div>
                                    {typeof item.count === 'number' && item.count > 0 && (
                                        <span className={styles.subNavItemBadge}>{item.count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Submenu Content Area */}
                <div className={styles.subContent}>
                    {activeTab === 'profile' && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>{t('auth.profileInfo', 'Personal Details')}</h2>
                                <p>{t('profile.manageDetails', 'Update your personal details below.')}</p>
                            </div>
                            <form onSubmit={handleSave} noValidate>
                                <div className={styles.row}>
                                    <Input
                                        label={t('auth.firstNameLabel', 'First Name')}
                                        name="first_name"
                                        placeholder={t('auth.firstNameLabel', 'First name')}
                                        value={form.first_name}
                                        onChange={handleChange}
                                        error={errors.first_name}
                                        maxLength={50}
                                    />
                                    <Input
                                        label={t('auth.lastNameLabel', 'Last Name')}
                                        name="last_name"
                                        placeholder={t('auth.lastNameLabel', 'Last name')}
                                        value={form.last_name}
                                        onChange={handleChange}
                                        error={errors.last_name}
                                        maxLength={50}
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>{t('auth.emailLabel', 'Email')}</label>
                                    <div className={styles.emailDisplay}>{form.email || '—'}</div>
                                </div>

                                <PhoneInput
                                    label={t('profile.phoneLabel', 'Phone Number')}
                                    value={form.phone_number}
                                    onChange={setPhone}
                                    placeholder={t('profile.phoneLabel', 'Phone number')}
                                    error={errors.phone_number}
                                />

                                <div className={styles.field}>
                                    <label className={styles.label}>{t('profile.referralCode', 'Referral Code')}</label>
                                    <div className={styles.referralInputGroup}>
                                        <div className={styles.referralWrapper}>
                                            <input
                                                type="text"
                                                className={styles.referralInput}
                                                value={activeRefCode || '—'}
                                                disabled
                                                readOnly
                                            />
                                            {activeRefCode && (
                                                <div className={styles.referralActions}>
                                                    <button
                                                        type="button"
                                                        className={styles.iconButton}
                                                        onClick={handleCopyLink}
                                                        title="Copy referral link"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.iconButton}
                                                        onClick={handleShareLink}
                                                        title="Share referral link"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="18" cy="5" r="3" />
                                                            <circle cx="6" cy="12" r="3" />
                                                            <circle cx="18" cy="19" r="3" />
                                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.referralBadge}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                            <span>{t('profile.referralCount', 'Referrals')}:</span>
                                            <span className={styles.referralCountNumber}>{referralCount}</span>
                                        </div>
                                    </div>
                                    <p className={styles.hint}>
                                        {t('profile.referralHint', 'Share this link with others. It will automatically fill the referral code when they sign up!')}
                                    </p>
                                </div>

                                <div className={styles.actions}>
                                    <Button
                                        text={saving ? t('common.loading', 'Saving...') : t('common.save', 'Save Changes')}
                                        type="submit"
                                        disabled={saving}
                                        icon={ArrowIcon}
                                    />
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'recent_activity' && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardHeaderRow}>
                                    <div>
                                        <h2>{t('profile.loginActivity', 'Recent Login Activity')}</h2>
                                        <p>{t('profile.loginActivityDesc', 'Monitor your 5 most recent login sessions for account security.')}</p>
                                    </div>
                                    {displayLogins.length > 0 && (
                                        <span className={styles.subNavItemBadge}>{displayLogins.length}</span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.loginList}>
                                {displayLogins.length > 0 ? (
                                    displayLogins.map((entry, idx) => {
                                        const dateObj = new Date(entry);
                                        const isValidDate = !isNaN(dateObj.getTime());
                                        
                                        const dateStr = isValidDate ? dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : entry;

                                        const timeStr = isValidDate ? dateObj.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: true
                                        }) : '';

                                        const isLatest = idx === 0;

                                        return (
                                            <div key={idx} className={`${styles.loginItem} ${isLatest ? styles.latestLoginItem : ''}`}>
                                                <div className={styles.loginItemLeft}>
                                                    <div className={`${styles.deviceIconBox} ${isLatest ? styles.activeDeviceIcon : ''}`}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                                            <line x1="8" y1="21" x2="16" y2="21" />
                                                            <line x1="12" y1="17" x2="12" y2="21" />
                                                        </svg>
                                                    </div>
                                                    <div className={styles.loginItemDetails}>
                                                        <div className={styles.loginTimeRow}>
                                                            <span className={styles.loginDate}>{dateStr}</span>
                                                            {timeStr && <span className={styles.loginTime}>{t('profile.at', 'at')} {timeStr}</span>}
                                                        </div>
                                                        <span className={styles.loginIsoText}>{entry}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.loginItemRight}>
                                                    {isLatest ? (
                                                        <span className={styles.activeBadge}>
                                                            <span className={styles.activeDot} />
                                                            {t('profile.currentSession', 'Active Session')}
                                                        </span>
                                                    ) : (
                                                        <span className={styles.pastBadge}>
                                                            {t('profile.pastSession', 'Past Session')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className={styles.emptyLogins}>
                                        <p>{t('profile.noLoginData', 'No recent login history recorded.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'credit_history' && (
                        <CreditHistory embedMode={true} />
                    )}
                </div>
            </div>

            {/* Recent Login Activity Modal Popup */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            className={styles.modalContent}
                            initial={{ opacity: 0, scale: 0.94, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 15 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className={styles.modalHeader}>
                                <div className={styles.modalHeaderTitleRow}>
                                    <div className={styles.modalIconBox}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className={styles.modalTitle}>{t('profile.loginActivity', 'Recent Login Activity')}</h3>
                                        <p className={styles.modalSubtitle}>{t('profile.loginActivityDesc', 'Monitor your 5 most recent login sessions for account security.')}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className={styles.modalCloseBtn}
                                    onClick={() => setIsModalOpen(false)}
                                    aria-label="Close"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className={styles.modalBody}>
                                <div className={styles.loginList}>
                                    {displayLogins.length > 0 ? (
                                        displayLogins.map((entry, idx) => {
                                            const dateObj = new Date(entry);
                                            const isValidDate = !isNaN(dateObj.getTime());
                                            
                                            const dateStr = isValidDate ? dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : entry;

                                            const timeStr = isValidDate ? dateObj.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: true
                                            }) : '';

                                            const isLatest = idx === 0;

                                            return (
                                                <div key={idx} className={`${styles.loginItem} ${isLatest ? styles.latestLoginItem : ''}`}>
                                                    <div className={styles.loginItemLeft}>
                                                        <div className={`${styles.deviceIconBox} ${isLatest ? styles.activeDeviceIcon : ''}`}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                                                <line x1="8" y1="21" x2="16" y2="21" />
                                                                <line x1="12" y1="17" x2="12" y2="21" />
                                                            </svg>
                                                        </div>
                                                        <div className={styles.loginItemDetails}>
                                                            <div className={styles.loginTimeRow}>
                                                                <span className={styles.loginDate}>{dateStr}</span>
                                                                {timeStr && <span className={styles.loginTime}>at {timeStr}</span>}
                                                            </div>
                                                            <span className={styles.loginIsoText}>{entry}</span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.loginItemRight}>
                                                        {isLatest ? (
                                                            <span className={styles.activeBadge}>
                                                                <span className={styles.activeDot} />
                                                                {t('profile.currentSession', 'Active Session')}
                                                            </span>
                                                        ) : (
                                                            <span className={styles.pastBadge}>
                                                                {t('profile.pastSession', 'Past Session')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className={styles.emptyLogins}>
                                            <p>{t('profile.noLoginData', 'No recent login history recorded.')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.modalDoneBtn}
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    {t('common.close', 'Close')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <FirebasePhoneModal
                isOpen={showOtpModal}
                phoneNumber={form.phone_number}
                onClose={() => setShowOtpModal(false)}
                onSuccess={performSaveProfile}
            />
        </div>
    );
}
