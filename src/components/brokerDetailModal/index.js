'use client';

import React from 'react';
import styles from './brokerDetailModal.module.scss';

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const GlobeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

export default function BrokerDetailModal({ broker, onClose, onSyncClick }) {
    if (!broker) return null;

    const logoSrc = typeof broker.logo === 'string' ? broker.logo : null;
    const name = broker.name || broker.title || 'Partner Platform';
    const subtitle = broker.subtitle || broker.badge || broker.category || 'Trading Infrastructure';
    const websiteUrl = broker.websiteUrl || broker.href || '#';
    const features = broker.features || [
        'Verified integration & platform compatibility',
        'Direct trading execution & liquidity gateway',
        'Advanced risk controls & account protection',
        '24/7 dedicated support & infrastructure'
    ];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                {/* Header Banner */}
                <div className={styles.modalHeader}>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                        <CloseIcon />
                    </button>
                    
                    <div className={styles.logoRow}>
                        {logoSrc ? (
                            <div className={styles.logoWrapper}>
                                <img src={logoSrc} alt={name} style={{ filter: 'brightness(1.4)' }} />
                            </div>
                        ) : (
                            <div className={styles.logoWrapper}>{broker.logo}</div>
                        )}
                        <span className={styles.categoryBadge}>{subtitle}</span>
                    </div>

                    <h2 className={styles.title}>{name}</h2>
                    {broker.status && <span className={styles.statusBadge}>{broker.status}</span>}
                </div>

                {/* Body Content */}
                <div className={styles.modalBody}>
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>About Platform</h4>
                        <p className={styles.description}>{broker.description}</p>
                    </div>

                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Key Features & Highlights</h4>
                        <ul className={styles.featureList}>
                            {features.map((feat, idx) => (
                                <li key={idx} className={styles.featureItem}>
                                    <span className={styles.checkIconWrapper}>
                                        <CheckIcon />
                                    </span>
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {websiteUrl !== '#' && (
                        <div className={styles.websiteBox}>
                            <GlobeIcon />
                            <span className={styles.urlText}>{websiteUrl}</span>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className={styles.modalFooter}>
                    {broker.canSync && (
                        <button
                            type="button"
                            className={styles.syncBtn}
                            onClick={() => {
                                onClose();
                                if (onSyncClick) onSyncClick(broker);
                            }}
                        >
                            Sync MT5 Account
                        </button>
                    )}

                    {websiteUrl !== '#' && (
                        <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.visitBtn}
                        >
                            <span>Visit Official Site</span>
                            <ExternalLinkIcon />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
