import React from 'react'
import styles from './aiChat.module.scss';
import LineText from '@/components/lineText';
const SearchMd = '/assets/icons/search-md.svg';
export default function AiChat() {
    return (
        <div className={styles.aiChat}>
            <div className='container-xs4'>
                <div className={styles.titleWrapper}>
                    <LineText text="Hello, i am AI Chat your AI creative tool" />
                    <div className={styles.title}>
                        <h1>
                            Ask anything on Finance
                        </h1>
                        <p>
                            The only AI Chat that screens stocks, analyzes charts, and delivers deep fundamental research - all in one conversation. Built for
                            every Indian investor.
                        </p>
                    </div>
                </div>

                <div className={styles.chatWrapper}>
                    <div className={styles.textbox}>
                        <div className={styles.chatContainer}>
                            <div className={styles.inputWrapper}>
                                <textarea
                                    placeholder="Ask anything about forex trading, chart and strategies.."
                                    className={styles.chatInput}
                                    rows={4}
                                />
                                <button className={styles.sendButton}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 20V4M12 4L5 11M12 4L19 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className={styles.suggestionsWrapper}>
                                <button className={styles.plusButton}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                                        <path d="M16.0003 2.66675C23.3641 2.66675 29.3337 8.63628 29.3337 16.0001C29.3337 23.3639 23.3641 29.3334 16.0003 29.3334C8.63653 29.3334 2.66699 23.3639 2.66699 16.0001M11.879 3.31591C10.5337 3.75272 9.28213 4.39763 8.16237 5.21263M5.2129 8.16208C4.39774 9.28205 3.75275 10.5338 3.31593 11.8794" stroke="#121212" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M16.0003 10.6667V21.3334M21.3337 16.0001H10.667" stroke="#121212" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </button>
                                <div className={styles.suggestions}>
                                    <button>Which pharma stocks are oversold?</button>
                                    <button>Fundamental analysis of reliance</button>
                                    <button>Bullish Continuation</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.cardsGrid}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='SearchMd' />
                                </div>
                                <h3>Chart Analysis</h3>
                            </div>
                            <p>Upload any forex chart and get instant AI-powered analysis with trend identification, support/resistance levels, and trade opportunities.</p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='SearchMd' />
                                </div>
                                <h3>Trading Insights</h3>
                            </div>
                            <p>Ask questions about forex strategies, market conditions, technical indicators, and get expert-level answers instantly.</p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox}>
                                    <img src={SearchMd} alt='SearchMd' />
                                </div>
                                <h3>Strategy Builder</h3>
                            </div>
                            <p>Create and refine your trading strategies with AI guidance tailored to your risk tolerance and goals.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
