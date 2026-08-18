'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../aiAssistant.module.scss';

export default function ChartLoaderOverlay({ activeSymbol, currentTimeframe }) {
    const { t } = useLanguage();
    const loadingText = t('aiAssistant.loadingChart', 'Loading...');

    return (
        <div className={styles.chartLoaderOverlay}>
            <div className={styles.chartSpinnerWrapper}>
                <div className={styles.chartSpinner} />
                <span>{loadingText}</span>
            </div>
        </div>
    );
}
