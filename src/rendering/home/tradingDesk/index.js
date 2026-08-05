'use client'
import React from 'react'
import { motion } from 'framer-motion';
import styles from './tradingDesk.module.scss';
import LineText from '@/components/lineText';
import { useLanguage } from '@/context/LanguageContext';

const MessageIcon = '/assets/icons/message.svg';
const TechnicalIcon = '/assets/icons/Technical.svg';
const StructuredIcon = '/assets/icons/Structured.svg';
const BuiltIcon = '/assets/icons/Built.svg';
const DeskImage = '/assets/images/desk.png';

export default function TradingDesk() {
    const { t } = useLanguage();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const boxVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: { 
            opacity: 1, 
            x: 0, 
            transition: { duration: 0.5, ease: "easeOut" } 
        },
        hover: {
            x: 10,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    const iconVariants = {
        hover: {
            scale: 1.15,
            rotate: 5,
            transition: { type: "spring", stiffness: 300 }
        }
    };

    return (
        <div className={styles.tradingDesk}>
            <div className='container'>
                <div className={styles.box}>
                    <div className={styles.grid}>
                        <div className={styles.items}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <LineText text={t('home.tradingDeskLine', 'Try the prompt')} start />
                            </motion.div>
                            <div className={styles.content}>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                >
                                    {t('home.tradingDeskTitle', 'A trading desk that talks back')}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    {t('home.tradingDeskSubtitle', 'A glimpse of how a typical Trader Master conversation flows. Specific, structured, and always tied to risk.')}
                                </motion.p>
                            </div>
                            <motion.div 
                                className={styles.allBoxAlignment}
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                            >
                                <motion.div 
                                    className={styles.boxDesign}
                                    variants={boxVariants}
                                    whileHover="hover"
                                    style={{ padding: '10px' }}
                                >
                                    <motion.img 
                                        src={MessageIcon} 
                                        alt="MessageIcon" 
                                        variants={iconVariants}
                                    />
                                    <div>
                                        <h3>
                                            {t('home.deskBox1Title', 'Real time market answers')}
                                        </h3>
                                        <p>
                                            {t('home.deskBox1Desc', 'Get instant answer about any currency pair, asset, or market condition.')}
                                        </p>
                                    </div>
                                </motion.div>
                                
                                <motion.div 
                                    className={styles.boxDesign}
                                    variants={boxVariants}
                                    whileHover="hover"
                                    style={{ padding: '10px' }}
                                >
                                    <motion.img 
                                        src={TechnicalIcon} 
                                        alt="TechnicalIcon" 
                                        variants={iconVariants}
                                    />
                                    <div>
                                        <h3>
                                            {t('home.deskBox2Title', 'Technical analysis made easy')}
                                        </h3>
                                        <p>
                                            {t('home.deskBox2Desc', 'Ask for trend, support & resistance, patterns, indicators, and more instantly.')}
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    className={styles.boxDesign}
                                    variants={boxVariants}
                                    whileHover="hover"
                                    style={{ padding: '10px' }}
                                >
                                    <motion.img 
                                        src={StructuredIcon} 
                                        alt="StructuredIcon" 
                                        variants={iconVariants}
                                    />
                                    <div>
                                        <h3>
                                            {t('home.deskBox3Title', 'Structured & reliable insights')}
                                        </h3>
                                        <p>
                                            {t('home.deskBox3Desc', 'The Trader Master provides clear, well structured analysis backed by data and logic.')}
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    className={styles.boxDesign}
                                    variants={boxVariants}
                                    whileHover="hover"
                                    style={{ padding: '10px' }}
                                >
                                    <motion.img 
                                        src={BuiltIcon} 
                                        alt="BuiltIcon" 
                                        variants={iconVariants}
                                    />
                                    <div>
                                        <h3>
                                            {t('home.deskBox4Title', 'Built for traders')}
                                        </h3>
                                        <p>
                                            {t('home.deskBox4Desc', 'whether you’re a beginner or pro, The Trader Master helps you trade smarter with confidence.')}
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                        <div className={styles.items}>
                            <motion.div 
                                className={styles.image}
                                initial={{ opacity: 0, scale: 0.9, x: 40 }}
                                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <img src={DeskImage} alt="DeskImage" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
