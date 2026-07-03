'use client';
import React, { useState } from 'react';
import PhoneInputLib from 'react-phone-number-input';
import { isValidPhoneNumber } from 'libphonenumber-js/min';
import 'react-phone-number-input/style.css';
import styles from './phoneInput.module.scss';

/**
 * PhoneInput — webapp version
 * Wraps react-phone-number-input with country-aware length validation.
 *
 * Props:
 *   label       – field label text
 *   value       – E.164 string e.g. "+919876543210"
 *   onChange    – (value: string | undefined) => void
 *   error       – external error string (takes priority)
 *   placeholder – input placeholder
 *   disabled    – boolean
 */
export default function PhoneInput({
    label,
    value,
    onChange,
    error,
    placeholder = 'Phone number',
    disabled = false,
    ...rest
}) {
    const [country, setCountry] = useState('AE');
    const [internalError, setInternalError] = useState('');

    function handleChange(val) {
        // clear internal error as user types
        if (internalError) setInternalError('');
        onChange(val);
    }

    function handleBlur() {
        if (!value) return;
        const valid = isValidPhoneNumber(value);
        if (!valid) {
            setInternalError('Enter a valid phone number for the selected country');
        }
    }

    const displayError = error || internalError;

    return (
        <div className={styles.phoneField}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={`${styles.wrapper} ${displayError ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
                <PhoneInputLib
                    international
                    defaultCountry="AE"
                    country={country}
                    onCountryChange={(c) => {
                        setCountry(c || 'AE');
                        // re-validate if a value already exists
                        if (value && internalError) setInternalError('');
                    }}
                    value={value || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={styles.phoneInput}
                    {...rest}
                />
            </div>
            {displayError && <p className={styles.errorMsg}>{displayError}</p>}
        </div>
    );
}
