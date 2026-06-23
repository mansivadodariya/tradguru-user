'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.scss';
import Input from '@/components/input';
import PhoneInput from '@/components/phoneInput';
import Button from '@/components/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/toast';
import { isValidPhoneNumber } from 'react-phone-number-input';

const ArrowIcon = '/assets/icons/arrow.svg';

function getUserFromStorage() {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

export default function Profile() {
    const router = useRouter();

    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        fetchProfile(id);
    }, []);

    const fetchProfile = async (id) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('first_name, last_name, email, phone_number, referral_code')
                .eq('id', id)
                .single();
            if (error) throw error;
            setForm({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                phone_number: data.phone_number || '',
                referral_code: data.referral_code || '',
            });
        } catch (err) {
            toast.error(err.message || 'Failed to load profile.');
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
        // Block numbers and special characters for name fields — only allow letters and spaces
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

    const handleSave = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    first_name: form.first_name.trim(),
                    last_name: form.last_name.trim(),
                    phone_number: form.phone_number,
                })
                .eq('id', userId);
            if (error) throw error;

            const stored = getUserFromStorage() || {};
            const updated = {
                ...stored,
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone_number: form.phone_number,
            };
            localStorage.setItem('user', JSON.stringify(updated));
            window.dispatchEvent(new Event('user:updated'));

            toast.success('Profile updated successfully.');
        } catch (err) {
            toast.error(err.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleCopyLink = async () => {
        if (!form.referral_code) return;
        try {
            const link = `${window.location.origin}/signup?code=${encodeURIComponent(form.referral_code)}`;
            await navigator.clipboard.writeText(link);
            toast.success('Referral link copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy link.');
        }
    };

    const handleShareLink = async () => {
        if (!form.referral_code) return;
        const link = `${window.location.origin}/signup?code=${encodeURIComponent(form.referral_code)}`;
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

    return (
        <div className={styles.profile}>
            <div className={styles.header}>
                <h1>Profile</h1>
                <p>Manage your personal details</p>
            </div>

            <div className={styles.card}>
                <form onSubmit={handleSave} noValidate>
                    <div className={styles.row}>
                        <Input
                            label="First Name"
                            name="first_name"
                            placeholder="First name"
                            value={form.first_name}
                            onChange={handleChange}
                            error={errors.first_name}
                            maxLength={50}
                        />
                        <Input
                            label="Last Name"
                            name="last_name"
                            placeholder="Last name"
                            value={form.last_name}
                            onChange={handleChange}
                            error={errors.last_name}
                            maxLength={50}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Email</label>
                        <div className={styles.emailDisplay}>{form.email || '—'}</div>
                    </div>

                    <PhoneInput
                        label="Phone Number"
                        value={form.phone_number}
                        onChange={setPhone}
                        placeholder="Phone number"
                        error={errors.phone_number}
                    />

                    <div className={styles.field}>
                        <label className={styles.label}>Referral Code</label>
                        <div className={styles.referralWrapper}>
                            <input
                                type="text"
                                className={styles.referralInput}
                                value={form.referral_code || '—'}
                                disabled
                                readOnly
                            />
                            {form.referral_code && (
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
                        <p className={styles.hint}>
                            Share this link with others. It will automatically fill the referral code when they sign up!
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            text={saving ? 'Saving...' : 'Save Changes'}
                            type="submit"
                            disabled={saving}
                            icon={ArrowIcon}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
