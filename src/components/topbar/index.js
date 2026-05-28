'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './topbar.module.scss';
import CommonSearch from '../commonSearch';
import BellIcon from '@/icons/bellIcon';
import DownIcon from '@/icons/downIcon';

const DefaultProfileImage = '/assets/images/profile.png';

const Topbar = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                setUser(JSON.parse(stored));
            }
        } catch {
            // ignore parse errors
        }
    }, []);

    // Close dropdown when clicking outside
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
        ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'User'
        : 'User';

    const initials = user
        ? [user.first_name, user.last_name]
            .filter(Boolean)
            .map((n) => n.charAt(0).toUpperCase())
            .join('') || (user.email ? user.email.charAt(0).toUpperCase() : 'U')
        : 'U';

    const profilePicture = user?.picture || '';

    const handleLogout = () => {
        // Clear all auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        // Remove auth cookie
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        // Redirect to login
        router.push('/login');
    };

    return (
        <div className={styles.topbar}>
            <div className={styles.left}>
            </div>
            <div className={styles.right}>
                <div className={styles.profileSection} ref={dropdownRef}>
                    <div
                        className={styles.profile}
                        onClick={() => setDropdownOpen((prev) => !prev)}
                    >
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
                                <span>Welcome back!</span>
                            </div>
                            <div className={`${styles.down} ${dropdownOpen ? styles.downRotated : ''}`}>
                                <DownIcon />
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
                            <div className={styles.dropdownDivider}></div>
                            <button
                                className={styles.dropdownItem}
                                onClick={handleLogout}
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
    );
};

export default Topbar;
