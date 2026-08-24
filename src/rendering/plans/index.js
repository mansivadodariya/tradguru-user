'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './plans.module.scss';
import LineText from '@/components/lineText';
import { fetchSubscriptionPlans, defaultSubscriptionPlans } from '@/lib/plansData';
import { depositApi } from '@/lib/api';
import { getStoredUser, getStoredUserId } from '@/lib/authSession';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';
import toast from 'react-hot-toast';

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
        <polyline points="16 9 11 14 8 11" />
    </svg>
);

const StarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const ZapIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const ArrowUpRightIcon = () => (
    <svg className={styles.btnArrow} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
    </svg>
);

const FlameIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
    </svg>
);

export default function SubscriptionPlansView() {
    const router = useRouter();
    const { t, tDynamic, language } = useLanguage();
    const [plans, setPlans] = useState(defaultSubscriptionPlans);
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [submittingPlanId, setSubmittingPlanId] = useState(null);

    useEffect(() => {
        let isMounted = true;
        async function loadPlans() {
            try {
                const data = await fetchSubscriptionPlans();
                if (isMounted && data && data.length > 0) {
                    setPlans(data);
                }
            } catch (_) {
                if (isMounted) setPlans(defaultSubscriptionPlans);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadPlans();
        return () => { isMounted = false; };
    }, []);

    const handleUpgradePlan = async (plan) => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('access_token');
        const user = getStoredUser();
        const userId = getStoredUserId();

        if (!token || (!user && !userId)) {
            let redirectPath = '/plans';
            if (window.location.pathname === '/' || window.location.pathname === '') {
                redirectPath = '/#pricing';
            } else if (window.location.pathname === '/plans') {
                redirectPath = '/plans';
            } else {
                const hash = window.location.hash || (document.getElementById('pricing') ? '#pricing' : '');
                redirectPath = `${window.location.pathname}${window.location.search || ''}${hash}`;
            }
            router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
            return;
        }

        setSelectedPlanId(plan.id);
        setSubmittingPlanId(plan.id);
        try {
            const payload = {
                plan_id: plan.id,
                amount: Number(plan.price),
                currency: (plan.currency && plan.currency !== '$' && plan.currency !== 'USD') ? plan.currency : 'USDT',
                chain: plan.chain || 'SOLANA',
                user_id: user?.id || user?.user_id || userId,
                email: user?.email,
            };
            const res = await depositApi.createDeposit(payload);
            const redirectUrl =
                res?.data?.payment_info?.data?.checkout_url ||
                res?.data?.payment_info?.checkout_url ||
                res?.data?.checkout_url ||
                res?.data?.payment_url ||
                res?.data?.url ||
                res?.data?.redirect_url ||
                res?.payment_info?.data?.checkout_url ||
                res?.payment_info?.checkout_url ||
                res?.checkout_url ||
                res?.payment_url ||
                res?.url ||
                res?.redirect_url;
            if (redirectUrl) {
                window.location.href = redirectUrl;
                return;
            }
            toast.success(res?.message || t('plans.upgradeSuccess', 'Deposit request created successfully!'));
        } catch (err) {
            toast.error(err?.message || t('common.somethingWentWrong', 'Failed to create deposit request.'));
        } finally {
            setSubmittingPlanId(null);
        }
    };

    return (
        <div className={`${styles.plansPage} ${styles[`lang_${language}`] || ''}`}>
            {/* Background Glows */}
            <div className={styles.ambientGlow1} />
            <div className={styles.ambientGlow2} />

            {/* Header */}
            <div className={styles.headerSection}>
                <LineText text={t('plans.eyebrow', 'Subscription Plans')} />
                <h1 {...getBidiProps(t('plans.mainTitle', 'Flexible Plans for Every Trader'), styles.title)}>
                    {t('plans.mainTitle', 'Flexible Plans for Every Trader')}
                </h1>
                <p className={styles.subtitle}>
                    {t('plans.subtitle', 'Unlock real-time AI insights, unlimited charts, and deep market analytics.')}
                </p>
            </div>

            {/* Plans Grid */}
            {loading ? (
                <div className={styles.loadingGrid}>
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                </div>
            ) : (
                <div className={styles.plansGrid}>
                    {plans.map((plan) => {
                        const isArabic = language === 'ar';
                        const isFilipino = language === 'ph';
                        const defaultPlan = defaultSubscriptionPlans.find(d => d.id === plan.id) || {};

                        const isBestValue = Boolean(
                            plan.is_best_value ||
                            plan.best_value ||
                            plan.is_featured ||
                            plan.is_popular
                        );

                        let badgeText = isFilipino
                            ? (plan.badge_ph || plan.badge)
                            : isArabic
                            ? (plan.badge_ar || plan.badge)
                            : plan.badge;

                        if (!badgeText && isBestValue) {
                            badgeText = isFilipino ? 'PINAKAMAHUSAY NA HALAGA' : isArabic ? 'أفضل قيمة' : 'BEST VALUE';
                        }

                        if (!badgeText && defaultPlan) {
                            badgeText = isFilipino
                                ? (defaultPlan.badge_ph || defaultPlan.badge)
                                : isArabic
                                ? (defaultPlan.badge_ar || defaultPlan.badge)
                                : defaultPlan.badge;
                        }

                        const isFeatured = isBestValue || Boolean(badgeText) || plan.id === 'premium';
                        const isStandard = plan.id === 'standard';
                        const isBasic = plan.id === 'basic';
                        const isSelected = selectedPlanId === plan.id;

                        const name = isFilipino
                            ? (plan.name_ph || defaultPlan.name_ph || plan.name)
                            : isArabic
                            ? (plan.name_ar || defaultPlan.name_ar || plan.name)
                            : (plan.name || defaultPlan.name);

                        const description = isFilipino
                            ? (plan.description_ph || defaultPlan.description_ph || plan.description)
                            : isArabic
                            ? (plan.description_ar || defaultPlan.description_ar || plan.description)
                            : (plan.description || defaultPlan.description);

                        const validity = isFilipino
                            ? (plan.validity_ph || defaultPlan.validity_ph || plan.validity)
                            : isArabic
                            ? (plan.validity_ar || defaultPlan.validity_ar || plan.validity)
                            : (plan.validity || defaultPlan.validity);

                        const ctaText = t('plans.upgradePlan', isFilipino ? 'Mag-upgrade ng Plano' : isArabic ? 'ترقية الخطة' : 'Upgrade Plan');

                        const featuresList = (isFilipino && plan.features_ph?.length)
                            ? plan.features_ph
                            : (isArabic && plan.features_ar?.length)
                            ? plan.features_ar
                            : (plan.features?.length ? plan.features : defaultPlan.features);

                        return (
                            <div
                                key={plan.id}
                                className={`${styles.planCard} ${isFeatured ? styles.featuredCard : isStandard ? styles.standardCard : styles.basicCard} ${isSelected ? styles.selectedCard : ''}`}
                            >
                                {/* Best Value / Best Seller Badge on Top Border */}
                                {badgeText ? (
                                    <div className={styles.bestSellerBadge}>
                                        <span>{badgeText}</span>
                                    </div>
                                ) : null}

                                {/* Top Content Container */}
                                <div className={styles.cardHeader}>
                                    {/* Title Header Row with SVG Icon & Title */}
                                    <div className={styles.titleHeaderRow}>
                                        <img
                                            src={isBasic ? '/assets/icons/Free.svg' : isStandard ? '/assets/icons/mid.svg' : '/assets/icons/pro.svg'}
                                            alt={name}
                                            className={styles.planSvgIcon}
                                        />
                                        <h3 {...getBidiProps(name, styles.planName)}>{name}</h3>
                                    </div>

                                    {/* Description */}
                                    <p {...getBidiProps(description, styles.planDesc)}>{description}</p>

                                    {/* Pricing Row */}
                                    <div className={styles.priceContainer}>
                                        <div className={styles.priceRow}>
                                            {plan.originalPrice ? (
                                                <span className={styles.originalPrice}>
                                                    {plan.currency || '$'}{plan.originalPrice}
                                                </span>
                                            ) : null}
                                            <span className={styles.currency}>{plan.currency || '$'}</span>
                                            <span className={styles.amount}>{plan.price}</span>
                                            <span className={styles.validityLabel}>{validity}</span>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        type="button"
                                        className={`${styles.buyBtn} ${styles.primaryBuyBtn}`}
                                        onClick={() => handleUpgradePlan(plan)}
                                        disabled={submittingPlanId === plan.id}
                                    >
                                        <span {...getBidiProps(ctaText)}>
                                            {submittingPlanId === plan.id ? t('common.loading', 'Processing...') : ctaText}
                                        </span>
                                        <div className={styles.btnIconBox}>
                                            <ArrowUpRightIcon />
                                        </div>
                                    </button>
                                </div>

                                <div className={styles.cardDivider} />

                                {/* Bottom Features Container */}
                                <div className={styles.cardFeatures}>
                                    <ul className={styles.featuresList}>
                                        {featuresList.map((feat, idx) => (
                                            <li key={idx} {...getBidiProps(feat)}>
                                                <span className={styles.checkIconWrapper}>
                                                    <CheckIcon />
                                                </span>
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer Disclaimer */}
            <div className={styles.disclaimerBox}>
                <p {...getBidiProps(t('plans.disclaimer', 'Service volumes shown assume full balance is spent on a single service, at 15 credits per AI Chat query and 10 per Auto Chart analysis.'), styles.disclaimer)}>
                    {t('plans.disclaimer', 'Service volumes shown assume full balance is spent on a single service, at 15 credits per AI Chat query and 10 per Auto Chart analysis.')}
                </p>
            </div>
        </div>
    );
}
