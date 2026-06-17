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
                .select('first_name, last_name, email, phone_number')
                .eq('id', id)
                .single();
            if (error) throw error;
            setForm({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                phone_number: data.phone_number || '',
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
