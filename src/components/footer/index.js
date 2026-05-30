'use client'
import React from 'react'
import Link from 'next/link';
import styles from './footer.module.scss';

const FooterLogo = '/assets/logo/logo.svg';

const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <g clip-path="url(#clip0_5885_2914)">
            <path d="M21.4264 8.79752L21.4182 8.78939L13.0278 0.387937C12.9611 0.321633 12.8875 0.262725 12.8081 0.212237L12.5666 0.0804497L12.4018 0.0255211H12.281C12.0958 -0.00850704 11.906 -0.00850704 11.7209 0.0255211H11.4793L11.2926 0.124362C11.1885 0.180884 11.0925 0.251054 11.007 0.333008L2.58365 8.78939C2.01959 9.34897 2.01593 10.2599 2.57551 10.824L2.58365 10.8321C3.15224 11.3746 4.04675 11.3746 4.61539 10.8321L9.63428 5.82417C9.8508 5.61187 10.1985 5.61527 10.4108 5.83184C10.5096 5.93258 10.5658 6.06749 10.5678 6.20857V22.5612C10.5677 23.3558 11.2118 23.9999 12.0064 24C12.8009 24 13.445 23.356 13.4452 22.5614V6.20857C13.4494 5.90535 13.6987 5.66294 14.0019 5.66721C14.143 5.66922 14.2779 5.72538 14.3786 5.82417L19.3756 10.8321C19.9456 11.3816 20.8483 11.3816 21.4183 10.8321C21.9824 10.2725 21.986 9.36158 21.4264 8.79752Z" fill="#0B56DB" />
        </g>
        <defs>
            <clipPath id="clip0_5885_2914">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
    </svg>
);

const PinterestIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 4.22 2.62 7.83 6.36 9.31-.09-.79-.17-2 .03-2.87.19-.79 1.2-5.1 1.2-5.1s-.31-.61-.31-1.52c0-1.42.82-2.48 1.85-2.48.87 0 1.29.65 1.29 1.44 0 .88-.56 2.19-.85 3.41-.24 1.01.5 1.84 1.5 1.84 1.8 0 3.18-1.9 3.18-4.65 0-2.43-1.75-4.13-4.24-4.13-2.89 0-4.59 2.17-4.59 4.41 0 .87.34 1.81.76 2.31.08.1.1.17.07.27-.08.33-.26 1.05-.3 1.2-.05.21-.17.25-.4.15-1.51-.7-2.46-2.91-2.46-4.69 0-3.82 2.78-7.33 8.01-7.33 4.21 0 7.48 3 7.48 7.01 0 4.18-2.64 7.55-6.3 7.55-1.23 0-2.39-.64-2.79-1.41 0 0-.61 2.32-.76 2.89-.28 1.06-1.02 2.39-1.52 3.2C9.07 21.78 10.5 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
);

const DribbbleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm7.95 9.17c-.45-.14-2.73-.83-5.5-.39-.23-.55-.47-1.11-.72-1.66 2.37-1 4.41-1 4.51-1 .96.96 1.58 2.22 1.71 3.66zm-2.07-5c-.15-.05-1.95-.53-4.52.55-.26-.53-.51-1.07-.76-1.6 2.85-.71 4.32-.2 4.41-.17.47.38.83.84 1.12 1.34-1.27-.12-2.58-.12-3.83 0v.02c.24.5.48 1 .71 1.5 2.53-1 4.34-.58 4.49-.55.15.52.23 1.06.24 1.61zM11.66 3.06c.25.5.5 1.02.73 1.54-2.31.63-4.94.63-7.24 0 .34-.69.83-1.28 1.43-1.74 1.39-.77 3.32-.71 5.08.2zm-8.2 4.09c2.37.58 4.9.58 7.15 0-.22-.48-.45-.96-.69-1.44-2.48-1-4.22-.55-4.36-.51-.31.3-.57.64-.78 1 .23.05 1.4.35 3.3.05zm-.4 3.97c.1-.03 2.53-.78 5.17-.18-.32.86-.68 1.75-1.08 2.65-2.75-.8-5.06-.06-5.17-.03.01-.88.19-1.73.53-2.51.55.07 1 .37 1.5.07zm1.18 5.12c.16-.04 2.18-.7 4.88.22-.38.85-.79 1.68-1.25 2.47-2.38-1.22-3.41-2.46-3.46-2.52a8.04 8.04 0 0 1-.17-.17zm5.95 4.67c.43-.72.82-1.48 1.17-2.26 1.95.79 2.72 2.02 2.76 2.08a8.03 8.03 0 0 1-3.93.18z" />
    </svg>
);

export default function Footer() {
    const handleSubscribe = (e) => {
        e.preventDefault();
        // logic for subscription
    };

    return (
        <footer className={styles.footer}>
            <div className='container-xl'>
                <div className={styles.topSection}>
                    {/* Brand/Logo column */}
                    <div className={styles.brandCol}>
                        <a href="#" className={styles.logo}>
                            <img src={FooterLogo} alt="Trade Guru Logo" />
                        </a>
                        <p>
                            AI-powered Forex intelligence for serious traders. Chart reading,
                            trade analysis, and strategy generation — built around MT5 and the
                            Newera brokerage stack.
                        </p>
                        <form className={styles.newsletter} onSubmit={handleSubscribe}>
                            <input
                                type="email"
                                placeholder="Your@gmail.com"
                                required
                            />
                            <button type="submit" className={styles.submitBtn} aria-label="Subscribe">
                                <ArrowUpIcon />
                            </button>
                        </form>
                    </div>

                    <div className={styles.linkcol}>
                        <div className={styles.linkCol}>
                            <h4>Product</h4>
                            <ul>
                                <li><Link href="/tradesnap">Trade Snap</Link></li>
                                <li><Link href="/ai-chat">FX Guru</Link></li>
                                <li><Link href="/ai-chat">AI Strategy</Link></li>
                                <li><Link href="/login">Pricing</Link></li>
                            </ul>
                        </div>

                        <div className={styles.linkCol}>
                            <h4>Company</h4>
                            <ul>
                                <li><Link href="/#how-it-works">How It Works</Link></li>
                                <li><Link href="/#faq">FAQ</Link></li>
                                <li><Link href="/#about">Contact</Link></li>
                            </ul>
                        </div>

                        <div className={styles.linkCol}>
                            <h4>Legal</h4>
                            <ul>
                                <li><Link href="/privacy-policy">Privacy</Link></li>
                                <li><Link href="/terms-and-conditions">Terms</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>



                <div className={styles.bottomSection}>
                    <div className={styles.warningBlock}>
                        <h5>@2026 FX Guru. All rights reserved.</h5>
                        <p>
                            Risk warning: Forex trading carries substantial risk. FX Guru provides analytical
                            tools and does not handle deposits or withdrawals. All funds are managed by Newera.
                        </p>
                    </div>

                    <div className={styles.socialLinks}>
                        <a href="#" className={styles.socialIcon} aria-label="Facebook">
                            <FacebookIcon />
                        </a>
                        <a href="#" className={styles.socialIcon} aria-label="Pinterest">
                            <PinterestIcon />
                        </a>
                        <a href="#" className={styles.socialIcon} aria-label="Instagram">
                            <InstagramIcon />
                        </a>
                        <a href="#" className={styles.socialIcon} aria-label="Website">
                            <DribbbleIcon />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
