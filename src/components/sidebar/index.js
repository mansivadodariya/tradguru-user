"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./sidebar.module.scss";
import DashboardIcon from "@/icons/dashboardIcon";
import TradeIcon from "@/icons/tradeIcon";
import AssistantIcon from "@/icons/assistantIcon";
import PricingIcon from "@/icons/pricingIcon";
import SettingsIcon from "@/icons/settingsIcon";
import AiIcon from "@/icons/aiIcon";
import BrokerIcon from "@/icons/brokerIcon";
import { clearAuthSession, getStoredUser, getStoredUserId, hydrateUserFromProfile } from '@/lib/authSession';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';
import { supabase } from '@/lib/supabaseClient';
const UpgradeIcon = '/assets/icons/Upgrade.svg';

const SidebarLogo = "/assets/logo/logo.svg";
const SidebarLogoWhite = "/assets/logo/logoWhite.svg";
const SmallLogo = "/assets/logo/smallLogo.svg";
const LiveAnalysisIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const StrategyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const CreditHistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 8v4l3 3" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);


const getMainNav = (t) => [
  { label: t('nav.dashboard', 'Dashboard'), href: "/dashboard", icon: DashboardIcon },
  { label: t('nav.aiTrade', 'AI Trade'), href: "/trade-snap", icon: TradeIcon },
  { label: t('nav.aiChat', 'AI Chat'), href: "/ai-assistant", icon: AssistantIcon },
  {
    label: t('nav.aiStrategy', 'AI Strategy'),
    href: "/ai-strategy",
    icon: AiIcon,
    subItems: [
      { label: t('nav.liveAnalysis', 'Live Analysis'), href: "/ai-strategy/live", icon: LiveAnalysisIcon },
      { label: t('nav.aiStrategy', 'AI Strategy'), href: "/ai-strategy/strategy", icon: StrategyIcon },
    ]
  },
  { label: t('nav.economicCalendar', 'Economic Calendar'), href: "/economic-calendar", icon: PricingIcon },
  { label: t('nav.plans', 'Subscription Plans'), href: "/plans", icon: PricingIcon },
  { label: t('nav.broker', 'Broker'), href: "/broker", icon: BrokerIcon },
  { label: t('nav.profile', 'Settings'), href: "/profile", icon: SettingsIcon },
];

/** Match current route to nav item (handles trailing slashes and nested paths). */
function isNavItemActive(pathname, href) {
  if (!pathname || !href) return false;
  const current = pathname.split('?')[0].replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';
  return current === target || current.startsWith(`${target}/`);
}

