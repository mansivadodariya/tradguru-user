import React from 'react'
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
                        <img src={Logo} alt='Logo' />
                    </div>
                    <div className={styles.menuAlignment}>
                        <a aria-label='Home'>Home</a>
                        <a aria-label='Trade Snap'>Trade Snap</a>
                        <a aria-label='FX Guru'>FX Guru</a>
                        <a aria-label='AI Strategy'>AI Strategy</a>
                        <a aria-label='Pricing'>Pricing</a>
                        <a aria-label='About'>About</a>
                    </div>
                    <div>
                        <Button text="Get Started" icon={ArrowIcon} />
                    </div>
                </div>
            </div>
        </div>
    )
}
