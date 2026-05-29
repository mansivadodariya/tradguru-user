
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './signup.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import ContinueWithGoogle from '@/components/continueWithGoogle';
import { authApi } from '@/lib/api';
import { validateSignup } from '@/lib/validation';
import { toast } from '@/components/toast';

const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const Profile = '/assets/icons/profile.svg';
const Call = '/assets/icons/call.svg';
const EmailIcon = '/assets/icons/sms.svg';
const Lock = '/assets/icons/lock.svg';

const Signup = () => {
    const router = useRouter();
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', phone_number: '', password: '', confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const set = (field) => (e) => {
        let val = e.target.value.trimStart();
        if (field === 'phone_number') val = val.replace(/\D/g, '');
        setForm((f) => ({ ...f, [field]: val }));
        // clear field error on change
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fieldErrors = validateSignup(form);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }
        setLoading(true);
        try {
            const { confirmPassword, ...payload } = form;
            await authApi.signup(payload);
            setSuccess(true);
        } catch (err) {
            toast.dismiss();
            toast.error(typeof err.message === 'string' ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.signuppage}>
                <div className={styles.box}>
                    <div className={styles.layer}></div>
                    <div className={styles.relative}>
                        <div className={styles.icon}>
                            <img src={AuthIcon} alt="" aria-hidden="true" onClick={() => router.push("/")} />
                        </div>
                        <div className={styles.text}>
                            <h2>Check your email</h2>
                            <p>We sent a verification link to <strong>{form.email}</strong>. Click the link to activate your account.</p>
                        </div>
                        <div className={styles.accountText}>
                            <p><Link href="/login">Back to Log in</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.signuppage}>
            <div className={styles.box}>
                <div className={styles.layer}></div>
                <div className={styles.lineimage}>
                    <img src={LineImage} alt="" aria-hidden="true" />
                </div>
                <div className={styles.relative}>
                    <div className={styles.icon}>
                        <img src={AuthIcon} alt="" aria-hidden="true" onClick={() => router.push("/")} />
                    </div>
                    <div className={styles.text}>
                        <h2>Sign Up</h2>
                        <p>Get set up so you can start your first onboarding experience.</p>
                    </div>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className={styles.spacingGrid}>
                            <div className={styles.twoCol}>
                                <Input icon={Profile} placeholder="First Name" name="first_name" value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
                                <Input icon={Profile} placeholder="Last Name" name="last_name" value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
                            </div>
                            <Input icon={EmailIcon} placeholder="Email" type="email" name="email" value={form.email} onChange={set('email')} error={errors.email} />
                            <Input icon={Call} placeholder="Phone no" name="phone_number" value={form.phone_number} onChange={set('phone_number')} error={errors.phone_number} inputMode="numeric" maxLength={15} />
                            <div className={styles.twoCol}>
                                <Input icon={Lock} placeholder="Password" type="password" name="password" value={form.password} onChange={set('password')} error={errors.password} />
                                <Input icon={Lock} placeholder="Confirm Password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
                            </div>
                            <Button text={loading ? 'Signing up...' : 'Sign up'} type="submit" icon={ArrowIcon} />
                        </div>
                    </form>
                    <div className={styles.accountText}>
                        <p>Already have an account? <Link href="/login">Log in</Link></p>
                    </div>
                    <div className={styles.orText}><span>or</span></div>
                    <ContinueWithGoogle />
                </div>
            </div>
        </div>
    );
};

export default Signup;
