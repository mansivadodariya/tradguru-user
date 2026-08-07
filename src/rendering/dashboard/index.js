'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.scss';
import CommonSearch from '@/components/commonSearch';
import { dashboardApi } from '@/lib/api';
import { getStoredUser, getStoredUserId } from '@/lib/authSession';
import Loader from '@/components/loader';
import EcosystemSection from '../home/ecosystemSection';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';

const CardIcon = '/assets/icons/dashboardCard.svg'
const iconOne = '/assets/icons/IconOne.svg'
const iconTwo = '/assets/icons/IconTwo.svg'
const iconThree = '/assets/icons/IconThree.svg'
const iconFour = '/assets/icons/IconFour.svg'
const ArrowIcon = '/assets/icons/arrow.svg';
const state1 = '/assets/icons/state1.svg';
const state2 = '/assets/icons/state2.svg';
const state3 = '/assets/icons/state3.svg';
const state4 = '/assets/icons/state4.svg';

function getUserNameFromLocalStorage() {
    const parsed = getStoredUser();
    if (!parsed) return 'Trader';
    const name = [parsed.first_name, parsed.last_name].filter(Boolean).join(' ');
    return name || parsed.email || 'Trader';
}

function timeAgo(dateLike) {
    const d = dateLike ? new Date(dateLike) : null;
    if (!d || Number.isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;
    hours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

function formatSummary(text) {
    if (!text || typeof text !== 'string') return '';
    try {
        let decoded = text.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
            return String.fromCharCode(parseInt(grp, 16));
        });

        decoded = decoded.replace(/\\n/g, '\n');
        let formatted = decoded.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        if (formatted.startsWith('- ')) {
            formatted = '• ' + formatted.substring(2);
        } else if (formatted.startsWith('-\t')) {
            formatted = '• ' + formatted.substring(2);
        }

        formatted = formatted.replace(/\n-\s*/g, '<br />• ');
        formatted = formatted.replace(/\n/g, '<br />');

        return formatted;
    } catch (e) {
        console.error("Error formatting summary:", e);
        return text;
    }
}

