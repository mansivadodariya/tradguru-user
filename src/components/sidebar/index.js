"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./sidebar.module.scss";
import DashboardIcon from "@/icons/dashboardIcon";
import TradeIcon from "@/icons/tradeIcon";
import AssistantIcon from "@/icons/assistantIcon";
import FileIcon from "@/icons/fileIcon";
import SignalsIcon from "@/icons/signalsIcon";
import TradingIcon from "@/icons/tradingIcon";
import AnalyticsIcon from "@/icons/analyticsIcon";
import PricingIcon from "@/icons/pricingIcon";
import SupportIcon from "@/icons/supportIcon";
import SettingsIcon from "@/icons/settingsIcon";

const SidebarLogo = "/assets/logo/sidebar-logo.svg";
const UpgradeIcon = "/assets/icons/Upgrade.svg";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Trade Snap", href: "/trade-snap", icon: TradeIcon },
  { label: "AI Assistant", href: "/ai-assistant", icon: AssistantIcon },
  { label: "Economic Calendar", href: "/economic-calendar", icon: PricingIcon },
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

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src={SidebarLogo} alt="SidebarLogo" />
      </div>
      <div className={styles.sidebarmenu}>
        {mainNav.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
