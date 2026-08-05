'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import styles from './clientSection.module.scss';
import LineText from '@/components/lineText';
import { useLanguage } from '@/context/LanguageContext';

const ProfileImage = '/assets/images/profile.png';

const StarIcon = () => (
    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 0L11.0206 6.21885H17.5595L12.2694 10.0623L14.29 16.2812L9 12.4377L3.71 16.2812L5.73056 10.0623L0.440492 6.21885H6.97938L9 0Z" fill="#FFB800" />
    </svg>
);

const QuoteIcon = () => (
    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 11.4286C0 5.11429 4.38857 0.942857 10.2857 0L10.9714 1.71429C7.88571 3.25714 6 5.82857 5.82857 8.22857C7.2 8.22857 8.57143 9.08571 8.57143 10.9714C8.57143 12.8571 7.02857 14.4 5.14286 14.4C2.05714 14.4 0 11.8286 0 11.4286ZM13.0286 11.4286C13.0286 5.11429 17.4171 0.942857 23.3143 0L24 1.71429C20.9143 3.25714 19.0286 5.82857 18.8571 8.22857C20.2286 8.22857 21.6 9.08571 21.6 10.9714C21.6 12.8571 20.0571 14.4 18.1714 14.4C15.0857 14.4 13.0286 11.8286 13.0286 11.4286Z" fill="#0B56DB" />
    </svg>
);

export default function ClientSection() {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleCards, setVisibleCards] = useState(3);

    const testimonials = [
        {
            id: 1,
            rating: 5,
            quote: t('home.testimonial1Quote', "The chart reads are scarily accurate. I use AI Trade before every London open it catches structure I'd miss half-asleep."),
            author: t('home.testimonial1Author', "Marcus Okafor"),
            role: t('home.testimonial1Role', "MT5 day trader, London"),
            avatar: ProfileImage
        },
        {
            id: 2,
            rating: 5,
            quote: t('home.testimonial2Quote', "AI Strategy gave me a mean-reversion system I actually trust. The backtest matched my live results within 4%."),
            author: t('home.testimonial2Author', "Michael T., Texas"),
            role: t('home.testimonial2Role', "Swing trader"),
            avatar: ProfileImage
        },
        {
            id: 3,
            rating: 5,
            quote: t('home.testimonial3Quote', "Best part: it's tied to my MT5. No bots, no noise. Every conversation is with someone who's actually trading."),
            author: t('home.testimonial3Author', "Daniel Reyes"),
            role: t('home.testimonial3Role', "Prop firm trader"),
            avatar: ProfileImage
        },
        {
            id: 4,
            rating: 5,
            quote: t('home.testimonial4Quote', "No subscription fees. Paying with trading volume credits is a game-changer. Finally, tools made for real day traders."),
            author: t('home.testimonial4Author', "Sarah L., Sydney"),
            role: t('home.testimonial4Role', "Full-time Scalper"),
            avatar: ProfileImage
        },
        {
            id: 5,
            rating: 5,
            quote: t('home.testimonial5Quote', "The support structures identified by Trader Master saved me from at least three bad setups this week alone. Incredible math."),
            author: t('home.testimonial5Author', "Kenji Sato"),
            role: t('home.testimonial5Role', "Risk Manager, Tokyo"),
            avatar: ProfileImage
        }
    ];

    useEffect(() => {
        const updateVisible = () => {
            if (window.innerWidth < 768) {
                setVisibleCards(1);
            } else if (window.innerWidth < 1024) {
                setVisibleCards(2);
            } else {
                setVisibleCards(3);
            }
        };
        updateVisible();
        window.addEventListener('resize', updateVisible);
        return () => window.removeEventListener('resize', updateVisible);
    }, []);

    const maxIndex = testimonials.length - visibleCards;
    const clampedIndex = Math.min(Math.max(currentIndex, 0), maxIndex);

    const handleNext = () => {
        if (currentIndex < maxIndex) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            setCurrentIndex(maxIndex);
        }
    };

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
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        },
        hover: {
            y: -8,
            borderColor: "rgba(11, 86, 219, 0.2)",
            boxShadow: "0 15px 35px 0 rgba(11, 86, 219, 0.06)",
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className={styles.clientSection}>
            <div className='container'>
                <LineText text={t('home.tradersTalkingLine', 'Traders talking')} />
                <div className={styles.title}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {t('home.tradersTalkingTitle', 'Used by serious Forex traders')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {t('home.tradersTalkingSubtitle', 'Real reviews from active MT5 traders using The Trader Master daily.')}
                    </motion.p>
                </div>

                <div className={styles.sliderWrapper}>
                    <div className={styles.sliderContainer}>
                        <motion.div
                            className={styles.sliderTrack}
                            animate={{ x: `calc(-${clampedIndex} * (100% / ${visibleCards} + ${24 / visibleCards}px))` }}
                            transition={{ type: "spring", stiffness: 100, damping: 18 }}
                        >
                            {testimonials.map((item) => (
                                <motion.div
                                    key={item.id}
                                    className={styles.slide}
                                    variants={cardVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    whileHover="hover"
                                >
                                    <div className={styles.testimonialCard}>
                                        <div>
                                            <div className={styles.cardHeader}>
                                                <div className={styles.stars}>
                                                    {[...Array(item.rating)].map((_, i) => (
                                                        <StarIcon key={i} />
                                                    ))}
                                                </div>
                                                <QuoteIcon />
                                            </div>
                                            <p className={styles.quoteText}>
                                                "{item.quote}"
                                            </p>
                                        </div>
                                        <div>
                                            <div className={styles.divider} />
                                            <div className={styles.profile}>
                                                <img
                                                    src={item.avatar}
                                                    alt={item.author}
                                                    className={styles.avatar}
                                                />
                                                <div className={styles.info}>
                                                    <h4 className={styles.name}>{item.author}</h4>
                                                    <span className={styles.role}>{item.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    <div className={styles.navigation}>
                        <button
                            className={styles.navBtn}
                            onClick={handlePrev}
                            aria-label="Previous testimonials"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9.57031 5.92969L3.50031 11.9997L9.57031 18.0697" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20.5 12H3.67" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button
                            className={styles.navBtn}
                            onClick={handleNext}
                            aria-label="Next testimonials"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M14.4297 5.92969L20.4997 11.9997L14.4297 18.0697" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.5 12H20.33" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
