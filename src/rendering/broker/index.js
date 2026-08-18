'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './broker.module.scss';
import NeweraCreditsModal from '@/components/neweraCreditsModal';
import { getStoredUserId } from '@/lib/authSession';
import { fetchBrokers, brokerList } from '@/lib/brokersData';
import toast from 'react-hot-toast';

import BrokerCard from '@/components/brokerCard';
import { BrokerCardSkeleton } from '@/components/brokerSkeleton';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';

// Logos from sliding logos section
const EdufinsIcon = '/assets/icons/edufins.svg';
const MetaIcon = '/assets/icons/Img2.svg';
const AlgomaticIcon = '/assets/icons/algomaticIcon.svg';
const AsicIcon = '/assets/icons/asic.svg';
const NeweraLogo = '/assets/icons/Img1.svg';
const FundedMasterLogo = '/assets/icons/Img2.svg';

const SearchIcon = () => (
    <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export default function BrokerPage() {
    const { t } = useLanguage();
    const [brokers, setBrokers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const userId = getStoredUserId();

    useEffect(() => {
        let isMounted = true;
        async function loadBrokers() {
            try {
                const data = await fetchBrokers();
                if (isMounted) {
                    setBrokers(data && data.length > 0 ? data : brokerList);
                }
            } catch (_) {
                if (isMounted) setBrokers(brokerList);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        loadBrokers();
        return () => { isMounted = false; };
    }, []);

    const filteredBrokers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return brokers.filter((broker) => {
            const matchesTab = selectedTab === 'All' || broker.category === selectedTab;
            const matchesSearch =
                (broker.name || '').toLowerCase().includes(q) ||
                (broker.name_ar || '').toLowerCase().includes(q) ||
                (broker.name_ph || '').toLowerCase().includes(q) ||
                (broker.subtitle || '').toLowerCase().includes(q) ||
                (broker.subtitle_ph || '').toLowerCase().includes(q) ||
                (broker.description || '').toLowerCase().includes(q) ||
                (broker.description_ph || '').toLowerCase().includes(q);
            return matchesTab && matchesSearch;
        });
    }, [brokers, selectedTab, searchQuery]);

    const handleConnectClick = (broker) => {
        if (broker.canSync) {
            setShowCreditsModal(true);
        } else {
            toast.success(`${broker.name} is fully integrated into Trader Master!`);
        }
    };

    return (
        <div className={styles.brokerPage}>
            {/* Hero Banner */}
            <div className={styles.heroBanner}>
                <div {...getBidiProps(t('broker.hubBadge', 'Broker & Platform Hub'), styles.badge)}>
                    {t('broker.hubBadge', 'Broker & Platform Hub')}
                </div>
                <h1 {...getBidiProps(t('broker.title', 'Integrated Brokerage & Trading Infrastructure'))}>
                    {t('broker.title', 'Integrated Brokerage & Trading Infrastructure')}
                </h1>
                <p {...getBidiProps(t('broker.subtitle', 'Connect your MT5 account, view verified broker partners from our sliding marquee stack, and earn AI credits automatically through your daily trading volume.'))}>
                    {t('broker.subtitle', 'Connect your MT5 account, view verified broker partners from our sliding marquee stack, and earn AI credits automatically through your daily trading volume.')}
                </p>
            </div>

            {/* Controls Bar: Category Tabs & Search (Only shown if more than 1 broker) */}
            {!isLoading && brokers.length > 1 && (
                <div className={styles.controlsRow}>
                    <div className={styles.tabs}>
                        {['All', ...Array.from(new Set(brokers.map((b) => b.category)))].map((tab) => (
                            <button
                                key={tab}
                                className={`${styles.tabBtn} ${selectedTab === tab ? styles.active : ''}`}
                                onClick={() => setSelectedTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className={styles.searchBox}>
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search brokers or platforms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Brokers Grid */}
            {isLoading ? (
                <div className={styles.brokersGrid}>
                    {Array.from({ length: (brokers && brokers.length > 1) ? brokers.length : 1 }).map((_, idx) => (
                        <BrokerCardSkeleton key={idx} />
                    ))}
                </div>
            ) : filteredBrokers.length > 0 ? (
                <div className={styles.brokersGrid}>
                    {filteredBrokers.map((broker) => (
                        <BrokerCard
                            key={broker.id}
                            broker={broker}
                            detailHref={`/broker/${broker.id}`}
                            onConnect={handleConnectClick}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <h3>No brokers found</h3>
                    <p>No broker or platform matching "{searchQuery}" in category "{selectedTab}".</p>
                </div>
            )}

            {/* Credits Sync Modal */}
            {showCreditsModal && (
                <NeweraCreditsModal
                    userId={userId}
                    onClose={() => setShowCreditsModal(false)}
                    onSuccess={() => {
                        setShowCreditsModal(false);
                        toast.success("Broker MT5 Account successfully synced!");
                    }}
                />
            )}
        </div>
    );
}

