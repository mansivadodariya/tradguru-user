'use client';

import React, { useState, useEffect } from 'react';
import styles from './plans.module.scss';
import LineText from '@/components/lineText';
import { fetchSubscriptionPlans, defaultSubscriptionPlans } from '@/lib/plansData';
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
    const { t, language } = useLanguage();
    const [plans, setPlans] = useState(defaultSubscriptionPlans);
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

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

    const handleSelectPlan = (plan) => {
        setSelectedPlanId(plan.id);
        const planName = language === 'ar' ? (plan.name_ar || plan.name) : plan.name;
        toast.success(
            t('plans.selectSuccess', 'Selected {plan} plan ({credits} Credits)').replace('{plan}', planName).replace('{credits}', plan.credits)
        );
    };

    return (
        /* 
        <div className={styles.plansPage}>
            ...
        </div>
        */
        null
    );
}
