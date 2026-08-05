'use client'
import React from 'react'
import { useRouter } from 'next/navigation';
import { authNavigate } from '@/lib/authRedirect';
import { motion } from 'framer-motion';
import styles from './tradeSetup.module.scss';
import LineText from '@/components/lineText';
import Button from '@/components/button';
import { useLanguage } from '@/context/LanguageContext';

const ScreenshotIcon = '/assets/icons/Screenshot.svg';
const LineArrowIcon = '/assets/icons/line-arrow.svg';
const ProcessIcon = '/assets/icons/Process.svg';
const ReceiveIcon = '/assets/icons/Receive.svg';
const SnapImage = '/assets/images/snap-img.png';
const RoundImage = '/assets/images/round-vec.svg';
const ArrowIcon = '/assets/icons/arrow.svg';

export default function TradeSetup() {
    const router = useRouter();
    const { t } = useLanguage();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 15, duration: 0.6 }
        },
        hover: {
            y: -8,
            boxShadow: "0 15px 35px 0 rgba(0, 0, 0, 0.08)",
            borderColor: "rgba(11, 86, 219, 0.15)",
            transition: { duration: 0.3 }
        }
    };

    const arrowVariants = {
        hidden: { opacity: 0, scale: 0.6, x: -25 },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: { type: "spring", stiffness: 120, damping: 12, duration: 0.5 }
        },
    };

    const iconVariants = {
        hover: {
            scale: 1.15,
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.4 }
        }
    };

    const counterVariants = {
        hover: {
            scale: 1.08,
            opacity: 0.15,
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className={styles.tradeSetup}>
            <div className='container'>
                <LineText text={t('home.tradeSetupLine', 'How It Works')} />
                <div className={styles.title}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {t('home.tradeSetupTitle', 'Analyze Any Trade setup in 3 simple steps')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        {t('home.tradeSetupSubtitle', 'Upload a chart and let AI uncover the setup behind the price action.')}
                    </motion.p>
                </div>
                <motion.div
                    className={styles.grid}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <motion.div
                        className={styles.items}
                        variants={cardVariants}
                        whileHover="hover"
                    >
                        <div className={styles.icontext}>
                            <motion.img
                                src={ScreenshotIcon}
                                alt='ScreenshotIcon'
                                variants={iconVariants}
                            />
                            <h3>
                                {t('home.stepUploadTitle', 'Upload Screenshot')}
                            </h3>
                        </div>
                        <p>
                            {t('home.stepUploadDesc', 'Drop your chart image from any platform.')}
                        </p>
                        <motion.div
                            className={styles.counter}
                            variants={counterVariants}
                        >
                            <h4>01</h4>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className={styles.line}
                        variants={arrowVariants}
                    >
                        <motion.img
                            src={LineArrowIcon}
                            alt="LineArrowIcon"
                            animate={{
                                x: [0, 8, 0],
                                opacity: [0.6, 1, 0.6]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>

                    <motion.div
                        className={styles.items}
                        variants={cardVariants}
                        whileHover="hover"
                    >
                        <div className={styles.icontext}>
                            <motion.img
                                src={ProcessIcon}
                                alt='ProcessIcon'
                                variants={iconVariants}
                            />
                            <h3>
                                {t('home.stepProcessTitle', 'AI Process the chart')}
                            </h3>
                        </div>
                        <p>
                            {t('home.stepProcessDesc', 'AI Trade scans price action structure and momentum.')}
                        </p>
                        <motion.div
                            className={styles.counter}
                            variants={counterVariants}
                        >
                            <h4>02</h4>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className={styles.line}
                        variants={arrowVariants}
                    >
                        <motion.img
                            src={LineArrowIcon}
                            alt="LineArrowIcon"
                            animate={{
                                x: [0, 8, 0],
                                opacity: [0.6, 1, 0.6]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.4
                            }}
                        />
                    </motion.div>

                    <motion.div
                        className={styles.items}
                        variants={cardVariants}
                        whileHover="hover"
                    >
                        <div className={styles.icontext}>
                            <motion.img
                                src={ReceiveIcon}
                                alt='ReceiveIcon'
                                variants={iconVariants}
                            />
                            <h3>
                                {t('home.stepInsightsTitle', 'Receive Smart Insights')}
                            </h3>
                        </div>
                        <p>
                            {t('home.stepInsightsDesc', 'Get a complete AI generated trading setup instantly.')}
                        </p>
                        <motion.div
                            className={styles.counter}
                            variants={counterVariants}
                        >
                            <h4>03</h4>
                        </motion.div>
                    </motion.div>
                </motion.div>
                <div className={styles.box}>
                    <div className={styles.content}>
                        <LineText text={t('nav.aiTrade', 'AI Trade')} start />
                        <h3>
                            {t('home.turnScreenshotTitle', 'Turn screenshot into trading opportunities')}
                        </h3>
                        <p>
                            {t('home.turnScreenshotDesc', 'Upload a chart and let AI uncover the setup behind the price action.')}
                        </p>
                        <Button icon={ArrowIcon} text={t('home.tryAiTradeNow', 'Try AI Trade Now')} onClick={() => authNavigate(router, '/trade-snap')} />
                    </div>
                    <div className={styles.image}>
                        <img src={SnapImage} alt='SnapImage' />
                    </div>
                    <div className={styles.round}>
                        <img src={RoundImage} alt="RoundImage" />
                    </div>
                </div>
            </div>
        </div>
    )
}