export default function Dashboard() {
    const router = useRouter();
    const { t } = useLanguage();
    const [userId, setUserId] = useState('');
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        const syncUser = () => {
            setUserId(getStoredUserId());
            setName(getUserNameFromLocalStorage());
            setGreeting(getGreeting());
        };
        syncUser();
        window.addEventListener('user:updated', syncUser);
        return () => window.removeEventListener('user:updated', syncUser);
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const [statsRes, recentRes] = await Promise.allSettled([
                    dashboardApi.getStats(userId),
                    dashboardApi.getRecentActivity(userId),
                ]);

                if (!mounted) return;

                const statsPayload =
                    statsRes.status === 'fulfilled' ? (statsRes.value?.data ?? statsRes.value) : null;
                setStats(statsPayload);

                const recentPayload =
                    recentRes.status === 'fulfilled' ? (recentRes.value?.data?.recent_activity ?? recentRes.value) : [];
                setRecentActivity(Array.isArray(recentPayload) ? recentPayload : (recentPayload?.items || []));
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [userId]);

    const quickActions = useMemo(
        () => [
            {
                title: t('dashboard.snapChart', 'Upload Trade Screenshot'),
                desc: t('tradeSnap.dropzoneText', 'Upload any chart screenshot and get AI analysis instantly.'),
                cta: t('common.exploreNow', 'Upload Now'),
                href: '/trade-snap',
                accent: styles.qaBlue,
                icon: iconOne
            },
            {
                title: t('nav.aiStrategy', 'AI Strategy'),
                desc: t('nav.aiStrategyDesc', 'Build, test and optimize AI-powered trading strategies.'),
                cta: t('common.exploreNow', 'Explore Now'),
                href: '/ai-strategy',
                accent: styles.qaGreen,
                icon: iconTwo
            },
            {
                title: t('dashboard.askAssistant', 'Ask AI Chat'),
                desc: t('aiChat.subtitle', 'Ask any trading or finance related question to AI.'),
                cta: t('common.exploreNow', 'Ask Now'),
                href: '/ai-assistant?tab=chat',
                accent: styles.qaPurple,
                icon: iconThree
            },
            {
                title: t('nav.economicCalendar', 'Economic Calendar'),
                desc: t('home.tradingDeskSubtitle', 'Track high-impact news and plan trades around events.'),
                cta: t('common.exploreNow', 'Open Calendar'),
                href: '/economic-calendar',
                accent: styles.qaOrange,
                icon: iconFour
            },

        ],
        [t]
    );

    const recents = useMemo(() => {
        const normalize = (item, index) => {
            const type = item?.type || item?.activity_type || item?.kind || "";
            const normalizedType = String(type)
                .toLowerCase()
                .includes("blog")
                ? "blog"
                : "chat";

            let summary = "";
            if (typeof item?.summary === "string") {
                try {
                    const parsed = JSON.parse(item.summary);
                    summary = parsed?.short_response || "";
                } catch {
                    summary = item.summary
                        .replace('{"short_response":"', "")
                        .replace('{"short_response": "', "")
                        .replace(/"}$/, "")
                        .replace(/\\"/g, '"');
                }
            } else if (item?.summary?.short_response) {
                summary = item.summary.short_response;
            }

            return {
                type: normalizedType,
                id: item?.id || item?.activity_id || item?.chat_id || item?.created_at || index,
                title: item?.title || item?.question || item?.message || "Recent item",
                summary,
                pair: item?.pair || item?.symbol || "",
                created_at: item?.created_at || item?.createdAt || item?.time || "",
            };
        };

        return (Array.isArray(recentActivity) ? recentActivity : [])
            .map(normalize)
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 8);
    }, [recentActivity]);

    const openRecent = (item) => {
        const params = new URLSearchParams();
        params.set('tab', item.type);
        params.set('open', String(item.id));
        router.push(`/ai-assistant?${params.toString()}`);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('dashboard.goodMorning', 'Good Morning');
        else if (hour < 17) return t('dashboard.goodAfternoon', 'Good Afternoon');
        else if (hour < 21) return t('dashboard.goodEvening', 'Good Evening');
        else return t('dashboard.goodNight', 'Good Night');
    };

    const statsData = [
        {
            id: 1,
            label: t('dashboard.recentAnalyses', 'Total Trade Analysis'),
            value: stats?.total_analysis_history ?? "—",
            delta: "Analysis History",
            icon: state1,
        },
        {
            id: 2,
            label: t('nav.aiChat', 'Total Chats'),
            value: stats?.total_chat_history ?? "—",
            delta: "Chat History",
            icon: state2,
        },
        {
            id: 3,
            label: t('dashboard.creditsBalance', 'Available Credits'),
            value: stats?.available_credits ?? "—",
            delta: `Total Credits: ${stats?.total_credits ?? 0}`,
            icon: state3,
        },
        {
            id: 4,
            label: t('topbar.credits', 'Total Credits'),
            value: stats?.total_credits ?? "—",
            delta: "Total Credits",
            icon: state4,
        },
    ];

    return (
        <div className={styles.dashboard}>
            <section className={styles.hero}>
                <div className={styles.heroText}>
                    <div className={styles.heroKicker}>{t('home.heroTitle', 'AI Powered insights ready')}</div>
                    <h1>
                        {greeting}, <span>{name}</span>
                    </h1>
                </div>
            </section>

            <section className={styles.statsGrid}>
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div className={`${styles.statCard} ${styles.skeletonCard}`} key={i}>
                            <div className={`${styles.skeletonIcon} ${styles.shimmer}`} />
                            <div className={styles.stat}>
                                <div className={`${styles.skeletonLabel} ${styles.shimmer}`} />
                                <div className={`${styles.skeletonValue} ${styles.shimmer}`} />
                            </div>
                        </div>
                    ))
                ) : (
                    statsData.map((item) => (
                        <div className={styles.statCard} key={item.id}>
                            <img src={item.icon} alt={item.label} />
                            <div className={styles.stat}>
                                <div className={styles.statLabel}>{item.label}</div>
                                <div className={styles.statValue}>{item.value}</div>
                            </div>
                        </div>
                    ))
                )}
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>{t('dashboard.quickActions', 'Quick Actions')}</h2>
                </div>
                <div className={styles.quickGrid}>
                    {quickActions.map((qa) => (
                        <div key={qa.title} className={`${styles.qaCard} `}>
                            <div className={styles.qaBody}>
                                <img src={qa.icon} alt={qa.title} />
                                <h3>{qa.title}</h3>
                                <p>{qa.desc}</p>
                                <div className={styles.dividerLine}></div>
                                <Link href={qa.href} className={styles.qaFooter} aria-label={qa.cta}>
                                    <div className={styles.icon}>
                                        <img src={ArrowIcon} alt={ArrowIcon} />
                                    </div>
                                    <span>{qa.cta}</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>{t('dashboard.recentAnalyses', 'Recent')}</h2>
                </div>

                <div className={styles.recentCard}>
                    {loading ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.recentTable}>
                                <thead>
                                    <tr>
                                        <th>{t('dashboard.time', 'Time')}</th>
                                        <th>{t('dashboard.type', 'Type')}</th>
                                        <th>{t('dashboard.title', 'Title')}</th>
                                        <th>{t('dashboard.summary', 'Summary')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i} className={styles.skeletonRow}>
                                            <td><div className={`${styles.skeletonBadge} ${styles.shimmer}`} /></td>
                                            <td><div className={`${styles.skeletonText} ${styles.shimmer}`} /></td>
                                            <td><div className={`${styles.skeletonTextWide} ${styles.shimmer}`} /></td>
                                            <td><div className={`${styles.skeletonTextShort} ${styles.shimmer}`} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : recents.length === 0 ? (
                        <div className={styles.recentEmpty}>
                            {t('dashboard.noRecentActivity', 'No recent chats or blogs yet.')}
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.recentTable}>
                                <thead>
                                    <tr>
                                        <th>{t('dashboard.time', 'Time')}</th>
                                        <th>{t('dashboard.title', 'Title')}</th>
                                        <th>{t('dashboard.summary', 'Summary')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recents.map((item) => (
                                        <tr
                                            key={`${item.type}-${item.id}`}
                                            onClick={() => openRecent(item)}
                                            className={styles.tableRow}
                                        >
                                            <td>
                                                <div className={styles.recentTime}>
                                                    {timeAgo(item.created_at)}
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    className={styles.recentTitle}
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.recentSummary}>
                                                    {item.summary ? (
                                                        <div
                                                            dangerouslySetInnerHTML={{
                                                                __html: formatSummary(item.summary),
                                                            }}
                                                        />
                                                    ) : (
                                                        "-"
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

