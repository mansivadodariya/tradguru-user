"use client";
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import AuthGuard from '@/components/authGuard';
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import NeweraCreditsModal from '@/components/neweraCreditsModal';
import { CREDITS_UPDATED_EVENT } from '@/lib/credits';
import { getStoredUserId } from '@/lib/authSession';
import { dashboardApi, neweraApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import './layout.scss';

const layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [userId, setUserId] = useState('');

    const checkAndAutoSyncOrShowModal = async (uid) => {
        if (!uid) return;
        try {
            if (supabase) {
                let email = '';
                let login = null;

                // 1. Try mt5_accounts
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
                } else {
                    // 2. Try newera_credits_sync fallback
                    const { data: syncData, error: syncError } = await supabase
                        .from('newera_credits_sync')
                        .select('email, mt5_id')
                        .eq('user_id', uid)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (syncData && syncData.email && syncData.mt5_id) {
                        email = syncData.email;
                        login = syncData.mt5_id;
                    }
                }

                if (email && login) {
                    try {
                        const res = await neweraApi.linkAccount(uid, email, login);
                        if (res.success) {
                            return; // Successfully linked/synced in background, do not show modal!
                        }
                    } catch (apiErr) {
                        console.warn("Background auto-link credit sync failed:", apiErr);
                    }
                }
            }
        } catch (e) {
            console.error("Error during auto credit check:", e);
        }
        setShowCreditsModal(true);
    };

    useEffect(() => {
        const uid = getStoredUserId();
        setUserId(uid);

        if (uid) {
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
        return () => {
            window.removeEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated);
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
                        onSuccess={() => {
                            setShowCreditsModal(false);
                        }}
                    />
                )}
            </ThemeProvider>
        </AuthGuard>
    );
}

export default layout;

