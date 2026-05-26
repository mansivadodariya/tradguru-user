import React from 'react';
import styles from './tradeSnap.module.scss';
import Button from '@/components/button';
const UploadIcon = '/assets/icons/upload.svg';
const CameraIcon = '/assets/icons/camera.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const PoweredIcon = '/assets/icons/Powered.svg';

const TradeSnap = () => {
    return (
        <div className={styles.tradeSnap}>
            <div className={styles.title}>
                <h2>
                    Trade Snap
                </h2>
                <p>
                    Drop a chart screenshot AI returns entry AL, TP, and confidence.
                </p>
            </div>
            <div className={styles.upload}>
                <div className={styles.iconCenter}>
                    <img src={UploadIcon} alt='UploadIcon' />
                </div>
                <div className={styles.textstyle}>
                    <h2>
                        Drop Your Chart Here
                    </h2>
                    <p>
                        PNG, JPG up to 10MB. We support trading view, MT4/5, binance and any
                        chart screenshot.
                    </p>
                    <div className={styles.centerAlignment}>
                        <Button text="Browse FIle" icon={CameraIcon} />
                        <Button text="Paste Screenshot" light icon={ArrowIcon} />
                        <Button text="Import URL" light icon={ArrowIcon} />
                    </div>
                </div>
            </div>
            <div className={styles.grid}>
                <div className={styles.items}>
                    <div className={styles.icontext}>
                        <img src={PoweredIcon} alt='PoweredIcon' />
                        <h3>
                            AI Powered
                        </h3>
                    </div>
                    <div className={styles.bottom}>
                        <p>
                            GPT vision detects patterns instantly
                        </p>
                        <button>
                            18% faster response time
                        </button>
                    </div>
                </div>
                <div className={styles.items}>
                    <div className={styles.icontext}>
                        <img src={PoweredIcon} alt='PoweredIcon' />
                        <h3>
                            AI Powered
                        </h3>
                    </div>
                    <div className={styles.bottom}>
                        <p>
                            GPT vision detects patterns instantly
                        </p>
                        <button>
                            18% faster response time
                        </button>
                    </div>
                </div>
                <div className={styles.items}>
                    <div className={styles.icontext}>
                        <img src={PoweredIcon} alt='PoweredIcon' />
                        <h3>
                            AI Powered
                        </h3>
                    </div>
                    <div className={styles.bottom}>
                        <p>
                            GPT vision detects patterns instantly
                        </p>
                        <button>
                            18% faster response time
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TradeSnap;
