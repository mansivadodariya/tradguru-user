"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./sidebar.module.scss";
import DashboardIcon from "@/icons/dashboardIcon";
import TradeIcon from "@/icons/tradeIcon";
import AssistantIcon from "@/icons/assistantIcon";
import PricingIcon from "@/icons/pricingIcon";
import SettingsIcon from "@/icons/settingsIcon";
import { clearAuthSession } from '@/lib/authSession';

const SidebarLogo = "/assets/logo/logo.svg";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "AI Trade", href: "/trade-snap", icon: TradeIcon },
  { label: "AI Chat", href: "/ai-assistant", icon: AssistantIcon },
  { label: "Economic Calendar", href: "/economic-calendar", icon: PricingIcon },
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
  const isActive = isNavItemActive(pathname, item.href);

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

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleNavigate = () => {
    onClose?.();
  };

  const doLogout = () => {
    clearAuthSession();
    router.replace('/login');
  };

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logo} onClick={() => router.push('/')}>
          <img src={SidebarLogo} alt="SidebarLogo" />
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
