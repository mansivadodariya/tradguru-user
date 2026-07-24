'use client';
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './broker.module.scss';
import NeweraCreditsModal from '@/components/neweraCreditsModal';
import { getStoredUserId } from '@/lib/authSession';
import toast from 'react-hot-toast';

// Logos from sliding logos section
const EdufinsIcon = '/assets/icons/edufins.svg';
const MetaIcon = '/assets/icons/Img2.svg';
const AlgomaticIcon = '/assets/icons/algomaticIcon.svg';
const AsicIcon = '/assets/icons/asic.svg';
const NeweraLogo = '/assets/icons/Img1.svg';
const FundedMasterLogo = '/assets/icons/Img2.svg';

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

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

const brokerList = [
    {
        id: 'newera',
        name: 'Newera Brokerage',
        subtitle: 'Liquidity Gateway',
        logo: NeweraLogo,
        category: 'Brokers',
        status: 'Native Partner',
        statusType: 'partner',
        description: 'Native volume-to-credit integration engine powering your Trader Master AI usage credits directly through MT5 trading volume.',
        features: [
            'Automated 1 Lot = Credit conversion',
            'Direct MT5 account link & balance check',
            'Real-time credit balance updating',
            'Zero platform subscription required'
        ],
        websiteUrl: 'https://newera.com',
        canSync: true
    },
    {
        id: 'algomatic',
        name: 'Algomatic Quant',
        subtitle: 'Algo Execution Engine',
        logo: AlgomaticIcon,
        category: 'Algo Brokers',
        status: 'Partner',
        statusType: 'partner',
        description: 'High-performance quantitative brokerage infrastructure offering direct FIX API access, strategy hosting, and automated risk engines.',
        features: [
            'Quantitative model hosting & execution',
            'Direct FIX API & webhooks connectivity',
            'Automated risk management & drawdown limits',
            'Institutional grade liquidity pools'
        ],
        websiteUrl: 'https://algomatic.com',
        canSync: false
    },
    {
        id: 'edufins',
        name: 'Edufins Academy',
        subtitle: 'Trading Education Platform',
        logo: EdufinsIcon,
        category: 'Learning Platforms',
        status: 'Education Partner',
        statusType: 'supported',
        description: 'Premier financial trading academy offering structured forex courses, live market analysis webinars, risk management tools, and professional trader mentoring.',
        features: [
            'Comprehensive Forex & CFD trading courses',
            'Live market analysis & trading webinars',
            'Arbitrage & algorithmic trading education',
            'Risk management frameworks & trading tools'
        ],
        websiteUrl: 'https://edufins.com',
        canSync: false
    },
    {
        id: 'funded-master',
        name: 'Funded Master',
        subtitle: 'Prop Trading Community',
        logo: FundedMasterLogo,
        category: 'Prop Trading',
        status: 'Partner',
        statusType: 'partner',
        description: 'To win the game, you need strong support and diligent preparation. Join For Traders Community — traders worldwide (18+) can apply and trade in financial markets.',
        features: [
            'Global traders application (18+ years old)',
            'Strong support & diligent preparation community',
            'Financial markets trading access & evaluation',
            'Up to 90% profit splits for disciplined traders'
        ],
        websiteUrl: 'https://fundedmaster.com/',
        canSync: false
    },
    {
        id: 'asic',
        name: 'ASIC Regulated Partner',
        subtitle: 'Tier-1 Regulation',
        logo: AsicIcon,
        category: 'Regulated Partners',
        status: 'Verified Partner',
        statusType: 'connected',
        description: 'Backed by Tier-1 Australian Securities & Investments Commission regulation, ensuring segregated client funds and negative balance protection.',
        features: [
            'Segregated client bank accounts (Tier-1 banks)',
            'Negative balance protection guaranteed',
            'Regular independent financial audits',
            'Strict compliance & investor protection'
        ],
        websiteUrl: 'https://asic.gov.au',
        canSync: false
    },

];

export default function BrokerPage() {
    const [selectedTab, setSelectedTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const userId = getStoredUserId();

    const filteredBrokers = useMemo(() => {
        return brokerList.filter((broker) => {
            const matchesTab = selectedTab === 'All' || broker.category === selectedTab;
            const matchesSearch = broker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                broker.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                broker.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [selectedTab, searchQuery]);

    const handleConnectClick = (broker) => {
        if (broker.canSync) {
            setShowCreditsModal(true);
        } else {
            toast.success(`${broker.name} is fully integrated into Trader Master!`);
        }
    };

    // Duplicate ticker logos for smooth infinite marquee
    const tickerLogos = [
        { name: 'Edufins', img: EdufinsIcon },
        { name: 'MT5', img: MetaIcon },
        { name: 'Funded Master', img: FundedMasterLogo },
        { name: 'Algomatic', img: AlgomaticIcon },
        { name: 'ASIC', img: AsicIcon },
        { name: 'Newera', img: NeweraLogo }
    ];
    const duplicatedTicker = [...tickerLogos, ...tickerLogos, ...tickerLogos, ...tickerLogos];

    return (
        <div className={styles.brokerPage}>
            {/* Hero Banner */}
            <div className={styles.heroBanner}>
                <div className={styles.badge}>Broker & Platform Hub</div>
                <h1>Integrated Brokerage & Trading Infrastructure</h1>
                <p>
                    Connect your MT5 account, view verified broker partners from our sliding marquee stack, 
                    and earn AI credits automatically through your daily trading volume.
                </p>
               
            </div>

       

            {/* Controls Bar: Category Tabs & Search */}
            <div className={styles.controlsRow}>
                <div className={styles.tabs}>
                    {['All', 'Brokers', 'Platforms', 'Algo Brokers', 'Prop Trading', 'Learning Platforms', 'Regulated Partners'].map((tab) => (
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

            {/* Brokers Grid */}
            {filteredBrokers.length > 0 ? (
                <div className={styles.brokersGrid}>
                    {filteredBrokers.map((broker) => (
                        <div key={broker.id} className={styles.brokerCard}>
                            <div>
                                <div className={styles.cardHeader}>
                                    <div className={styles.logoBox}>
                                        <img src={broker.logo} alt={broker.name} style={{ filter: 'brightness(1.5)' }} />
                                    </div>
                                    
                                </div>

                                <div className={styles.cardBody}>
                                    <h3>{broker.name}</h3>
                                    <p className={styles.description}>{broker.description}</p>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                {broker.canSync ? (
                                    <div className={styles.actionGroup}>
                                        <a
                                            href={broker.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.linkBtn}
                                        >
                                            <span>Visit Official Platform</span>
                                            <ExternalLinkIcon />
                                        </a>
                                    
                                    </div>
                                ) : (
                                    <a
                                        href={broker.websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.linkBtn}
                                    >
                                        <span>Visit Official Platform</span>
                                        <ExternalLinkIcon />
                                    </a>
                                )}
                            </div>
                        </div>
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
