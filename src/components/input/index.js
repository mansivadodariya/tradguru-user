'use client';
import React, { useState } from 'react';
import styles from './input.module.scss';

const EyeOpen = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeClosed = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const Input = ({ label, placeholder, type = 'text', value, onChange, name, icon, error, ...rest }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const handleChange = (e) => {
        if (e && e.target && type !== 'file') {
            let val = e.target.value;
            if (type === 'email' || type === 'password') {
                // no spaces allowed at all
                val = val.replace(/\s/g, '');
            } else {
                // strip leading spaces from all other fields
                val = val.replace(/^\s+/, '');
            }
            e.target.value = val;
        }
        if (onChange) onChange(e);
    };

    return (
        <div className={styles.input}>
            {label && <label htmlFor={name}>{label}</label>}
            <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
                {icon && <img src={icon} alt="" aria-hidden="true" className={styles.iconLeft} />}
                <input
                    id={name}
                    type={resolvedType}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${name}-error` : undefined}
                    {...rest}
                />
                {isPassword && (
                    <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOpen /> : <EyeClosed />}
                    </button>
                )}
            </div>
            {error && (
                <p id={`${name}-error`} className={styles.errorMsg} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
