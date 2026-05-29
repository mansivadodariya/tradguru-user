"use client";
import React from 'react';
import { motion } from 'framer-motion';
import styles from './herobanner.module.scss';
import Header from '@/components/header';
import LineText from '@/components/lineText';
import Button from '@/components/button';
import { useRouter } from 'next/navigation';
const ArrowIcon = '/assets/icons/arrow.svg';
const HeroTextImage = '/assets/images/hero-text.png';

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
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 150,
            damping: 20
        }
    }
};

const imageVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95, filter: "blur(15px)" },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.5
        }
    }
};

export default function Herobanner() {
    const router = useRouter()
    return (
        <div className={styles.herobanner}>
            <div className='container-xs2'>
                <motion.div
                    className={styles.topContentAlignment}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants}>
                        <LineText text="AI For MT5 Traders" />
                    </motion.div>

                    <motion.h1 variants={itemVariants}>
                        Trade Smarter With AI-Powered Forex Intelligence
                    </motion.h1>

                    <motion.p variants={itemVariants}>
                        FX Guru reads your charts, analyses your trades, and builds your strategies through a conversational prompt interface designed exclusively for Forex
                        and MT5 traders.
                    </motion.p>

                    <motion.div className={styles.buttonCenter} variants={itemVariants}>
                        <Button icon={ArrowIcon} text="Get Started" onClick={() => router.push("/login")} />
                    </motion.div>

                    <motion.div className={styles.centerImage} variants={imageVariants}>
                        <img src={HeroTextImage} alt='HeroTextImage' />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
