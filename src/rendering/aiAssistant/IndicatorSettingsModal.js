import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './aiAssistant.module.scss';

export default function IndicatorSettingsModal({
    isOpen,
    indicatorKey,
    config,
    onClose,
    onSave,
    onResetDefaults,
}) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('inputs');
    const [draft, setDraft] = useState(config || {});

    useEffect(() => {
        if (config) {
            setDraft({ ...config });
        }
    }, [config, indicatorKey, isOpen]);

    if (!isOpen || !indicatorKey) return null;

    const getTitle = () => {
        if (indicatorKey?.startsWith('ma_') || draft?.type) {
            return `${draft.type || 'Moving Average'} (${draft.length || 20})`;
        }
        switch (indicatorKey) {
            case 'ema10': return 'EMA 10';
            case 'ema20': return 'EMA 20';
            case 'ema50': return 'EMA 50';
            case 'bollinger': return 'Bollinger Bands (20, 2)';
            case 'pivot': return 'Pivot Points (S/R)';
            case 'rsi': return 'RSI Settings';
            case 'macd': return 'MACD (12, 26, 9)';
            case 'stochastic': return 'Stochastic (14, 3, 3)';
            default: return 'Indicator Settings';
        }
    };

    const handleSave = () => {
        onSave(draft);
        onClose();
    };

    const handleReset = () => {
        if (onResetDefaults) {
            onResetDefaults();
        }
    };

    return (
        <div className={styles.indicatorModalOverlay} onClick={onClose}>
            <div className={styles.indicatorModalCard} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.indicatorModalHeader}>
                    <h3>{getTitle()}</h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose} title="Close">
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.indicatorModalTabs}>
                    <button
                        type="button"
                        className={`${styles.indicatorTabBtn} ${activeTab === 'inputs' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('inputs')}
                    >
                        Inputs
                    </button>
                    <button
                        type="button"
                        className={`${styles.indicatorTabBtn} ${activeTab === 'style' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('style')}
                    >
                        Style
                    </button>
                </div>

                {/* Body */}
                <div className={styles.indicatorModalBody}>
                    {activeTab === 'inputs' && (
                        <>
                            {/* Moving Average Inputs (EMA / SMA / Custom MA) */}
                            {(indicatorKey?.startsWith('ma_') || indicatorKey === 'ema10' || indicatorKey === 'ema20' || indicatorKey === 'ema50' || indicatorKey === 'sma') && (
                                <>
                                    <div className={styles.settingFieldRow}>
                                        <label>Length</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="500"
                                            value={draft.length ?? 20}
                                            onChange={(e) => setDraft(prev => ({ ...prev, length: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>Source</label>
                                        <select
                                            className={styles.settingSelect}
                                            value={draft.source ?? 'close'}
                                            onChange={(e) => setDraft(prev => ({ ...prev, source: e.target.value }))}
                                        >
                                            <option value="close">Close</option>
                                            <option value="open">Open</option>
                                            <option value="high">High</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Bollinger Bands Inputs */}
                            {indicatorKey === 'bollinger' && (
                                <>
                                    <div className={styles.settingFieldRow}>
                                        <label>Length</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="200"
                                            value={draft.length ?? 20}
                                            onChange={(e) => setDraft(prev => ({ ...prev, length: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>StdDev Multiplier</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className={styles.settingInput}
                                            min="0.1"
                                            max="10"
                                            value={draft.stdDev ?? 2}
                                            onChange={(e) => setDraft(prev => ({ ...prev, stdDev: Math.max(0.1, parseFloat(e.target.value) || 1) }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>Source</label>
                                        <select
                                            className={styles.settingSelect}
                                            value={draft.source ?? 'close'}
                                            onChange={(e) => setDraft(prev => ({ ...prev, source: e.target.value }))}
                                        >
                                            <option value="close">Close</option>
                                            <option value="open">Open</option>
                                            <option value="high">High</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* RSI Inputs */}
                            {indicatorKey === 'rsi' && (
                                <>
                                    <div className={styles.settingFieldRow}>
                                        <label>RSI Length</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="100"
                                            value={draft.length ?? 14}
                                            onChange={(e) => setDraft(prev => ({ ...prev, length: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>Overbought Threshold</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="50"
                                            max="95"
                                            value={draft.overbought ?? 70}
                                            onChange={(e) => setDraft(prev => ({ ...prev, overbought: parseInt(e.target.value) || 70 }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>Oversold Threshold</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="5"
                                            max="50"
                                            value={draft.oversold ?? 30}
                                            onChange={(e) => setDraft(prev => ({ ...prev, oversold: parseInt(e.target.value) || 30 }))}
                                        />
                                    </div>
                                </>
                            )}

                            {/* MACD Inputs */}
                            {indicatorKey === 'macd' && (
                                <>
                                    <div className={styles.settingFieldRow}>
                                        <label>Fast Length</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="100"
                                            value={draft.fast ?? 12}
                                            onChange={(e) => setDraft(prev => ({ ...prev, fast: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>Slow Length</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="200"
                                            value={draft.slow ?? 26}
                                            onChange={(e) => setDraft(prev => ({ ...prev, slow: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>Signal Smoothing</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="50"
                                            value={draft.signal ?? 9}
                                            onChange={(e) => setDraft(prev => ({ ...prev, signal: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Stochastic Inputs */}
                            {indicatorKey === 'stochastic' && (
                                <>
                                    <div className={styles.settingFieldRow}>
                                        <label>%K Length</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="100"
                                            value={draft.kPeriod ?? 14}
                                            onChange={(e) => setDraft(prev => ({ ...prev, kPeriod: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>%D Smoothing</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="50"
                                            value={draft.dPeriod ?? 3}
                                            onChange={(e) => setDraft(prev => ({ ...prev, dPeriod: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>%K Smoothing</label>
                                        <input
                                            type="number"
                                            className={styles.settingInput}
                                            min="1"
                                            max="50"
                                            value={draft.smooth ?? 3}
                                            onChange={(e) => setDraft(prev => ({ ...prev, smooth: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Pivot Points Inputs */}
                            {indicatorKey === 'pivot' && (
                                <div className={styles.settingFieldRow}>
                                    <label>Calculation Type</label>
                                    <select
                                        className={styles.settingSelect}
                                        value={draft.type ?? 'Standard'}
                                        onChange={(e) => setDraft(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="Fibonacci">Fibonacci</option>
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'style' && (
                        <>
                            {/* Color settings */}
                            {draft.color !== undefined && (
                                <>
                                    <div className={styles.settingFieldRow}>
                                        <label>Line Color</label>
                                        <div className={styles.colorInputWrapper}>
                                            <input
                                                type="color"
                                                value={draft.color.startsWith('#') ? draft.color : '#2979ff'}
                                                onChange={(e) => setDraft(prev => ({ ...prev, color: e.target.value }))}
                                            />
                                            <input
                                                type="text"
                                                className={styles.settingInput}
                                                style={{ width: '80px' }}
                                                value={draft.color}
                                                onChange={(e) => setDraft(prev => ({ ...prev, color: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    {draft.lineWidth !== undefined && (
                                        <div className={styles.settingFieldRow}>
                                            <label>Line Width</label>
                                            <select
                                                className={styles.settingSelect}
                                                value={draft.lineWidth ?? 1.5}
                                                onChange={(e) => setDraft(prev => ({ ...prev, lineWidth: parseFloat(e.target.value) }))}
                                            >
                                                <option value="1">1 px</option>
                                                <option value="1.5">1.5 px</option>
                                                <option value="2">2 px</option>
                                                <option value="3">3 px</option>
                                                <option value="4">4 px</option>
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* MACD Colors */}
                            {indicatorKey === 'macd' && (
                                <>
                                    <div className={styles.settingFieldRow}>
                                        <label>MACD Line Color</label>
                                        <div className={styles.colorInputWrapper}>
                                            <input
                                                type="color"
                                                value={draft.macdColor ?? '#00E5FF'}
                                                onChange={(e) => setDraft(prev => ({ ...prev, macdColor: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>Signal Line Color</label>
                                        <div className={styles.colorInputWrapper}>
                                            <input
                                                type="color"
                                                value={draft.signalColor ?? '#FFD600'}
                                                onChange={(e) => setDraft(prev => ({ ...prev, signalColor: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Stochastic Colors */}
                            {indicatorKey === 'stochastic' && (
                                <>
                                    <div className={styles.settingFieldRow}>
                                        <label>%K Line Color</label>
                                        <div className={styles.colorInputWrapper}>
                                            <input
                                                type="color"
                                                value={draft.kColor ?? '#00E5FF'}
                                                onChange={(e) => setDraft(prev => ({ ...prev, kColor: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.settingFieldRow}>
                                        <label>%D Line Color</label>
                                        <div className={styles.colorInputWrapper}>
                                            <input
                                                type="color"
                                                value={draft.dColor ?? '#FFD600'}
                                                onChange={(e) => setDraft(prev => ({ ...prev, dColor: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Line Width setting */}
                            {draft.lineWidth !== undefined && (
                                <div className={styles.settingFieldRow}>
                                    <label>Line Thickness</label>
                                    <select
                                        className={styles.settingSelect}
                                        value={draft.lineWidth}
                                        onChange={(e) => setDraft(prev => ({ ...prev, lineWidth: parseFloat(e.target.value) || 1 }))}
                                    >
                                        <option value="1">1px (Thin)</option>
                                        <option value="1.5">1.5px (Normal)</option>
                                        <option value="2">2px (Medium)</option>
                                        <option value="3">3px (Thick)</option>
                                    </select>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.indicatorModalFooter}>
                    <button type="button" className={styles.resetBtn} onClick={handleReset}>
                        {t('aiAssistant.reset', 'Defaults')}
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className={styles.resetBtn} onClick={onClose}>
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button type="button" className={styles.doneBtn} onClick={handleSave}>
                            {t('aiAssistant.apply', 'Ok')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
