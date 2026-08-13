'use client';

import React, { useState, useEffect } from 'react';
import SubscriptionPlansView from '@/rendering/plans';
import styles from './plansSection.module.scss';
import { supabase } from '@/lib/supabaseClient';

export default function PlansSection() {
    const [isVisible, setIsVisible] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = sessionStorage.getItem('visible_tab_names');
                if (cached) {
                    const arr = JSON.parse(cached);
                    return arr.some(name => (name || '').toLowerCase() === 'subscription plans');
                }
            } catch (e) { /* ignore */ }
        }
        return true;
    });

    useEffect(() => {
        async function checkVisibility() {
            if (!supabase) return;
            try {
                const { data, error } = await supabase.rpc('get_visible_dashboard_tabs');
                if (!error && Array.isArray(data)) {
                    const hasPlans = data.some(tab => (tab.name || '').toLowerCase() === 'subscription plans');
                    setIsVisible(hasPlans);
                }
            } catch (e) {
                console.warn('Failed to check plans section visibility:', e);
            }
        }
        checkVisibility();
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <section className={styles.plansSection} id="pricing">
            <SubscriptionPlansView />
        </section>
    );
}
