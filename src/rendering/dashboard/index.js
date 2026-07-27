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
        // 1. Decode unicode escape sequences like \u2014
        let decoded = text.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
            return String.fromCharCode(parseInt(grp, 16));
        });

        // 2. Normalize literal newlines
        decoded = decoded.replace(/\\n/g, '\n');

        // 3. Convert markdown bold **text** to HTML <strong>text</strong>
        let formatted = decoded.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Convert markdown italic *text* to HTML <em>text</em>
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // 4. Handle leading bullet points
        if (formatted.startsWith('- ')) {
            formatted = '• ' + formatted.substring(2);
        } else if (formatted.startsWith('-\t')) {
            formatted = '• ' + formatted.substring(2);
        }

        // 5. Replace subsequent newlines and bullets
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
                title: 'Upload Trade Screenshot',
                desc: 'Upload any chart screenshot and get AI analysis instantly.',
                cta: 'Upload Now',
                href: '/trade-snap',
                accent: styles.qaBlue,
                icon: iconOne
            },
            {
                title: 'Ask AI Chat',
                desc: 'Ask any trading or finance related question to AI.',
                cta: 'Ask Now',
                href: '/ai-assistant?tab=chat',
                accent: styles.qaPurple,
                icon: iconTwo

            },
            {
                title: 'Economic Calendar',
                desc: 'Track high-impact news and plan trades around events.',
                cta: 'Open Calendar',
                href: '/economic-calendar',
                accent: styles.qaOrange,
                icon: iconFour

            },
            {
                title: 'Manage Profile',
                desc: 'Update your personal information, account settings, and profile preferences easily.',
                cta: 'Manage Now',
                href: '/profile',
                accent: styles.qaGreen,
                icon: iconThree
            }
        ],
        []
    );

    const recents = useMemo(() => {
        const normalize = (item, index) => {

            const type = item?.type || item?.activity_type || item?.kind || "";

            const normalizedType = String(type)
                .toLowerCase()
                .includes("blog")
                ? "blog"
                : "chat";

            // Extract short_response from summary JSON
            let summary = "";

            // safer summary extraction
            if (typeof item?.summary === "string") {

                // try parse json
                try {
                    const parsed = JSON.parse(item.summary);
                    summary = parsed?.short_response || "";
                } catch {

                    // fallback raw string cleanup
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
                id:
                    item?.id ||
                    item?.activity_id ||
                    item?.chat_id ||
                    item?.created_at ||
                    index,

                title:
                    item?.title ||
                    item?.question ||
                    item?.message ||
                    "Recent item",

                summary,

                pair: item?.pair || item?.symbol || "",

                created_at:
                    item?.created_at ||
                    item?.createdAt ||
                    item?.time ||
                    "",
            };
        };

        return (Array.isArray(recentActivity)
            ? recentActivity
            : []
        )
            .map(normalize)
            .sort(
                (a, b) =>
                    new Date(b.created_at || 0).getTime() -
                    new Date(a.created_at || 0).getTime()
            )
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

        if (hour < 12) {
            return "Good Morning";
        } else if (hour < 17) {
            return "Good Afternoon";
        } else if (hour < 21) {
            return "Good Evening";
        } else {
            return "Good Night";
        }
    };
    const statsData = [
        {
            id: 1,
            label: "Total Trade Analysis",
            value: stats?.total_analysis_history ?? "—",
            delta: "Analysis History",
            icon: state1,
        },
        {
            id: 2,
            label: "Total Chats",
            value: stats?.total_chat_history ?? "—",
            delta: "Chat History",
            icon: state2,
        },
        {
            id: 3,
            label: "Available Credits",
            value: stats?.available_credits ?? "—",
            delta: `Total Credits: ${stats?.total_credits ?? 0}`,
            icon: state3,
        },
        {
            id: 4,
            label: "Total Credits",
            value: stats?.total_credits ?? "—",
            delta: "Total Credits",
            icon: state4,
        },
    ];
    return (
        <div className={styles.dashboard}>

            <section className={styles.hero}>
                <div className={styles.heroText}>
                    <div className={styles.heroKicker}>AI Powered insights ready</div>
                    <h1>
                        {greeting}, <span>{name}</span>
                    </h1>
                    {/* <p>Your Edge is Up 3.2% This Month. 4 new high confidence signals waiting for review.</p> */}
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
                    <h2>Quick Actions</h2>
                </div>
                <div className={styles.quickGrid}>
                    {quickActions.map((qa) => (
                        <div key={qa.title} className={`${styles.qaCard} `}>

                            <div className={styles.qaBody}>
                                <img src={qa.icon} alt={qa.label} />
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
                    <h2>Recent</h2>

                </div>

                <div className={styles.recentCard}>
                    {loading ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.recentTable}>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Type</th>
                                        <th>Title</th>
                                        <th>Summary</th>
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
                            No recent chats or blogs yet.
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.recentTable}>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Title</th>
                                        <th>Summary</th>
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
                                                <div
                                                    className={styles.recentSummary}
                                                >
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

            {/* <EcosystemSection /> */}
        </div>
    );
}

