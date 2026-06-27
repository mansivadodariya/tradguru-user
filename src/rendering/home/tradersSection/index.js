'use client'
import React from 'react'
import { motion } from 'framer-motion';
import styles from './tradersSection.module.scss';
import LineText from '@/components/lineText';
import RightIcon from '@/icons/rightIcon';

const SearchIcon = '/assets/icons/search.svg'
const TradeSnapImage = '/assets/images/trade-snap.png';
const FxGuruImage = '/assets/images/fx-guru.png';
const AiStrategyImage = '/assets/images/ai-strategy.png';

const tradersData = [
    {
        id: 1,
        title: 'AI Trade',
        description: 'Drag in a screenshot from MT5 or trading view. The Trader Master identifies structure, key levels, and gives you a graded setup with risk/reward math.',
        icon: SearchIcon,
        image: TradeSnapImage,
        linkText: 'Explore',
    },
    {
        id: 2,
        title: 'AI Chat',
        description: 'Ask anything pair commentary session bias news interpretation, each prompt cost a one credits your full chat history stays available.',
        icon: SearchIcon,
        image: FxGuruImage,
        linkText: 'Explore',
    },
    {
        id: 3,
        title: 'AI Strategy',
        description: 'Describe your trading style. get a complete strategy with entry rules, filters and a backtest report you can export.',
        icon: SearchIcon,
        image: AiStrategyImage,
        linkText: 'Explore',
    }
];

export default function TradersSection() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        },
        hover: {
            y: -10,
            boxShadow: "0 20px 40px 0 rgba(0, 0, 0, 0.1)",
            transition: { duration: 0.3 }
        }
    };

    const imageVariants = {
        hover: {
            scale: 1.05,
            x: -5,
            y: -5,
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    const iconVariants = {
        hover: {
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className={styles.tradersSection}>
            <div className='container'>
                <LineText text="AI For MT5 Traders" />
                <div className={styles.title}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Built for every part of your trading workflow
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        From single-chart questions to full strategy generation each module shares the same credit pool and your
                        linked MT5 context.
                    </motion.p>
                </div>
                <motion.div
                    className={styles.grid}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {tradersData.map((item) => (
                        <motion.div
                            key={item.id}
                            className={styles.items}
                            variants={cardVariants}
                            whileHover="hover"
                        >
                            <div
                                className={styles.icon}
                                variants={iconVariants}
                            >
                                <img src={item.icon} alt={`${item.title} Icon`} />
                            </div>
                            <h3>
                                {item.title}
                            </h3>
                            <p>
                                {item.description}
                            </p>
                            <div className={styles.readmore}>
                                <span>
                                    {item.linkText}
                                </span>
                                <RightIcon />
                            </div>
                            <motion.div
                                className={styles.imageAlignment}
                                variants={imageVariants}
                            >
                                <img src={item.image} alt={item.title} />
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
