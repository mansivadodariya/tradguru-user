'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../aiAssistant.module.scss';

export default function ChartSettingsModal({
    isOpen,
    onClose,
    draftBullishColor,
    setDraftBullishColor,
    draftBearishColor,
    setDraftBearishColor,
    draftBackgroundColor,
    setDraftBackgroundColor,
    onReset,
    onApply,
}) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className={styles.settingsModalOverlay} onClick={onClose}>
            <div className={styles.settingsModalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.settingsHeader}>
                    <h3>{t('aiAssistant.chartSettings', 'Chart Settings')}</h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.settingsBody}>
                    {/* Section A: Candlestick Colors */}
                    <div className={styles.settingSection}>
                        <h4>{t('aiAssistant.candlestickColors', 'CANDLESTICK COLORS')}</h4>
                        <div className={styles.settingRow}>
                            <label>{t('aiAssistant.bullishColor', 'Bullish (Up) Color')}</label>
                            <input
                                type="color"
                                value={draftBullishColor}
                                onChange={(e) => setDraftBullishColor(e.target.value)}
                            />
                        </div>
                        <div className={styles.settingRow}>
                            <label>{t('aiAssistant.bearishColor', 'Bearish (Down) Color')}</label>
                            <input
                                type="color"
                                value={draftBearishColor}
                                onChange={(e) => setDraftBearishColor(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Section B: Chart Styles */}
                    <div className={styles.settingSection}>
                        <h4>{t('aiAssistant.chartBackground', 'CHART BACKGROUND')}</h4>
                        <div className={styles.settingRow}>
                            <label>{t('aiAssistant.backgroundColor', 'Background Color')}</label>
                            <input
                                type="color"
                                value={draftBackgroundColor}
                                onChange={(e) => setDraftBackgroundColor(e.target.value)}
                            />
                        </div>
                        <div className={styles.presetColorRow}>
                            <button type="button" onClick={() => setDraftBackgroundColor('#08090c')} style={{ background: '#08090c', color: '#ffffff' }}>
                                {t('aiAssistant.dark', 'Dark')}
                            </button>
                            <button type="button" onClick={() => setDraftBackgroundColor('#0B0E14')} style={{ background: '#0B0E14', color: '#ffffff' }}>
                                {t('aiAssistant.midnight', 'Midnight')}
                            </button>
                            <button type="button" onClick={() => setDraftBackgroundColor('#1E222D')} style={{ background: '#1E222D', color: '#ffffff' }}>
                                {t('aiAssistant.slate', 'Slate')}
                            </button>
                            <button type="button" onClick={() => setDraftBackgroundColor('#FFFFFF')} style={{ background: '#FFFFFF', color: '#0f172a', borderColor: '#cbd5e1' }}>
                                {t('aiAssistant.light', 'Light')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.settingsFooter}>
                    <button type="button" className={styles.resetBtn} onClick={onReset}>
                        {t('aiAssistant.reset', 'Reset')}
                    </button>
                    <button type="button" className={styles.doneBtn} onClick={onApply}>
                        {t('aiAssistant.applySettings', 'Apply Settings')}
                    </button>
                </div>
            </div>
        </div>
    );
}