const NavItem = ({ item, pathname, onNavigate, isCollapsed }) => {
  const Icon = item.icon;
  const router = useRouter();
  const isParentActive = isNavItemActive(pathname, item.href);
  const isAnySubActive = item.subItems?.some(sub => isNavItemActive(pathname, sub.href));
  const isActive = isParentActive || isAnySubActive;

  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    setIsOpen(isActive);
  }, [isActive]);

  if (item.subItems) {
    if (isCollapsed) {
      return (
        <div className={`${styles.menuGroup} ${styles.collapsedMenuGroup}`}>
          <div
            className={styles.menu}
            data-active={isActive ? 'true' : undefined}
            onClick={() => {
              if (item.subItems && item.subItems.length > 0) {
                router.push(item.subItems[0].href);
                onNavigate?.();
              }
            }}
          >
            <div className={styles.icon}>
              <Icon />
            </div>
            <span className={styles.tooltip}>{item.label}</span>
            <div className={styles.flyoutMenu}>
              <div className={styles.flyoutHeader}>{item.label}</div>
              <div className={styles.flyoutList}>
                {item.subItems.map(sub => {
                  const isSubActive = isNavItemActive(pathname, sub.href);
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={styles.flyoutLink}
                      data-active={isSubActive ? 'true' : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.();
                      }}
                    >
                      <div className={styles.subMenuIcon}>
                        <SubIcon />
                      </div>
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.menuGroup}>
        <div
          className={styles.menu}
          data-active={isActive ? 'true' : undefined}
          onClick={() => {
            setIsOpen(!isOpen);
            if (item.subItems && item.subItems.length > 0) {
              router.push(item.subItems[0].href);
              onNavigate?.();
            }
          }}
        >
          <div className={styles.icon}>
            <Icon />
          </div>
          <span>{item.label}</span>
        </div>
        {isOpen && (
          <div className={styles.subItemsList}>
            {item.subItems.map(sub => {
              const isSubActive = isNavItemActive(pathname, sub.href);
              const SubIcon = sub.icon;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={styles.subMenuLink}
                  data-active={isSubActive ? 'true' : undefined}
                  onClick={onNavigate}
                >
                  <div className={styles.subMenuIcon}>
                    <SubIcon />
                  </div>
                  <span>{sub.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={styles.menu}
      data-active={isActive ? 'true' : undefined}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
    >
      <div className={styles.icon}>
        <Icon />
      </div>
      {!isCollapsed && <span>{item.label}</span>}
      {isCollapsed && <span className={styles.tooltip}>{item.label}</span>}
    </Link>
  );
};

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

import { motion, AnimatePresence } from 'framer-motion';

const NavSkeleton = ({ count = 6, isCollapsed }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 8px', margin: '8px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '12px'
          }}
        >
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          {!isCollapsed && (
            <div style={{ width: '65%', height: '14px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          )}
        </div>
      ))}
    </div>
  );
};

const Sidebar = ({ onClose, isCollapsed = false, onToggleCollapse }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [visibleTabNames, setVisibleTabNames] = useState(null);
  const [tabsLoading, setTabsLoading] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('visible_tab_names');
        if (cached) {
          setVisibleTabNames(new Set(JSON.parse(cached)));
        }
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    async function loadVisibleTabs() {
      if (!supabase) {
        setTabsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc('get_visible_dashboard_tabs');
        if (!error && Array.isArray(data)) {
          const arr = data.map(t => (t.name || '').toLowerCase());
          const names = new Set(arr);
          setVisibleTabNames(names);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('visible_tab_names', JSON.stringify(arr));
          }
        }
      } catch (e) {
        console.warn('Failed to load visible tabs in sidebar:', e);
      } finally {
        setTabsLoading(false);
      }
    }
    loadVisibleTabs();
  }, []);

  useEffect(() => {
    async function loadUser() {
      const stored = getStoredUser();
      if (stored) setUser(stored);

      const uid = getStoredUserId();
      if (uid && (!stored?.first_name && !stored?.last_name && !stored?.name)) {
        const hydrated = await hydrateUserFromProfile(uid, stored);
        if (hydrated) setUser(hydrated);
      }
    }
    loadUser();

    window.addEventListener('user:updated', loadUser);
    return () => window.removeEventListener('user:updated', loadUser);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user?.name || user?.email || 'User Profile';

  const initials = (() => {
    if (firstName || lastName) {
      return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    }
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase() || 'U';
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  })();

  const handleNavigate = () => {
    onClose?.();
    if (!isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const doLogout = () => {
    clearAuthSession();
    router.replace('/login');
  };

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

  const logoSrc = theme === 'dark' ? SidebarLogoWhite : SidebarLogo;
  const rawNav = getMainNav(t);
  const mainNav = visibleTabNames
    ? rawNav.filter((item) => {
        const tabName = ROUTE_TAB_MAP[item.href] || item.label;
        return visibleTabNames.has(tabName.toLowerCase());
      })
    : [];

  const hasPlansPermission = visibleTabNames ? visibleTabNames.has('subscription plans') : false;

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.logoHeader}>
          {!isCollapsed ? (
            <div className={styles.logo} onClick={() => router.push('/')}>
              <img src={logoSrc} alt="SidebarLogo" />
            </div>
          ) : (
            <div className={styles.logoMark} onClick={() => router.push('/')}>
              <img src={SmallLogo} alt="Trader Master" className={styles.smallLogoImg} />
              <span className={styles.tooltip}>Trader Master</span>
            </div>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? t('sidebar.expand', 'Expand sidebar') : t('sidebar.collapse', 'Collapse sidebar')}
            >
              {language === 'ar'
                ? (isCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />)
                : (isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />)
              }
              <span className={styles.tooltip}>
                {isCollapsed ? t('sidebar.expand', 'Expand sidebar') : t('sidebar.collapse', 'Collapse sidebar')}
              </span>
            </button>
          )}
        </div>
        <div className={styles.sidebarmenu}>
          {tabsLoading && !visibleTabNames ? (
            <NavSkeleton count={6} isCollapsed={isCollapsed} />
          ) : (
            mainNav.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={handleNavigate}
                isCollapsed={isCollapsed}
              />
            ))
          )}
        </div>
        {hasPlansPermission && (
          !isCollapsed ? (
            <div className={styles.sidebarBody}>
              <div className={styles.box}>
                <div className={styles.contentRelative}>
                  <div className={styles.iconText}>
                    <img src={UpgradeIcon} alt='UpgradeIcon' />
                    <h3 {...getBidiProps(t('sidebar.upgradeTitle', 'Upgrade to pro'))}>
                      {t('sidebar.upgradeTitle', 'Upgrade to pro')}
                    </h3>
                  </div>
                  <p {...getBidiProps(t('sidebar.upgradeDesc', 'Unlock advanced analytics more AI insights & unlimited saves.'))}>
                    {t('sidebar.upgradeDesc', 'Unlock advanced analytics more AI insights & unlimited saves.')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigate();
                      router.push('/plans');
                    }}
                  >
                    <span {...getBidiProps(t('sidebar.upgradeBtn', 'Upgrade Now'))}>
                      {t('sidebar.upgradeBtn', 'Upgrade Now')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.sidebarBodyCompact}>
              <button
                type="button"
                className={styles.compactUpgradeBtn}
                onClick={() => {
                  handleNavigate();
                  router.push('/plans');
                }}
              >
                <img src={UpgradeIcon} alt='UpgradeIcon' />
                <span className={styles.tooltip}>
                  {t('sidebar.upgradeTitle', 'Upgrade to pro')}
                </span>
              </button>
            </div>
          )
        )}
        <div className={styles.sidebarFooter} ref={profileRef}>
          <div
            className={`${styles.userProfileCard} ${isCollapsed ? styles.collapsedProfileCard : ''}`}
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            aria-expanded={profileDropdownOpen}
          >
            <div className={styles.avatarBox}>
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={displayName} className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarInitials}>{initials}</div>
              )}
            </div>

            {!isCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
                {user?.email && <span className={styles.userEmail}>{user.email}</span>}
              </div>
            )}

            {!isCollapsed && (
              <div className={styles.chevronBox}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
            )}

            {isCollapsed && (
              <span className={styles.tooltip}>{displayName}</span>
            )}
          </div>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                className={`${styles.profileMenuDropdown} ${isCollapsed ? styles.collapsedMenuDropdown : ''}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div className={styles.dropdownHeader}>
                  <p className={styles.dropdownName}>{displayName}</p>
                  {user?.email && <p className={styles.dropdownEmail}>{user.email}</p>}
                </div>

                <div className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleNavigate();
                    router.push('/profile');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{t('nav.profile', 'Profile')}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.dropdownItem} ${styles.logoutOption}`}
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setConfirmOpen(true);
                  }}
                >
                  <LogoutIcon />
                  <span>{t('nav.logout', 'Log out')}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {confirmOpen && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmOpen(false)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3>{t('topbar.logoutConfirmTitle', 'Log out?')}</h3>
            <p>{t('topbar.logoutConfirmMessage', 'Are you sure you want to log out?')}</p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmOpen(false)}>{t('topbar.cancel', 'Cancel')}</button>
              <button type="button" className={styles.confirmLogoutBtn} onClick={doLogout}>{t('nav.logout', 'Log out')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
