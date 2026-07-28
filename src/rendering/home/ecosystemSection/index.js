'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './ecosystemSection.module.scss';
import LineText from '@/components/lineText';
import RightIcon from '@/icons/rightIcon';

const NeweraLogo = '/assets/icons/Img1.svg';
const AlgomaticLogo = '/assets/icons/algomaticIcon.svg';
const EdufinsLogo = '/assets/icons/edufins.svg';
const AsicLogo = '/assets/icons/asic.svg';
const FundedMasterLogo = '/assets/icons/Img2.svg';

const partnersData = [
    {
        id: 'newera',
        title: 'Newera Brokerage',
        badge: 'Liquidity Gateway',
        logo: <img src={NeweraLogo} alt="Newera Brokerage" style={{ filter: 'brightness(1.5)' }} />,
        description: 'Native volume-to-credit integration engine powering your Trader Master AI usage credits directly through MT5 trading volume.',
        href: 'https://newera365.com/',
        isExternal: true
    },
    {
        id: 'algomatic',
        title: 'Algomatic Quant',
        badge: 'Algo Execution',
        logo: <img src={AlgomaticLogo} alt="Algomatic Quant Broker" style={{ filter: 'brightness(1.5)' }} />,
        description: 'High-performance quantitative brokerage infrastructure offering direct FIX API access, strategy hosting, and automated risk engine.',
        href: 'https://algomaticbot.com/',
        isExternal: true
    },
    {
        id: 'edufins',
        title: 'Edufins',
        badge: 'Trading Academy',
        logo: <img src={EdufinsLogo} alt="Edufins Academy" style={{ filter: 'brightness(1.5)' }} />,
        description: 'Premier financial trading academy offering structured forex courses, live market analysis, risk management tools, and professional trader mentoring.',
        href: 'https://edufins.com',
        isExternal: true
    },
    {
        id: 'funded-master',
        title: 'Funded Master',
        badge: 'Prop Trading Firm',
        logo: <img src={FundedMasterLogo} alt="Funded Master" style={{ filter: 'brightness(1.5)' }} />,
        description: 'To win the game, you need strong support and diligent preparation. Join For Traders Community — traders worldwide (18+) can apply to trade in financial markets.',
        href: 'https://fundedmaster.com/',
        isExternal: true
    },

];

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
        <section className={styles.ecosystemSection}>
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
                    {partnersData.map((partner) => (
                        <motion.div
                            key={partner.id}
                            className={styles.itemCard}
                            variants={cardVariants}
                        >
                            <div>
                                <div className={styles.cardHeader}>
                                    <div className={styles.logoContainer}>
                                        {partner.logo}
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <h3>{partner.title}</h3>
                                    <p>{partner.description}</p>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                {partner.isExternal ? (
                                    <a
                                        href={partner.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.linkBtn}
                                    >
                                        <span>Visit Official Platform</span>
                                        <RightIcon />
                                    </a>
                                ) : (
                                    <Link href={partner.href} className={styles.linkBtn}>
                                        <span>Explore Details</span>
                                        <RightIcon />
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

               
            </div>
        </section>
    );
}
