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

const SidebarLogo = "/assets/logo/sidebar-logo.svg";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Trade Snap", href: "/trade-snap", icon: TradeIcon },
  { label: "AI Assistant", href: "/ai-assistant", icon: AssistantIcon },
  { label: "Economic Calendar", href: "/economic-calendar", icon: PricingIcon },
  { label: "Profile", href: "/profile", icon: SettingsIcon },
];

const NavItem = ({ item, pathname }) => {
  const Icon = item.icon;
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={`${styles.menu}${isActive ? ` ${styles.active}` : ""}`}
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

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const doLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
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
            <NavItem key={item.href} item={item} pathname={pathname} />
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
