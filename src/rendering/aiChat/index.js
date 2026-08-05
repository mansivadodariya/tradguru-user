'use client';

import React, { useState } from 'react';
import styles from './aiChat.module.scss';
import LineText from '@/components/lineText';
import { useRouter } from 'next/navigation';
import { authNavigate } from '@/lib/authRedirect';
import { useLanguage } from '@/context/LanguageContext';

const SearchMd = '/assets/icons/search-md.svg';

export default function AiChat() {
    const router = useRouter();
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState('');

    const handleSend = () => {
        authNavigate(router, '/ai-assistant');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.aiChat}>
            <div className='container-xs4'>
                <div className={styles.titleWrapper}>
                    <LineText text={t('aiChat.lineText', 'Hello, I am AI Chat your creative assistant')} />
                    <div className={styles.title}>
                        <h1>
                            {t('aiChat.title', 'AI Forex Assistant')}
                        </h1>
                        <p>
                            {t('aiChat.subtitle', 'Ask questions about currency pairs, technical setups, economic news, or risk management.')}
                        </p>
                    </div>
                </div>

                <div className={styles.chatWrapper}>
                    <div className={styles.textbox}>
                        <div className={styles.chatContainer}>
                            <div className={styles.inputWrapper}>
                                <textarea
                                    placeholder={t('aiChat.inputPlaceholder', 'Ask AI about any pair, indicator, or market setup...')}
                                    className={styles.chatInput}
                                    rows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button className={styles.sendButton} onClick={handleSend} type="button">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 20V4M12 4L5 11M12 4L19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className={styles.suggestionsWrapper}>
                                <button className={styles.plusButton} onClick={() => authNavigate(router, '/ai-assistant')} type="button">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                                        <path d="M16.0003 2.66675C23.3641 2.66675 29.3337 8.63628 29.3337 16.0001C29.3337 23.3639 23.3641 29.3334 16.0003 29.3334C8.63653 29.3334 2.66699 23.3639 2.66699 16.0001M11.879 3.31591C10.5337 3.75272 9.28213 4.39763 8.16237 5.21263M5.2129 8.16208C4.39774 9.28205 3.75275 10.5338 3.31593 11.8794" stroke="#121212" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M16.0003 10.6667V21.3334M21.3337 16.0001H10.667" stroke="#121212" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <div className={styles.suggestions}>
                                    <button type="button" onClick={() => authNavigate(router, '/ai-assistant')}>{t('aiChat.suggestedQuestion1', 'Analyze EUR/USD key levels for today')}</button>
                                    <button type="button" onClick={() => authNavigate(router, '/ai-assistant')}>{t('aiChat.suggestedQuestion2', 'What is the impact of the upcoming NFP release?')}</button>
                                    <button type="button" onClick={() => authNavigate(router, '/ai-assistant')}>{t('aiChat.suggestedQuestion3', 'Explain how to calculate position size for 1% risk')}</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.cardsGrid}>
                        <div className={styles.card} onClick={() => authNavigate(router, '/trade-snap')} style={{ cursor: 'pointer' }}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='SearchMd' />
                                </div>
                                <h3>{t('nav.aiTrade', 'Chart Analysis')}</h3>
                            </div>
                            <p>{t('home.step2Desc', 'Upload any forex chart and get instant AI-powered analysis with trend identification, support/resistance levels, and trade opportunities.')}</p>
                        </div>

                        <div className={styles.card} onClick={() => authNavigate(router, '/ai-assistant')} style={{ cursor: 'pointer' }}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='SearchMd' />
                                </div>
                                <h3>{t('nav.aiChat', 'Trading Insights')}</h3>
                            </div>
                            <p>{t('aiChat.subtitle', 'Ask questions about forex strategies, market conditions, technical indicators, and get expert-level answers instantly.')}</p>
                        </div>

                        <div className={styles.card} onClick={() => authNavigate(router, '/ai-strategy')} style={{ cursor: 'pointer' }}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='SearchMd' />
                                </div>
                                <h3>{t('nav.aiStrategy', 'Strategy Builder')}</h3>
                            </div>
                            <p>{t('aiStrategy.subtitle', 'Create and refine your trading strategies with AI guidance tailored to your risk tolerance and goals.')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
