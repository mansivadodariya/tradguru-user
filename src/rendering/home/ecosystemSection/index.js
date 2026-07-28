'use client';
import React from 'react';
import { motion } from 'framer-motion';
import styles from './ecosystemSection.module.scss';
import LineText from '@/components/lineText';
import BrokerCard from '@/components/brokerCard';
import { brokerList } from '@/lib/brokersData';

export default function EcosystemSection() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <section className={styles.ecosystemSection} id="ecosystem">
            <div className="container">
                <LineText text="Ecosystem & Partners" />
                <div className={styles.title}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Powered by <span>Industry-Leading</span> Brokers & Platforms
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        Seamlessly trade with top-tier regulated brokers, quant execution engines, and prop firms 
                        directly connected to Trader Master's AI suite.
                    </motion.p>
                </div>

                <motion.div
                    className={styles.grid}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {brokerList.map((broker) => (
                        <motion.div
                            key={broker.id}
                            variants={cardVariants}
                        >
                            <BrokerCard
                                broker={broker}
                                detailHref={`/brokers/${broker.id}`}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
