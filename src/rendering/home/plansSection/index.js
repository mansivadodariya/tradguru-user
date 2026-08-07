'use client';

import React from 'react';
import SubscriptionPlansView from '@/rendering/plans';
import styles from './plansSection.module.scss';

export default function PlansSection() {
    return (
        <section className={styles.plansSection} id="pricing">
            <SubscriptionPlansView />
        </section>
    );
}
