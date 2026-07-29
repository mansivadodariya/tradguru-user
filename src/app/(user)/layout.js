"use client";
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import AuthGuard from '@/components/authGuard';
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import NeweraCreditsModal from '@/components/neweraCreditsModal';
import { extractAvailableCredits, CREDITS_UPDATED_EVENT, notifyCreditsUpdated, refreshCreditsFromServer } from '@/lib/credits';
import { captureUtmParameters } from '@/lib/utm';
import { getStoredUserId } from '@/lib/authSession';
import { dashboardApi, neweraApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import './layout.scss';

const layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [userId, setUserId] = useState('');
    const isCheckingRef = React.useRef(false);

    const checkAndAutoSyncOrShowModal = async (uid) => {
        if (!uid || isCheckingRef.current) return;
        isCheckingRef.current = true;
        try {
            if (supabase) {
                let email = '';
                let login = null;
                let welcomeAwarded = false;
                let depositAwarded = false;

                // 1. Try newera_credits_sync first
                const { data: syncData, error: syncError } = await supabase
                    .from('newera_credits_sync')
                    .select('email, mt5_id, welcome_credits_awarded, deposit_credits_awarded')
                    .eq('user_id', uid)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (syncData && syncData.email && syncData.mt5_id) {
                    email = syncData.email;
                    login = syncData.mt5_id;
                    welcomeAwarded = Boolean(syncData.welcome_credits_awarded);
                    depositAwarded = Boolean(syncData.deposit_credits_awarded);
                } else {
                    // 2. Try mt5_accounts fallback
                    const { data: mt5Data, error: mt5Error } = await supabase
                        .from('mt5_accounts')
                        .select('email, login')
                        .eq('user_id', uid)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (mt5Data && mt5Data.email && mt5Data.login) {
                        email = mt5Data.email;
                        login = mt5Data.login;
                    }
                }

                if (email && login) {
                    try {
                        const res = await neweraApi.linkAccount(uid, email, login);
                        const updatedCredits = extractAvailableCredits(res) ?? extractAvailableCredits(res?.data) ?? res?.data?.credits_given ?? res?.credits_given;
                        if (res.success && updatedCredits !== undefined && updatedCredits !== null && Number(updatedCredits) > 0) {
                            if (welcomeAwarded && !depositAwarded) {
                                await supabase
                                    .from('newera_credits_sync')
                                    .update({ deposit_credits_awarded: true })
                                    .eq('user_id', uid);
                            }
                            notifyCreditsUpdated(Number(updatedCredits));
                            setShowCreditsModal(false);
                            return; // Successfully linked/synced in background and has credits, do not show modal!
                        }
                    } catch (apiErr) {
                        console.warn("Background auto-link credit sync failed:", apiErr);
                    }
                }
            }
        } catch (e) {
            console.error("Error during auto credit check:", e);
        } finally {
            isCheckingRef.current = false;
        }
        setShowCreditsModal(true);
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
                    if (currentCredits !== undefined && currentCredits !== null) {
                        if (Number(currentCredits) <= 0) {
                            checkAndAutoSyncOrShowModal(uid);
                        }
                    }
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
                            if (currentCredits !== undefined && currentCredits !== null) {
                                if (Number(currentCredits) <= 0) {
                                    checkAndAutoSyncOrShowModal(activeUid);
                                } else {
                                    setShowCreditsModal(false);
                                }
                            }
                        })
                        .catch((err) => {
                            console.warn("Failed to check credits on tab switch:", err);
                        });
                }
            }
        };

        const onCreditsUpdated = (e) => {
            const currentCredits = e?.detail?.available_credits;
            if (currentCredits !== undefined && currentCredits !== null) {
                if (Number(currentCredits) <= 0) {
                    setShowCreditsModal((prevShow) => {
                        if (!prevShow) {
                            const activeUid = getStoredUserId();
                            checkAndAutoSyncOrShowModal(activeUid);
                        }
                        return prevShow;
                    });
                } else {
                    setShowCreditsModal(false);
                }
            }
        };

        window.addEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated);
        document.addEventListener('visibilitychange', handleTabVisibilityChange);
        return () => {
            window.removeEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated);
            document.removeEventListener('visibilitychange', handleTabVisibilityChange);
        };
    }, []);

    return (
        <AuthGuard>
            <ThemeProvider>
                <div className='user-layout'>
                    <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
                        <Sidebar onClose={() => setIsSidebarOpen(false)} />
                    </div>
                    {isSidebarOpen && (
                        <div className='sidebar-overlay' onClick={() => setIsSidebarOpen(false)} />
                    )}
                    <div className='children-wrapper'>
                        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
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
            </ThemeProvider>
        </AuthGuard>
    );
}

export default layout;

