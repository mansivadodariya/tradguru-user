'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './topbar.module.scss';
import { dashboardApi } from '@/lib/api';

const Topbar = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [credits, setCredits] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            try {
                const stored = localStorage.getItem('user');
                if (!stored) { router.replace('/login'); return; }
                const parsed = JSON.parse(stored);
                setUser(parsed);
                if (parsed?.id) {
                    try {
                        const res = await dashboardApi.getStats(parsed.id);
                        setCredits(res?.data?.available_credits ?? null);
                    } catch (err) {
                        if (!err?.message?.includes('Session expired')) { /* skip */ }
                    }
                }
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        init();
    }, [router]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleUserUpdate = () => {
            try {
                const stored = localStorage.getItem('user');
                if (stored) setUser(JSON.parse(stored));
            } catch { /* ignore */ }
        };
        window.addEventListener('user:updated', handleUserUpdate);
        return () => window.removeEventListener('user:updated', handleUserUpdate);
    }, []);

    const displayName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'User'
        : 'User';

    const initials = user
        ? [user.first_name, user.last_name]
            .filter(Boolean)
            .map((n) => n.charAt(0).toUpperCase())
            .join('') || (user.email ? user.email.charAt(0).toUpperCase() : 'U')
        : 'U';

    const profilePicture = user?.picture || '';

    const doLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        router.push('/login');
    };

    if (loading) {
        return (
            <div className={styles.topbar}>
                <div className={styles.left} />
                <div className={styles.right}>
                    <div className={styles.skeletonCredits} />
                    <div className={styles.skeletonProfile}>
                        <div className={styles.skeletonAvatar} />
                        <div className={styles.skeletonText}>
                            <div className={styles.skeletonLine} />
                            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.topbar}>
                <div className={styles.left} />
                <div className={styles.right}>
                    {credits !== null && (
                        <div className={styles.credits}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none">
                                <circle opacity="0.5" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.5" />
                                <path d="M12 17V17.5V18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M12 6V6.5V7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M15 9.5C15 8.11929 13.6569 7 12 7C10.3431 7 9 8.11929 9 9.5C9 10.8807 10.3431 12 12 12C13.6569 12 15 13.1193 15 14.5C15 15.8807 13.6569 17 12 17C10.3431 17 9 15.8807 9 14.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span>{credits} credits</span>
                        </div>
                    )}
                    <div className={styles.profileSection} ref={dropdownRef}>
                        <div className={styles.profile} onClick={() => setDropdownOpen((prev) => !prev)}>
                            <div className={styles.image}>
                                {profilePicture ? (
                                    <img src={profilePicture} alt={displayName} />
                                ) : (
                                    <div className={styles.avatar}>{initials}</div>
                                )}
                            </div>
                            <div className={styles.content}>
                                <div>
                                    <p>{displayName}</p>
                                    {user?.email && <span>{user.email}</span>}
                                </div>
                            </div>
                        </div>

                        {dropdownOpen && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>
                                    <div className={styles.dropdownAvatar}>
                                        {profilePicture ? (
                                            <img src={profilePicture} alt={displayName} />
                                        ) : (
                                            <div className={styles.avatarSmall}>{initials}</div>
                                        )}
                                    </div>
                                    <div className={styles.dropdownInfo}>
                                        <p>{displayName}</p>
                                        {user?.email && <span>{user.email}</span>}
                                    </div>
                                </div>
                                <div className={styles.dropdownDivider} />
                                <button
                                    className={styles.dropdownItem}
                                    type="button"
                                    onClick={() => { setDropdownOpen(false); router.push('/profile'); }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Profile
                                </button>
                                <div className={styles.dropdownDivider} />
                                <button
                                    className={styles.dropdownItem}
                                    type="button"
                                    onClick={() => { setDropdownOpen(false); setConfirmOpen(true); }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6.67578 5.66C6.90578 2.96 8.29578 1.86 11.3358 1.86H11.4308C14.7858 1.86 16.1258 3.2 16.1258 6.555V11.46C16.1258 14.815 14.7858 16.155 11.4308 16.155H11.3358C8.31578 16.155 6.92578 15.065 6.68578 12.405" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M11.0009 9H2.65088" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4.27422 6.47998L1.75422 8.99998L4.27422 11.52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {confirmOpen && (
                <div className={styles.confirmOverlay} onClick={() => setConfirmOpen(false)}>
                    <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
                        <h3>Log out?</h3>
                        <p>Are you sure you want to log out?</p>
                        <div className={styles.confirmActions}>
                            <button type="button" className={styles.cancelBtn} onClick={() => setConfirmOpen(false)}>Cancel</button>
                            <button type="button" className={styles.logoutBtn} onClick={doLogout}>Log out</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Topbar;
