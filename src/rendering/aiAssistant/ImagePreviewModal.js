'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/context/ThemeContext';
import styles from './aiAssistant.module.scss';

export default function ImagePreviewModal({ attachment, onClose }) {
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        setMounted(true);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    if (!attachment || !mounted) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = attachment.name || 'chart_screenshot.png';
        link.href = attachment.url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const modalContent = (
        <div className={`${styles.imagePreviewOverlay} ${isDark ? styles.darkModeModal : styles.lightModeModal}`} onClick={onClose}>
            <div className={styles.imagePreviewCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.imagePreviewHeader}>
                    <div className={styles.titleGroup}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className={styles.imagePreviewTitle}>{attachment.name || 'Chart Screenshot Preview'}</span>
                    </div>
                    <div className={styles.imagePreviewHeaderActions}>
                        <button
                            type="button"
                            className={styles.previewActionBtn}
                            onClick={handleDownload}
                            title="Download Image"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download</span>
                        </button>
                        <button
                            type="button"
                            className={styles.previewCloseBtn}
                            onClick={onClose}
                            title="Close Preview"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                <div className={styles.imagePreviewBody}>
                    <img src={attachment.url} alt={attachment.name || 'Full chart preview'} className={styles.fullPreviewImg} />
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
