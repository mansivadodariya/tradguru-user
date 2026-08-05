'use client'
import React from 'react'
import { motion } from 'framer-motion';
import styles from './howitWorks.module.scss';
import LineText from '@/components/lineText';
import { useLanguage } from '@/context/LanguageContext';

const Step1 = '/assets/images/step1.png';
const Step2 = '/assets/images/step2.png';
const Step3 = '/assets/images/step3.png';
const Step4 = '/assets/images/step4.png';
const IconOne = '/assets/icons/IconOne.svg';

export default function HowitWorks() {
    const { t } = useLanguage();

    const stepsData = [
        {
            id: 1,
            number: '01',
            title: t('home.step1Title', 'Create your account'),
            description: t('home.step1Desc', 'Sign up on Trader Master using your email address to access your trading dashboard instantly.'),
            image: Step1,
            icon: IconOne
        },
        {
            id: 2,
            number: '02',
            title: t('home.step2Title', 'Link Newera account'),
            description: t('home.step2Desc', 'Connect your Newera trading account by entering your registered Newera email address to claim your credits.'),
            image: Step2,
            icon: IconOne
        },
        {
            id: 3,
            number: '03',
            title: t('home.step3Title', 'Ask the AI'),
            description: t('home.step3Desc', 'Analyze charts with AI Trade, consult the AI Chat for market analysis, or build strategies with AI Strategy.'),
            image: Step3,
            icon: IconOne
        },
        {
            id: 4,
            number: '04',
            title: t('home.step4Title', 'Trade & replenish'),
            description: t('home.step4Desc', 'Every completed trade cycle on your linked Newera account automatically replenishes your credits for uninterrupted insights.'),
            image: Step4,
            icon: IconOne
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.25,
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20,
                duration: 0.6
            }
        },
        hover: {
            y: -6,
            boxShadow: "0 12px 30px 0 rgba(11, 86, 219, 0.08)",
            borderColor: "rgba(11, 86, 219, 0.15)",
            transition: { duration: 0.3 }
        }
    };

    const dotVariants = {
        hidden: { scale: 0 },
        visible: { scale: 1, transition: { type: "spring", stiffness: 200, delay: 0.2 } },
        hover: {
            scale: 1.25,
            transition: { duration: 0.2 }
        }
    };

    const imageVariants = {
        hover: {
            scale: 1.04,
            y: -5,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    const iconCircleVariants = {
        hover: {
            scale: 1.12,
            rotate: [0, -10, 10, -10, 0],
            backgroundColor: "#E2EBFC",
            transition: { duration: 0.5 }
        }
    };

    return (
        <div className={styles.howitWorks}>
            <div className='container-xl'>
                <LineText text={t('home.howItWorksLine', 'How It Works')} />
                <div className={styles.title}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {t('home.howItWorksTitle', 'From Signup to AI insight in four steps')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {t('home.howItWorksSubtitle', 'No subscription, no card upfront. your trading activity is what powers your AI access.')}
                    </motion.p>
                </div>

                <motion.div
                    className={styles.allStepAlignment}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    <div className={styles.timelineLine}></div>

                    {stepsData.map((step, index) => {
                        const isEven = index % 2 === 1;
                        return (
                            <motion.div
                                key={step.id}
                                className={styles.stepCard}
                                variants={cardVariants}
                                whileHover="hover"
                            >
                                <div className={styles.stepLeft}>
                                    <span className={styles.stepNumber}>{step.number}</span>
                                    <div className={styles.stepDotContainer}>
                                        <motion.div
                                            className={styles.pulseRing}
                                            animate={{
                                                scale: [1, 1.7, 1],
                                                opacity: [0.6, 0, 0.6]
                                            }}
                                            transition={{
                                                duration: 2.2,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: index * 0.4
                                            }}
                                        />
                                        <motion.div
                                            className={styles.stepDot}
                                            variants={dotVariants}
                                        />
                                    </div>
                                </div>

                                <div className={`${styles.stepContent} ${isEven ? styles.reverse : ''}`}>
                                    <div className={styles.stepImageWrapper}>
                                        <motion.img
                                            src={step.image}
                                            alt={step.title}
                                            className={styles.stepImage}
                                            variants={imageVariants}
                                            animate={{
                                                y: [0, -8, 0],
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: index * 0.5
                                            }}
                                        />
                                    </div>
                                    <div className={styles.stepText}>
                                        <h3>{step.title}</h3>
                                        <p>{step.description}</p>
                                    </div>
                                </div>

                                <div className={styles.stepRight}>
                                    <motion.div
                                        className={styles.iconCircle}
                                        variants={iconCircleVariants}
                                    >
                                        <img src={step.icon} alt={`${step.title} Icon`} />
                                    </motion.div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    )
}
