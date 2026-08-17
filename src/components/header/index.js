'use client'
import React, { useState } from 'react'
import Link from 'next/link';
import styles from './header.module.scss';
import Button from '../button';
import LanguageToggle from '../languageToggle';
import { useRouter, usePathname } from 'next/navigation';
import { authNavigate, getAuthHref } from '@/lib/authRedirect';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

const Logo = '/assets/logo/logo.svg';
const ArrowIcon = '/assets/icons/arrow.svg';

export default function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const { t } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navClass = (href) =>
        pathname === href || (href !== '/' && pathname?.startsWith(href))
            ? `${styles.navLink} ${styles.active}`
            : styles.navLink;

    return (
        <>
            <div className={styles.header}>
                <div className='container-xs'>
                    <div className={styles.headerAlignment}>
                        <div className={styles.logo}>
                            <Link href="/" aria-label='Home'>
                                <img src={Logo} alt='Logo' />
                            </Link>
                        </div>
                        <div className={styles.menuAlignment}>
                            <Link href="/" aria-label='Home' className={navClass('/')}>{t('nav.home', 'Home')}</Link>
                            <Link href="/tradesnap" aria-label='AI Trade' className={navClass('/tradesnap')}>{t('nav.aiTrade', 'AI Trade')}</Link>
                            <Link href="/ai-chat" aria-label='AI Chat' className={navClass('/ai-chat')}>{t('nav.aiChat', 'AI Chat')}</Link>
                            <Link href="/ai-strategy" aria-label='AI Strategy' className={navClass('/ai-strategy')}>{t('nav.aiStrategy', 'AI Strategy')}</Link>
                            <Link
                                href="https://www.edufins.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Edufins"
                                className={styles.navLink}
                            >
                                {t('nav.edufins', 'Edufins')}
                            </Link>
                            <Link
                                href="https://fundedmaster.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Funded Master"
                                className={styles.navLink}
                            >
                                {t('nav.fundedMaster', 'Funded Master')}
                            </Link>
                        </div>
                        <div className={styles.buttonHide}>
                            <LanguageToggle light className={styles.headerLangToggle} />
                            <Button text={t('nav.getStarted', 'Get Started')} icon={ArrowIcon} onClick={() => authNavigate(router, '/dashboard')} />
                        </div>
                        <div className={styles.mobilemenu} onClick={() => setIsMobileMenuOpen(true)} style={{ cursor: 'pointer' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6H20M4 12H20M4 18H20" stroke="#0B56DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className={styles.mobileHeader}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    >
                        <div className={styles.headerAlignment}>
                            <div className={styles.logo}>
                                <Link href="/" aria-label='Home' onClick={() => setIsMobileMenuOpen(false)}>
                                    <img src={Logo} alt='Logo' />
                                </Link>
                            </div>
                            <svg onClick={() => setIsMobileMenuOpen(false)} style={{ cursor: 'pointer' }} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="#1F1E2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        </div>
                        <div className={styles.body}>
                            <Link href="/" aria-label='Home' onClick={() => setIsMobileMenuOpen(false)}>{t('nav.home', 'Home')}</Link>
                            <Link href={getAuthHref('/trade-snap')} aria-label='AI Trade' onClick={() => setIsMobileMenuOpen(false)}>{t('nav.aiTrade', 'AI Trade')}</Link>
                            <Link href={getAuthHref('/ai-assistant')} aria-label='AI Chat' onClick={() => setIsMobileMenuOpen(false)}>{t('nav.aiChat', 'AI Chat')}</Link>
                            <Link href="/ai-strategy" aria-label='AI Strategy' onClick={() => setIsMobileMenuOpen(false)}>{t('nav.aiStrategy', 'AI Strategy')}</Link>
                            <Link
                                href="https://www.edufins.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Edufins"
                                className={styles.navLink}
                            >
                                {t('nav.edufins', 'Edufins')}
                            </Link>
                            <Link
                                href="https://fundedmaster.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Funded Master"
                                className={styles.navLink}
                            >
                                {t('nav.fundedMaster', 'Funded Master')}
                            </Link>
                            <div style={{ marginTop: '12px' }}>
                                <LanguageToggle light />
                            </div>
                        </div>
                        <div className={styles.headerFooter}>
                            <Button text={t('nav.getStarted', 'Get Started')} icon={ArrowIcon} onClick={() => { authNavigate(router, '/dashboard'); setIsMobileMenuOpen(false); }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
