'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/toast';

const PHONE_RE = /^\+?[0-9\s\-().]{7,20}$/;

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
        if (!form.first_name.trim()) errs.first_name = 'First name is required.';
        else if (form.first_name.trim().length < 2) errs.first_name = 'Min 2 characters.';
        if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
        else if (form.last_name.trim().length < 2) errs.last_name = 'Min 2 characters.';
        if (form.phone_number && !PHONE_RE.test(form.phone_number.trim()))
            errs.phone_number = 'Enter a valid phone number.';
        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone_number') {
            // allow digits, +, spaces, -, (, ) only
            const cleaned = value.replace(/[^\d+\s\-().]/g, '');
            setForm((prev) => ({ ...prev, phone_number: cleaned }));
            setErrors((prev) => ({ ...prev, phone_number: '' }));
            return;
        }
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handlePhoneKeyDown = (e) => {
        // allow: backspace, delete, tab, escape, enter, arrows, home, end
        const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (controlKeys.includes(e.key)) return;
        // allow: Ctrl/Cmd+A/C/V/X
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
        // allow valid phone chars: digits, +, space, -, (, )
        if (/[\d+\s\-().]/.test(e.key)) return;
        e.preventDefault();
    };

    const handlePhonePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^\d+\s\-().]/g, '');
        setForm((prev) => ({ ...prev, phone_number: pasted }));
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
                    phone_number: form.phone_number.trim() || null,
                })
                .eq('id', userId);
            if (error) throw error;

            // sync localStorage and notify other components
            const stored = getUserFromStorage() || {};
            const updated = {
                ...stored,
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone_number: form.phone_number.trim() || null,
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
                        />
                        <Input
                            label="Last Name"
                            name="last_name"
                            placeholder="Last name"
                            value={form.last_name}
                            onChange={handleChange}
                            error={errors.last_name}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Email</label>
                        <div className={styles.emailDisplay}>{form.email || '—'}</div>
                    </div>

                    <Input
                        label="Phone Number"
                        name="phone_number"
                        placeholder="+1 234 567 8900"
                        value={form.phone_number}
                        onChange={handleChange}
                        onKeyDown={handlePhoneKeyDown}
                        onPaste={handlePhonePaste}
                        inputMode="tel"
                        error={errors.phone_number}
                    />

                    <div className={styles.actions}>
                        <Button
                            text={saving ? 'Saving...' : 'Save Changes'}
                            type="submit"
                            disabled={saving}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
