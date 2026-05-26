import React from 'react';
import styles from './aiAssistant.module.scss';
import Button from '@/components/button';
import RemoveIcon from '@/icons/removeIcon';
const UploadIcon = '/assets/icons/upload-xs.svg';
const AiAssistant = () => {
    return (
        <div className={styles.aiAssistant}>
            <div className={styles.grid}>
                <div className={styles.items}>
                    <div className={styles.left}>
                        <div className={styles.first}>
                            <Button text="Create New Chat" icon={UploadIcon} />
                            <div className={styles.lineText}>
                                Search History
                            </div>
                        </div>
                        <div className={styles.allMessage}>
                            {
                                [...Array(10)].map((_, index) => {
                                    return (
                                        <div className={styles.messageBox} key={index}>
                                            <p>
                                                Which pharma stocks are oversold?
                                            </p>
                                            <div className={styles.icon}>
                                                <RemoveIcon />
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
                <div className={`${styles.items} ${styles.rightSide}`}>
                    <div className={styles.chatCard}>
                        <div className={styles.chatHeader}>
                            <div className={styles.avatar}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 3L3 20H8.5L12 12L15.5 20H21L12 3Z" fill="#0f5cf2"/>
                                </svg>
                            </div>
                            <div className={styles.headerInfo}>
                                <h3>FX Guru Copilot</h3>
                                <span>GPT Vision</span>
                            </div>
                        </div>
                        <div className={styles.chatBody}>
                            {/* Assistant message */}
                            <div className={styles.messageRow}>
                                <div className={styles.assistantMessage}>
                                    <p>I cannot provide a direct &quot;buy,&quot; &quot;sell,&quot; or &quot;hold&quot; recommendation for GBP/JPY at the current price on the H4 timeframe. Such advice would constitute personalized financial guidance, which is outside the scope of SEBI regulations for research analysts.</p>
                                    <p>However, I can offer an educational analysis of the available technical data for GBP/JPY on the H4 timeframe.</p>
                                    <p>The technical analysis for GBP/JPY on the H4 timeframe indicates a generally bullish sentiment across various indicators. Moving averages predominantly suggest a positive outlook, while some oscillators point towards overbought conditions. The pair has shown signs of bullish recovery following recent movements.</p>
                                    <ul>
                                        <li>The RSI(14) is at 66.613, suggesting a strong buying interest.</li>
                                        <li>The STOCH(9,6) is at 67.778, also indicating a buy signal.</li>
                                        <li>The MACD(12,26) is at 0.13, further supporting a bullish view.</li>
                                        <li>The Williams %R is at -12.964, which suggests the pair might be in an overbought state.</li>
                                    </ul>
                                    <p>The technical analysis for GBP/JPY on the H4 timeframe indicates a generally bullish sentiment across various indicators. Moving averages predominantly suggest a positive outlook, while some oscillators point towards overbought conditions. The pair has shown signs of bullish recovery following recent movements.</p>
                                </div>
                                <span className={styles.timestampLeft}>12:26 PM</span>
                            </div>

                            {/* User message */}
                            <div className={`${styles.messageRow} ${styles.userRow}`}>
                                <div className={styles.userMessage}>
                                    Is GBP/JPY a buy at current price on H4?
                                </div>
                                <span className={styles.timestampRight}>12:26 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div className={styles.chipsRow}>
                        <button className={styles.chip}>Analyze XAU/USD on 1H</button>
                        <button className={styles.chip}>Best scalping strategy for EUR/USD</button>
                        <button className={styles.chip}>Explain RSI divergence</button>
                        <button className={styles.chip}>Review my last 5 trade</button>
                    </div>

                    {/* Chat Input Container */}
                    <div className={styles.inputArea}>
                        <textarea 
                            placeholder="Ask anything about forex trading, chart and strategies.." 
                            className={styles.textarea}
                        />
                        <div className={styles.inputFooter}>
                            <button className={styles.plusBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                            <button className={styles.sendBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="19" x2="12" y2="5"></line>
                                    <polyline points="5 12 12 5 19 12"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AiAssistant;
