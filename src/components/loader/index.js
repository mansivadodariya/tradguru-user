'use client';
import React from 'react';
import styles from './loader.module.scss';

/**
 * Common spinner loader.
 * size: 'sm' | 'md' (default) | 'lg'
 * centered: wraps in a flex container that fills available space
 */
export default function Loader({ size = 'md', centered = false }) {
    const spinner = <span className={`${styles.spinner} ${styles[size]}`} aria-label="Loading" role="status" />;
    if (centered) {
        return <div className={styles.centered}>{spinner}</div>;
    }
    return spinner;
}
