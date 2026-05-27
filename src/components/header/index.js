import React from 'react'
import Link from 'next/link';
import styles from './header.module.scss';
import Button from '../button';
const Logo = '/assets/logo/logo.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
export default function Header() {
    return (
        <div className={styles.header}>
            <div className='container-xs'>
                <div className={styles.headerAlignment}>
                    <div className={styles.logo}>
                        <Link href="/" aria-label='Home'>
                            <img src={Logo} alt='Logo' />
                        </Link>
                    </div>
                    <div className={styles.menuAlignment}>
                        <Link href="/#home" aria-label='Home'>Home</Link>
                        <Link href="/#trade-snap" aria-label='Trade Snap'>Trade Snap</Link>
                        <Link href="/#fx-guru" aria-label='FX Guru'>FX Guru</Link>
                        <Link href="/#ai-strategy" aria-label='AI Strategy'>AI Strategy</Link>
                        <Link href="/#pricing" aria-label='Pricing'>Pricing</Link>
                        <Link href="/#about" aria-label='About'>About</Link>
                    </div>
                    <div>
                        <Button text="Get Started" icon={ArrowIcon} href="/signup" />
                    </div>
                </div>
            </div>
        </div>
    )
}
