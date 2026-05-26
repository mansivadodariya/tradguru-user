import React from 'react';
import styles from './sidebar.module.scss';
import DashboardIcon from '@/icons/dashboardIcon';
import TradeIcon from '@/icons/tradeIcon';
import AssistantIcon from '@/icons/assistantIcon';
import FileIcon from '@/icons/fileIcon';
import SignalsIcon from '@/icons/signalsIcon';
import TradingIcon from '@/icons/tradingIcon';
import AnalyticsIcon from '@/icons/analyticsIcon';
import PricingIcon from '@/icons/pricingIcon';
import SupportIcon from '@/icons/supportIcon';
import SettingsIcon from '@/icons/settingsIcon';
const SidebarLogo = '/assets/logo/sidebar-logo.svg';
const UpgradeIcon = '/assets/icons/Upgrade.svg';
const Sidebar = () => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <img src={SidebarLogo} alt='SidebarLogo' />
            </div>
            <div className={styles.sidebarmenu}>
                <p>
                    Main
                </p>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <DashboardIcon />
                    </div>
                    <span>
                        Dashboard
                    </span>
                </div>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <TradeIcon />
                    </div>
                    <span>
                        Trade Snap
                    </span>
                </div>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <AssistantIcon />
                    </div>
                    <span>
                        AI Assistant
                    </span>
                </div>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <FileIcon />
                    </div>
                    <span>
                        Market Insights
                    </span>
                </div>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <SignalsIcon />
                    </div>
                    <span>
                        Signals
                    </span>
                </div>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <TradingIcon />
                    </div>
                    <span>
                        Trading Journal
                    </span>
                </div>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <AnalyticsIcon />
                    </div>
                    <span>
                        Analytics
                    </span>
                </div>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <PricingIcon />
                    </div>
                    <span>
                        Pricing
                    </span>
                </div>
                <div className={styles.line}></div>
                <p>
                    Other
                </p>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <SupportIcon />
                    </div>
                    <span>
                        Support
                    </span>
                </div>
                <div className={styles.menu}>
                    <div className={styles.icon}>
                        <SettingsIcon />
                    </div>
                    <span>
                        Settings
                    </span>
                </div>
            </div>
            <div className={styles.sidebarBody}>
                <div className={styles.box}>
                    <div className={styles.contentRelative}>
                        <div className={styles.iconText}>
                            <img src={UpgradeIcon} alt='UpgradeIcon' />
                            <h3>
                                Upgrade to pro
                            </h3>
                        </div>
                        <p>
                            Unlock advanced analytics more AI insigts &
                            unlimited saves.
                        </p>
                        <button>
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
