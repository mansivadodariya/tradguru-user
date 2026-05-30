'use client'
import React, { useState } from 'react'
import Link from 'next/link';
import styles from './header.module.scss';
import Button from '../button';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Logo = '/assets/logo/logo.svg';
const ArrowIcon = '/assets/icons/arrow.svg';

export default function Header() {
    const router = useRouter()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                            <Link href="/" aria-label='Home'>Home</Link>
                            <Link href="/tradesnap" aria-label='AI Trade'>AI Trade</Link>
                            <Link href="/ai-chat" aria-label='AI Chat'>AI Chat</Link>
                            <Link href="/ai-chat" aria-label='AI Strategy'>AI Strategy</Link>
                            <Link href="/login" aria-label='Education'>Education</Link>
                            <Link href="/login" aria-label='Funded Master'>Funded Master</Link>
                        </div>
                        <div className={styles.buttonHide}>
                            <Button text="Get Started" icon={ArrowIcon} onClick={() => router.push("/login")} />
                        </div>
                        <div className={styles.mobilemenu} onClick={() => setIsMobileMenuOpen(true)} style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z"></path>
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
                            <Link href="/" aria-label='Home' onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                            <Link href="/tradesnap" aria-label='AI Trade' onClick={() => setIsMobileMenuOpen(false)}>AI Trade</Link>
                            <Link href="/ai-chat" aria-label='AI Chat' onClick={() => setIsMobileMenuOpen(false)}>AI Chat</Link>
                            <Link href="/ai-chat" aria-label='AI Strategy' onClick={() => setIsMobileMenuOpen(false)}>AI Strategy</Link>
                            <Link href="/login" aria-label='Education' onClick={() => setIsMobileMenuOpen(false)}>Education</Link>
                            <Link href="/login" aria-label='Funded Master' onClick={() => setIsMobileMenuOpen(false)}>Funded Master</Link>
                        </div>
                        <div className={styles.headerFooter}>
                            <Button text="Get Started" icon={ArrowIcon} onClick={() => { router.push("/login"); setIsMobileMenuOpen(false); }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
