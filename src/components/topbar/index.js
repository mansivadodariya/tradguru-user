import React from 'react';
import styles from './topbar.module.scss';
import CommonSearch from '../commonSearch';
import BellIcon from '@/icons/bellIcon';
import DownIcon from '@/icons/downIcon';
const ProfileImage = '/assets/images/profile.png'
const Topbar = () => {
    return (
        <div className={styles.topbar}>
            <div className={styles.left}>
                <CommonSearch />
            </div>
            <div className={styles.right}>
                <div className={styles.bell}>
                    <BellIcon />
                </div>
                <div className={styles.line}></div>
                <div className={styles.profile}>
                    <div className={styles.image}>
                        <img src={ProfileImage} alt='ProfileImage' />
                    </div>
                    <div className={styles.content}>
                        <div>
                            <p>
                                Brooklyn Simmons
                            </p>
                            <span>
                                Welcome back!
                            </span>
                        </div>
                        <div className={styles.down}>
                            <DownIcon />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Topbar;
