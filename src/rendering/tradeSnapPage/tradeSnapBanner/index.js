"use client";
import React from 'react'
import { motion } from 'framer-motion';
import styles from './tradeSnapBanner.module.scss';
import LineText from '@/components/lineText';
import Button from '@/components/button';
import AiIcon from '@/icons/aiIcon';
import WinIcon from '@/icons/winIcon';
import StructureIcon from '@/icons/structureIcon';
import { useRouter } from 'next/navigation';
import { authNavigate } from '@/lib/authRedirect';
import { useLanguage } from '@/context/LanguageContext';

const UploadIcon = '/assets/icons/upload-xs.svg';
const PlayIcon = '/assets/icons/play.svg';
const SnapImage = '/assets/images/snap.png';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 18
        }
    }
};

const imageVariants = {
    hidden: { opacity: 0, x: 40, scale: 0.95, filter: "blur(12px)" },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 90,
            damping: 20,
            delay: 0.3
        }
    }
};

export default function TradeSnapBanner() {
    const router = useRouter();
    const { t } = useLanguage();

    return (
        <div className={styles.tradeSnapBanner}>
            <div className={styles.widthFull}>
                <div className='container-xs3'>
                    <div className={styles.grid}>
                        <motion.div
                            className={styles.items}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={itemVariants}>
                                <LineText text={t('nav.aiTrade', 'AI Trade')} start />
                            </motion.div>
                            <motion.div className={styles.title} variants={itemVariants}>
                                <h1>
                                    {t('tradeSnap.title', 'Snap a chart. Read the trade.')}
                                </h1>
                                <p>
                                    {t('tradeSnap.subtitle', 'Drag any chart screenshot into AI Trade and let Trader Master identify structure, mark levels, and grade the setup against your risk profile.')}
                                </p>
                            </motion.div>
                            <motion.div className={styles.buttonAlignment} variants={itemVariants}>
                                <Button text={t('tradeSnap.analyzeBtn', 'Upload Chart')} icon={UploadIcon} onClick={() => authNavigate(router, '/trade-snap')} />
                                <Button outline text={t('common.learnMore', 'View Demo')} icon={PlayIcon} onClick={() => authNavigate(router, '/trade-snap')} />
                            </motion.div>
                            <motion.div className={styles.tagAlignment} variants={itemVariants}>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2, backgroundColor: "rgba(11, 86, 219, 0.08)" }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                    <AiIcon />
                                    {t('tradeSnap.aiAnalysisTag', 'AI Powered Analysis')}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2, backgroundColor: "rgba(11, 86, 219, 0.08)" }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                    <WinIcon />
                                    {t('tradeSnap.riskTag', 'Smart Risk Detection')}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2, backgroundColor: "rgba(11, 86, 219, 0.08)" }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                    <StructureIcon />
                                    {t('tradeSnap.structureTag', 'Structure & Liquidity')}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                        <motion.div
                            className={styles.items}
                            variants={imageVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div
                                className={styles.image}
                                animate={{ y: [0, -12, 0] }}
                                transition={{
                                    y: {
                                        duration: 4,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        ease: "easeInOut"
                                    }
                                }}
                            >
                                <img src={SnapImage} alt='SnapImage' />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

