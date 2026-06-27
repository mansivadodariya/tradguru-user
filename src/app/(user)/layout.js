"use client";
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import AuthGuard from '@/components/authGuard';
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import NeweraCreditsModal from '@/components/neweraCreditsModal';
import { CREDITS_UPDATED_EVENT } from '@/lib/credits';
import { getStoredUserId } from '@/lib/authSession';
import { dashboardApi } from '@/lib/api';
import './layout.scss';

const layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [userId, setUserId] = useState('');

    useEffect(() => {
        const uid = getStoredUserId();
        setUserId(uid);

        if (uid) {
            dashboardApi.getStats(uid)
                .then((res) => {
                    const currentCredits = res?.data?.available_credits;
                    if (currentCredits !== undefined && currentCredits !== null) {
                        if (Number(currentCredits) <= 0) {
                            setShowCreditsModal(true);
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
                    setShowCreditsModal(true);
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

