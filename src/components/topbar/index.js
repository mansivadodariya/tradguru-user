'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './topbar.module.scss';
import { dashboardApi } from '@/lib/api';
import { getStoredUser, getStoredUserId, clearAuthSession, hydrateUserFromProfile } from '@/lib/authSession';
import { CREDITS_UPDATED_EVENT } from '@/lib/credits';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/languageToggle';

const Topbar = ({ onMenuClick }) => {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [credits, setCredits] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchCredits = async (userId) => {
        if (!userId) return;
        try {
            const res = await dashboardApi.getStats(userId);
            setCredits(res?.data?.available_credits ?? null);
        } catch (err) {
            if (!err?.message?.includes('Session expired')) { /* skip */ }
        }
    };



    useEffect(() => {
        const init = async () => {
            try {
                const parsed = getStoredUser();
                const userId = getStoredUserId();
                if (!parsed && !userId) {
                    router.replace('/login');
                    return;
                }
                const resolvedUser = await hydrateUserFromProfile(userId, parsed || { id: userId, user_id: userId });
                setUser(resolvedUser);
                await fetchCredits(userId);
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        init();
        window.addEventListener('user:updated', init);
        return () => window.removeEventListener('user:updated', init);
    }, [router]);

    useEffect(() => {
        const onCreditsUpdated = (e) => {
            const next = e?.detail?.available_credits;
            if (next !== undefined && next !== null) {
                setCredits(next);
            }
        };
        window.addEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated);
        return () => window.removeEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.name || user.email || 'User'
        : 'User';

    const initials = user
        ? [user.first_name, user.last_name]
            .filter(Boolean)
            .map((n) => n.charAt(0).toUpperCase())
            .join('') || (user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U')
        : 'U';

    const profilePicture = user?.picture || '';

    const doLogout = () => {
        clearAuthSession();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className={styles.topbar}>
                <div className={styles.left}>
                    <button className={styles.menuBtn} onClick={onMenuClick}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className={styles.right}>
                    <div className={styles.skeletonCredits} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.topbar}>
                <div className={styles.left}>
                    <button className={styles.menuBtn} onClick={onMenuClick}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className={styles.right}>
                    <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle Theme" type="button">
                        {theme === 'light' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                            </svg>
                        )}
                    </button>
                    <LanguageToggle />
                    {credits !== null && (
                        <div className={styles.credits}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none">
                                <circle opacity="0.5" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.5" />
                                <path d="M12 17V17.5V18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M12 6V6.5V7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M15 9.5C15 8.11929 13.6569 7 12 7C10.3431 7 9 8.11929 9 9.5C9 10.8807 10.3431 12 12 12C13.6569 12 15 13.1193 15 14.5C15 15.8807 13.6569 17 12 17C10.3431 17 9 15.8807 9 14.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span>{credits} {t('topbar.credits', 'credits')}</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Topbar;
