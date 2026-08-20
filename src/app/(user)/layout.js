"use client";
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import AuthGuard from '@/components/authGuard';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeProvider } from '@/context/ThemeContext';
import NeweraCreditsModal from '@/components/neweraCreditsModal';
import PaymentStatusModal from '@/components/paymentStatusModal';
import { extractAvailableCredits, CREDITS_UPDATED_EVENT, notifyCreditsUpdated, refreshCreditsFromServer } from '@/lib/credits';
import { captureUtmParameters } from '@/lib/utm';
import { getStoredUserId } from '@/lib/authSession';
import { dashboardApi, neweraApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import './layout.scss';

const ROUTE_TAB_MAP = {
    '/dashboard': 'Dashboard',
    '/trade-snap': 'AI Trade',
    '/ai-assistant': 'AI Chat',
    '/ai-strategy': 'AI Strategy',
    '/ai-strategy/live': 'AI Strategy',
    '/ai-strategy/strategy': 'AI Strategy',
    '/economic-calendar': 'Economic Calendar',
    '/credit-history': 'Credit History',
    '/plans': 'Subscription Plans',
    '/broker': 'Broker',
    '/brokers': 'Broker',
    '/profile': 'Profile',
    '/settings': 'Profile',
};

const layout = ({ children }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [userId, setUserId] = useState('');
    const [isTabAllowed, setIsTabAllowed] = useState(true);
    const isCheckingRef = React.useRef(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1200);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('sidebar_collapsed');
            if (stored === 'true') {
                setIsCollapsed(true);
            }
        } catch { /* ignore */ }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('sidebar_collapsed', String(next));
            } catch { /* ignore */ }
            return next;
        });
    };

    const handleMenuClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth <= 1200) {
            setIsSidebarOpen(true);
        } else {
            toggleCollapse();
        }
    };

    const checkAndShowModalIfZero = (currentCredits) => {
        if (currentCredits !== undefined && currentCredits !== null) {
            if (Number(currentCredits) <= 0) {
                setShowCreditsModal(true);
            } else {
                setShowCreditsModal(false);
            }
        }
    };

    useEffect(() => {
        captureUtmParameters();
        const uid = getStoredUserId();
        setUserId(uid);

        if (uid) {
            const syncUtmToDb = async () => {
                try {
                    const { getUtmParameters } = await import('@/lib/utm');
                    const utmParams = getUtmParameters();
                    if ((utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) && supabase) {
                        const { data: dbUser } = await supabase
                            .from('users')
                            .select('utm_source, utm_medium, utm_campaign')
                            .eq('id', uid)
                            .maybeSingle();

                        if (dbUser && !dbUser.utm_source && !dbUser.utm_medium && !dbUser.utm_campaign) {
                            await supabase
                                .from('users')
                                .update({
                                    utm_source: utmParams.utm_source || null,
                                    utm_medium: utmParams.utm_medium || null,
                                    utm_campaign: utmParams.utm_campaign || null
                                })
                                .eq('id', uid);
                        }
                    }
                } catch (e) {
                    console.warn("Failed to sync UTM parameters:", e);
                }
            };
            syncUtmToDb();

            dashboardApi.getStats(uid)
                .then((res) => {
                    const currentCredits = res?.data?.available_credits;
                    checkAndShowModalIfZero(currentCredits);
                })
                .catch((err) => {
                    console.warn("Failed to check initial credits on layout mount:", err);
                });
        }

        const handleTabVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const activeUid = getStoredUserId();
                if (activeUid) {
                    dashboardApi.getStats(activeUid)
                        .then((res) => {
                            const currentCredits = res?.data?.available_credits;
                            checkAndShowModalIfZero(currentCredits);
                        })
                        .catch((err) => {
                            console.warn("Failed to check credits on tab switch:", err);
                        });
                }
            }
        };

        const onCreditsUpdated = (e) => {
            const currentCredits = e?.detail?.available_credits;
            checkAndShowModalIfZero(currentCredits);
        };

        window.addEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated);
        document.addEventListener('visibilitychange', handleTabVisibilityChange);
        return () => {
            window.removeEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated);
            document.removeEventListener('visibilitychange', handleTabVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const checkPermission = async () => {
            if (!supabase) return;
            const currentTabName = Object.entries(ROUTE_TAB_MAP).find(([route]) =>
                pathname === route || pathname.startsWith(`${route}/`)
            )?.[1];

            if (!currentTabName) {
                setIsTabAllowed(true);
                return;
            }

            try {
                const { data: visibleTabs, error } = await supabase.rpc('get_visible_dashboard_tabs');
                if (!error && Array.isArray(visibleTabs)) {
                    const isVisible = visibleTabs.some(
                        (tab) => tab.name.toLowerCase() === currentTabName.toLowerCase() && tab.is_visible === true
                    );
                    setIsTabAllowed(isVisible);
                } else {
                    setIsTabAllowed(true);
                }
            } catch (err) {
                setIsTabAllowed(true);
            }
        };

        checkPermission();
    }, [pathname]);

    if (!isTabAllowed) {
        return (
            <AuthGuard>
                <ThemeProvider>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '20px' }}>
                        <h1 style={{ fontSize: '5rem', marginBottom: '0.5rem', color: '#ef4444', fontWeight: '800' }}>404</h1>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Tab Disabled / Access Denied</h2>
                        <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>This page has been turned off by administrator.</p>
                        <a href="/dashboard" style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
                            Back to Dashboard
                        </a>
                    </div>
                </ThemeProvider>
            </AuthGuard>
        );
    }

    const effectiveCollapsed = isMobile ? false : isCollapsed;

    return (
        <AuthGuard>
            <ThemeProvider>
                <div className={`user-layout ${effectiveCollapsed ? 'collapsed' : ''}`}>
                    <div className={`sidebar-wrapper ${effectiveCollapsed ? 'collapsed' : ''} ${isSidebarOpen ? 'open' : ''}`}>
                        <Sidebar
                            onClose={() => setIsSidebarOpen(false)}
                            isCollapsed={effectiveCollapsed}
                            onToggleCollapse={toggleCollapse}
                        />
                    </div>
                    {isSidebarOpen && (
                        <div className='sidebar-overlay' onClick={() => setIsSidebarOpen(false)} />
                    )}
                    <div className='children-wrapper'>
                        <Topbar onMenuClick={handleMenuClick} />
                        <div className='children-spacing'>
                            {children}
                        </div>
                    </div>
                </div>

                {showCreditsModal && (
                    <NeweraCreditsModal
                        userId={userId}
                        onClose={() => setShowCreditsModal(false)}
                        onSuccess={(creditsVal) => {
                            setShowCreditsModal(false);
                            if (creditsVal !== undefined && creditsVal !== null) {
                                notifyCreditsUpdated(creditsVal);
                            } else {
                                refreshCreditsFromServer();
                            }
                        }}
                    />
                )}

                <PaymentStatusModal />
            </ThemeProvider>
        </AuthGuard>
    );
}

export default layout;

