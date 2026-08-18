'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './brokerDetail.module.scss';
import { fetchBrokerById, getBrokerById, brokerList } from '@/lib/brokersData';
import { BrokerDetailSkeleton } from '@/components/brokerSkeleton';
import { useLanguage } from '@/context/LanguageContext';

const BackArrowIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

export default function BrokerDetailPage({ brokerId, isPublicLanding = false }) {
    const router = useRouter();
    const { t, tDynamic, language } = useLanguage();
    const [broker, setBroker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadBroker() {
            if (!brokerId) {
                if (isMounted) setIsLoading(false);
                return;
            }
            try {
                const data = await fetchBrokerById(brokerId);
                if (isMounted) {
                    setBroker(data || getBrokerById(brokerId));
                }
            } catch (_) {
                if (isMounted) setBroker(getBrokerById(brokerId));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        loadBroker();
        return () => { isMounted = false; };
    }, [brokerId]);

    const backPath = isPublicLanding ? '/#ecosystem' : '/broker';

    const handleBackClick = () => {
        if (isPublicLanding) {
            router.push('/#ecosystem');
            setTimeout(() => {
                const el = document.getElementById('ecosystem');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                }
            }, 150);
        } else {
            router.push('/broker');
        }
    };

    if (isLoading) {
        return (
            <div className={`${styles.brokerDetailPage} ${isPublicLanding ? styles.publicContainer : ''}`}>
                <BrokerDetailSkeleton />
            </div>
        );
    }

    if (!broker) {
        return (
            <div className={styles.notFound}>
                <h2>{t('broker.notFoundTitle', 'Broker Not Found')}</h2>
                <p>{t('broker.notFoundDesc', 'The requested broker or platform does not exist.')}</p>
                <Link href={backPath} className={styles.backBtn}>
                    <BackArrowIcon /> {t('broker.backToBrokers', 'Back to Brokers')}
                </Link>
            </div>
        );
    }

    const name = tDynamic(broker, 'name') || broker.name;
    const subtitle = tDynamic(broker, 'subtitle') || broker.subtitle;
    const description = tDynamic(broker, 'description') || broker.description;
    const featuresList = (language === 'ph' && Array.isArray(broker.features_ph) && broker.features_ph.length > 0)
        ? broker.features_ph
        : (language === 'ar' && Array.isArray(broker.features_ar) && broker.features_ar.length > 0)
        ? broker.features_ar
        : (broker.features || []);

    return (
        <div className={`${styles.brokerDetailPage} ${isPublicLanding ? styles.publicContainer : ''}`}>
            {/* Top Navigation */}
            <div className={styles.topNav}>
                <button type="button" className={styles.backLink} onClick={handleBackClick}>
                    <BackArrowIcon />
                    <span>{t('broker.backToBrokersFull', 'Back to Brokers & Platforms')}</span>
                </button>
            </div>

            {/* Main Header Banner */}
            <div className={styles.heroBanner}>
                <div className={styles.logoRow}>
                    {broker.logo && (
                        <div className={styles.logoBox}>
                            <img src={broker.logo} alt={name || 'Broker Logo'} style={{ filter: 'brightness(1.5)' }} />
                        </div>
                    )}
                    {broker.category && (
                        <div className={styles.badges}>
                            <span className={styles.categoryBadge}>{broker.category}</span>
                        </div>
                    )}
                </div>

                {name && <h1 className={styles.title}>{name}</h1>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            {/* Content Layout */}
            <div className={styles.contentGrid}>
                {/* Left Column: Details */}
                <div className={styles.mainContent}>
                    {description && (
                        <div className={styles.cardSection}>
                            <h3>{language === 'ar' ? `عن ${name}` : `About ${name}`}</h3>
                            <p className={styles.description}>{description}</p>
                        </div>
                    )}

                    {Array.isArray(featuresList) && featuresList.length > 0 && (
                        <div className={styles.cardSection}>
                            <h3>{t('broker.featuresHeader', 'Key Features & Capabilities')}</h3>
                            <ul className={styles.featureList}>
                                {featuresList.map((feat, idx) => (
                                    <li key={idx} className={styles.featureItem}>
                                        <span className={styles.checkIconBox}>
                                            <CheckIcon />
                                        </span>
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className={styles.cardSection}>
                        <h3>{t('broker.infraHeader', 'Integration & Trading Infrastructure')}</h3>
                        <p className={styles.description}>
                            {t('broker.infraDesc', 'Trader Master connects with verified brokerage APIs and market trading environments to ensure execution speed, real-time logging, and secure data sync.')}
                        </p>
                    </div>
                </div>

                {/* Right Column: Actions Sidebar */}
                {broker.websiteUrl && (
                    <div className={styles.sidebar}>
                        <div className={styles.actionCard}>
                            <h4>{t('broker.officialSiteTitle', 'Official Site & Access')}</h4>
                            <p>{t('broker.officialSiteDesc', 'Access the official platform directly to open accounts, manage funds, or review trading terms.')}</p>

                            <div className={styles.urlBox}>
                                <GlobeIcon />
                                <span>{broker.websiteUrl}</span>
                            </div>

                            <a
                                href={broker.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.visitOfficialBtn}
                            >
                                <span>{t('broker.visitOfficialSite', 'Visit Official Site')}</span>
                                <ExternalLinkIcon />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

