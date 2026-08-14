'use client';

import React from 'react';
import styles from './aiAssistant.module.scss';

export default function AttachmentDraft({ attachment, onRemove, onPreview }) {
    if (!attachment) return null;

    return (
        <div className={styles.compactAttachmentWrapper}>
            <div
                className={styles.compactAttachmentCard}
                onClick={() => onPreview && onPreview(attachment)}
                title="Click to preview image"
            >
                <img
                    src={attachment.url}
                    alt={attachment.name || 'Attached screenshot'}
                    className={styles.compactAttachmentImg}
                />
                <div className={styles.previewHoverOverlay}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                </div>
            </div>

            {/* Overlapping circular close button */}
            <button
                type="button"
                className={styles.compactCloseBtn}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onRemove) onRemove();
                }}
                title="Remove attachment"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
}
