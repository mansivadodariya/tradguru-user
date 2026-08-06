'use client';
import React, { useEffect } from 'react';
import styles from './tradeSnap.module.scss';
import { getBidiProps } from '@/lib/bidi';

export default function Modal({ open, onClose, title, description, children, footer }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={onClose}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    {title && <h2 {...getBidiProps(title)}>{title}</h2>}
                    {description && <p {...getBidiProps(description)}>{description}</p>}
                    <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>
                <div className={styles.modalBody}>{children}</div>
                {footer && <div className={styles.modalFooter}>{footer}</div>}
            </div>
        </div>
    );
}
