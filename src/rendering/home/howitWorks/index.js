'use client'
import React from 'react'
import { motion } from 'framer-motion';
import styles from './howitWorks.module.scss';
import LineText from '@/components/lineText';

const Step1 = '/assets/images/step1.png';
const Step2 = '/assets/images/step2.png';
const Step3 = '/assets/images/step3.png';
const Step4 = '/assets/images/step4.png';

const IconOne = '/assets/icons/IconOne.svg';


const stepsData = [
    {
        id: 1,
        number: '01',
        title: 'Create your account',
        description: 'Sign up using your email address and complete quick verification to activate your trading dashboard access instantly.',
        image: Step1,
        icon: IconOne
    },
    {
        id: 2,
        number: '02',
        title: 'Link your MT5',
        description: 'Connect your MT5 trading account securely using your registered email and MT5 ID to sync balances, trades, and analytical data.',
        image: Step2,
        icon: IconOne
    },
    {
        id: 3,
        number: '03',
        title: 'Verify & unlock access',
        description: 'Submit your registered Nextera email and MT5 account ID for verification. Once your trading account qualifies, you unlock premium trading access.',
        image: Step3,
        icon: IconOne
    },
    {
        id: 4,
        number: '04',
        title: 'Trade & replenish',
        description: 'Every completed trade cycle helps replenish your available credits automatically, ensuring uninterrupted trading insights.',
        image: Step4,
        icon: IconOne
    }
];

export default function HowitWorks() {
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
                <LineText text="How It Works" />
                <div className={styles.title}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        From Signup to AI insight in four steps
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        No subscription, no card upfront. your trading activity is what
                        powers your AI access.
                    </motion.p>
                </div>

                <motion.div
                    className={styles.allStepAlignment}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {/* Vertical dashed line */}
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
                                {/* Left Section: Number and Dot */}
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

                                {/* Alternating Content Section */}
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

                                {/* Right Section: Animated Circle Icon */}
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
