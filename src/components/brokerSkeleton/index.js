'use client';

import React from 'react';
import styles from './brokerSkeleton.module.scss';

export function BrokerCardSkeleton() {
    return (
        <div className={styles.cardSkeleton}>
            <div className={styles.bannerHeader}>
                <div className={`${styles.logoCircle} ${styles.skeletonPulse}`} />
            </div>
            <div className={styles.cardBody}>
                <div className={`${styles.titleLine} ${styles.skeletonPulse}`} />
                <div className={`${styles.subtitleLine} ${styles.skeletonPulse}`} />
                <div className={`${styles.descLine1} ${styles.skeletonPulse}`} />
                <div className={`${styles.descLine2} ${styles.skeletonPulse}`} />
            </div>
            <div className={styles.highlightsGrid}>
                <div className={`${styles.highlightItem} ${styles.skeletonPulse}`} />
                <div className={`${styles.highlightItem} ${styles.skeletonPulse}`} />
                <div className={`${styles.highlightItem} ${styles.skeletonPulse}`} />
            </div>
            <div className={styles.cardFooter}>
                <div className={`${styles.btnSkeleton} ${styles.skeletonPulse}`} />
                <div className={`${styles.btnSkeleton} ${styles.skeletonPulse}`} />
            </div>
        </div>
    );
}

export function BrokerDetailSkeleton() {
    return (
        <div className={styles.detailSkeleton}>
            <div className={styles.detailBanner}>
                <div className={`${styles.detailLogo} ${styles.skeletonPulse}`} />
                <div className={`${styles.detailTitle} ${styles.skeletonPulse}`} />
                <div className={`${styles.detailSub} ${styles.skeletonPulse}`} />
            </div>

            <div className={styles.detailGrid}>
                <div>
                    <div className={styles.detailCardSection}>
                        <div className={`${styles.sectionTitle} ${styles.skeletonPulse}`} />
                        <div className={`${styles.paragraphLine} ${styles.skeletonPulse}`} />
                        <div className={`${styles.paragraphLine} ${styles.skeletonPulse}`} style={{ width: '90%' }} />
                        <div className={`${styles.paragraphLine} ${styles.skeletonPulse}`} style={{ width: '75%' }} />
                    </div>

                    <div className={styles.detailCardSection}>
                        <div className={`${styles.sectionTitle} ${styles.skeletonPulse}`} />
                        <div className={`${styles.featureBox} ${styles.skeletonPulse}`} />
                        <div className={`${styles.featureBox} ${styles.skeletonPulse}`} />
                        <div className={`${styles.featureBox} ${styles.skeletonPulse}`} />
                    </div>
                </div>

                <div>
                    <div className={styles.detailCardSection}>
                        <div className={`${styles.sectionTitle} ${styles.skeletonPulse}`} style={{ width: '60%' }} />
                        <div className={`${styles.paragraphLine} ${styles.skeletonPulse}`} />
                        <div className={`${styles.btnSkeleton} ${styles.skeletonPulse}`} style={{ width: '100%', height: '48px', marginTop: '12px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
