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
const MatchIcon = '/assets/icons/Img1.svg';
const AlgomaticIcon = '/assets/icons/algomaticIcon.svg';
const AsicIcon = '/assets/icons/asic.svg';
const NeweraLogo = '/assets/icons/Img1.svg';

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
        id: 'edufins',
        name: 'Edufins Capital',
        subtitle: 'Primary FX & CFD Broker',
        logo: EdufinsIcon,
        category: 'Brokers',
        status: 'Connected',
        statusType: 'connected',
        description: 'Multi-asset Forex and CFD brokerage with high-grade liquidity, tight spreads, and instant MT5 execution.',
        features: [
            'Up to 1:500 Leverage available',
            'Zero deposit & withdrawal fees',
            'Direct volume credit sync with Trader Master',
            'Raw spreads starting from 0.0 pips'
        ],
        websiteUrl: 'https://edufins.com',
        canSync: true
    },
    {
        id: 'mt5',
        name: 'MetaTrader 5 (MT5)',
        subtitle: 'Trading Infrastructure Platform',
        logo: MetaIcon,
        category: 'Platforms',
        status: 'Supported',
        statusType: 'supported',
        description: 'Industry-standard global trading terminal supporting automated Expert Advisors (EAs), custom indicators, and multi-asset charts.',
        features: [
            'Seamless account binding via MT5 ID',
            'Real-time automated order sync & live analysis',
            'Advanced charting & multi-timeframe analysis',
            'Available on Desktop, Mobile, and Web'
        ],
        websiteUrl: 'https://www.metatrader5.com',
        canSync: true
    },
    {
        id: 'match-trader',
        name: 'Match-Trader Platform',
        subtitle: 'Next-Gen Trading Engine',
        logo: MatchIcon,
        category: 'Platforms',
        status: 'Supported',
        statusType: 'supported',
        description: 'High-performance proprietary web trading platform built with integrated TradingView charts and smart order routing.',
        features: [
            'TradingView interactive charting integration',
            'Ultra-low latency execution engine',
            'Web and PWA mobile app integration',
            'Real-time risk management analytics'
        ],
        websiteUrl: 'https://match-trade.com',
        canSync: false
    },
    {
        id: 'algomatic',
        name: 'Algomatic Quant Broker',
        subtitle: 'Automated Algo Brokerage',
        logo: AlgomaticIcon,
        category: 'Algo Brokers',
        status: 'Partner',
        statusType: 'partner',
        description: 'Specialized quantitative brokerage infrastructure offering FIX API access, strategy backtesting, and automated trade routing.',
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
        id: 'asic',
        name: 'ASIC Regulated Partner',
        subtitle: 'Tier-1 Regulated Environment',
        logo: AsicIcon,
        category: 'Regulated Partners',
        status: 'Verified Partner',
        statusType: 'connected',
        description: 'Brokerage architecture backed by Tier-1 ASIC (Australian Securities and Investments Commission) regulatory oversight.',
        features: [
            'Segregated client bank accounts (Tier-1 banks)',
            'Negative balance protection guaranteed',
            'Regular independent financial audits',
            'Strict compliance & investor protection'
        ],
        websiteUrl: 'https://asic.gov.au',
        canSync: false
    },
    {
        id: 'newera',
        name: 'Newera Brokerage Stack',
        subtitle: 'Native Credit Gateway',
        logo: NeweraLogo,
        category: 'Brokers',
        status: 'Native Partner',
        statusType: 'partner',
        description: 'Native volume-to-credit integration engine powering your Trader Master AI usage credits through live trading activity.',
        features: [
            'Automated 1 Lot = Credit conversion',
            'Direct MT5 account link & balance check',
            'Real-time credit balance updating',
            'Zero platform subscription required'
        ],
        websiteUrl: 'https://newera.com',
        canSync: true
    }
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
        { name: 'Match-Trader', img: MatchIcon },
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
                    {['All', 'Brokers', 'Platforms', 'Algo Brokers', 'Regulated Partners'].map((tab) => (
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
                                        <img src={broker.logo} alt={broker.name} />
                                    </div>                                  
                                </div>

                                <div className={styles.cardBody}>
                                    <h3>{broker.name}</h3>
                                    <div className={styles.subtitle}>{broker.subtitle}</div>
                                    <p className={styles.description}>{broker.description}</p>

                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                           
                                <a
                                    href={broker.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.secondaryBtn}
                                    title="Visit Official Website"
                                >
                                    <ExternalLinkIcon />
                                </a>
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
