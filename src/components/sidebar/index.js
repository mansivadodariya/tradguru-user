"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./sidebar.module.scss";
import DashboardIcon from "@/icons/dashboardIcon";
import TradeIcon from "@/icons/tradeIcon";
import AssistantIcon from "@/icons/assistantIcon";
import PricingIcon from "@/icons/pricingIcon";
import SettingsIcon from "@/icons/settingsIcon";
import AiIcon from "@/icons/aiIcon";
import { clearAuthSession } from '@/lib/authSession';
import { useTheme } from '@/context/ThemeContext';

const SidebarLogo = "/assets/logo/logo.svg";
const SidebarLogoWhite = "/assets/logo/logoWhite.svg";
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

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "AI Trade", href: "/trade-snap", icon: TradeIcon },
  { label: "AI Chat", href: "/ai-assistant", icon: AssistantIcon },
  { 
    label: "AI Strategy", 
    href: "/ai-strategy", 
    icon: AiIcon,
    subItems: [
      { label: "AI Strategy", href: "/ai-strategy/strategy", icon: StrategyIcon },
      { label: "Live Analysis", href: "/ai-strategy/live", icon: LiveAnalysisIcon },
    ]
  },
  { label: "Economic Calendar", href: "/economic-calendar", icon: PricingIcon },
  { label: "Credit History", href: "/credit-history", icon: CreditHistoryIcon },
  { label: "Profile", href: "/profile", icon: SettingsIcon },
];

/** Match current route to nav item (handles trailing slashes and nested paths). */
function isNavItemActive(pathname, href) {
  if (!pathname || !href) return false;
  const current = pathname.split('?')[0].replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';
  return current === target || current.startsWith(`${target}/`);
}

const NavItem = ({ item, pathname, onNavigate }) => {
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
      <span>{item.label}</span>
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

const Sidebar = ({ onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleNavigate = () => {
    onClose?.();
  };

  const doLogout = () => {
    clearAuthSession();
    router.replace('/login');
  };

  const logoSrc = theme === 'dark' ? SidebarLogoWhite : SidebarLogo;

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logo} onClick={() => router.push('/')}>
          <img src={logoSrc} alt="SidebarLogo" />
        </div>
        <div className={styles.sidebarmenu}>
          {mainNav.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={() => setConfirmOpen(true)} type="button">
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {confirmOpen && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmOpen(false)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3>Log out?</h3>
            <p>Are you sure you want to log out?</p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button type="button" className={styles.confirmLogoutBtn} onClick={doLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
