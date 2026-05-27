'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './aiAssistant.module.scss';
import Button from '@/components/button';
import RemoveIcon from '@/icons/removeIcon';
import DownIcon from '@/icons/downIcon';
import { fxApi } from '@/lib/api';

const UploadIcon = '/assets/icons/upload-xs.svg';

const MAJOR_PAIRS = [
    'EUR/USD',
    'USD/JPY',
    'GBP/USD',
    'USD/CHF',
    'AUD/USD',
    'USD/CAD',
    'NZD/USD',
    'EUR/GBP',
    'EUR/JPY',
    'GBP/JPY'
];

const AiAssistant = () => {
    // Authentication & Identification
    const [userId, setUserId] = useState('94f3a4a6-540b-4c0d-b6b8-4376f0e75d9f');

    // Tab State: "chat" or "blog"
    const [activeTab, setActiveTab] = useState('chat');

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [selectedPair, setSelectedPair] = useState('EUR/USD');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Blog State
    const [blogHistory, setBlogHistory] = useState([]);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [blogInput, setBlogInput] = useState('');
    const [isContent, setIsContent] = useState(false);

    // Loading & Network state
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [pendingRequest, setPendingRequest] = useState(false);

    // Refs
    const dropdownRef = useRef(null);
    const chatEndRef = useRef(null);

    // Fetch user details on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.id || parsed.user_id) {
                    setUserId(parsed.id || parsed.user_id);
                }
            }
        } catch (e) {
            console.error("Failed to parse user from localStorage:", e);
        }
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to bottom on new chat messages
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, pendingRequest]);

    // Fetch history based on active tab
    const fetchChatHistory = async (uid) => {
        setLoadingHistory(true);
        try {
            const data = await fxApi.getQuestionHistory(uid);
            const historyList = Array.isArray(data) ? data : (data?.data || data?.questions || []);
            setChatHistory(historyList);
        } catch (err) {
            // Permission errors or network failures — just show empty history
            console.warn("Could not fetch chat history:", err.message);
            setChatHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchBlogHistory = async (uid) => {
        setLoadingHistory(true);
        try {
            const data = await fxApi.getBlogHistory(uid);
            const historyList = Array.isArray(data) ? data : (data?.data || data?.blogs || []);
            setBlogHistory(historyList);
        } catch (err) {
            console.warn("Could not fetch blog history:", err.message);
            setBlogHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'chat') {
            fetchChatHistory(userId);
        } else {
            fetchBlogHistory(userId);
        }
    }, [activeTab, userId]);

    // Actions
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPendingRequest(false);
    };

    const handleCreateNew = () => {
        if (activeTab === 'chat') {
            setSelectedChat(null);
            setChatMessages([]);
            setChatInput('');
        } else {
            setSelectedBlog(null);
            setBlogInput('');
        }
    };

    const handleSelectChat = (item) => {
        setSelectedChat(item);
        const question = item.question || item.message || '';
        const answer = item.response || item.answer || '';
        const pair = item.pair || '';

        setChatMessages([
            { role: 'user', content: question, pair: pair },
            { role: 'assistant', content: answer }
        ]);

        if (pair && MAJOR_PAIRS.includes(pair)) {
            setSelectedPair(pair);
        }
    };

    const handleSelectBlog = (item) => {
        setSelectedBlog(item);
    };

    const handleDeleteChat = (e, index, item) => {
        e.stopPropagation();
        const itemId = item.id || item.created_at || index;
        setChatHistory(prev => prev.filter((ch, idx) => (ch.id || ch.created_at || idx) !== itemId));
        if (selectedChat && (selectedChat.id || selectedChat.created_at || index) === itemId) {
            setSelectedChat(null);
            setChatMessages([]);
        }
    };

    const handleDeleteBlog = (e, index, item) => {
        e.stopPropagation();
        const itemId = item.id || item.created_at || index;
        setBlogHistory(prev => prev.filter((b, idx) => (b.id || b.created_at || idx) !== itemId));
        if (selectedBlog && (selectedBlog.id || selectedBlog.created_at || index) === itemId) {
            setSelectedBlog(null);
        }
    };

    const handleSendChatMessage = async () => {
        if (!chatInput.trim() || pendingRequest) return;
        const msg = chatInput;
        setChatInput('');
        setPendingRequest(true);

        const newUserMsg = { role: 'user', content: msg, pair: selectedPair };
        setChatMessages(prev => [...prev, newUserMsg]);

        try {
            const result = await fxApi.chat(selectedPair, msg, userId);
            // API returns { response: { short_response, full_report, visual_configs, visual_data, ... } }
            const responsePayload = result.response || result.message || result.answer || '';
            const responseText = typeof responsePayload === 'object'
                ? (responsePayload.full_report || responsePayload.short_response || JSON.stringify(responsePayload))
                : responsePayload;
            setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
            fetchChatHistory(userId);
        } catch (err) {
            console.error("Error sending chat message:", err);
            setChatMessages(prev => [...prev, { role: 'assistant', content: "I apologize, but the FX Copilot API is currently unavailable. Please verify the endpoint or try again later." }]);
        } finally {
            setPendingRequest(false);
        }
    };

    const handleGenerateBlog = async () => {
        if (!blogInput.trim() || pendingRequest) return;
        const topic = blogInput;
        setBlogInput('');
        setPendingRequest(true);

        setSelectedBlog({
            input_data: topic,
            is_content: isContent,
            response: '',
            isLoading: true
        });

        try {
            const result = await fxApi.generateBlog(topic, isContent);
            const blogText = result.response || result.content || result.blog_content || '';

            setSelectedBlog({
                input_data: topic,
                is_content: isContent,
                response: blogText,
                isLoading: false
            });
            fetchBlogHistory(userId);
        } catch (err) {
            console.error("Error generating blog:", err);
            setSelectedBlog({
                input_data: topic,
                is_content: isContent,
                response: "I apologize, but the Blog Generation API is currently unavailable. Please try again later.",
                isLoading: false
            });
        } finally {
            setPendingRequest(false);
        }
    };

    const handleSuggestionClick = (suggestion, pair) => {
        if (pair) {
            setSelectedPair(pair);
        }
        setChatInput(suggestion);
    };

    // Helper functions for safe rendering
    const getQuestionText = (item) => item.question || item.message || item.input_data || 'Untitled interaction';
    const getBlogTopicText = (item) => item.input_data || item.topic || item.title || 'Untitled Blog';
    const getBlogContentText = (item) => item.response || item.content || item.blog_content || '';

    const formatResponse = (text) => {
        // Guard: must be a non-empty string
        if (!text || typeof text !== 'string') return null;

        const lines = text.split('\n');
        const elements = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines
            if (!trimmed) { i++; continue; }

            // H2 heading: ## ...
            if (/^##\s+/.test(trimmed)) {
                elements.push(
                    <h2 key={i} className={styles.mdH2}>
                        {renderInline(trimmed.replace(/^##\s+/, ''))}
                    </h2>
                );
                i++; continue;
            }

            // H3 heading: ### ...
            if (/^###\s+/.test(trimmed)) {
                elements.push(
                    <h3 key={i} className={styles.mdH3}>
                        {renderInline(trimmed.replace(/^###\s+/, ''))}
                    </h3>
                );
                i++; continue;
            }

            // Table: starts with |
            if (trimmed.startsWith('|')) {
                const tableLines = [];
                while (i < lines.length && lines[i].trim().startsWith('|')) {
                    tableLines.push(lines[i].trim());
                    i++;
                }
                elements.push(renderTable(tableLines, elements.length));
                continue;
            }

            // Unordered list item: - or *
            if (/^[-*]\s+/.test(trimmed)) {
                const listItems = [];
                while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
                    listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
                    i++;
                }
                elements.push(
                    <ul key={`ul-${elements.length}`} className={styles.mdList}>
                        {listItems.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
                    </ul>
                );
                continue;
            }

            // Ordered list item: 1. 2. etc
            if (/^\d+\.\s+/.test(trimmed)) {
                const listItems = [];
                while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
                    listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
                    i++;
                }
                elements.push(
                    <ol key={`ol-${elements.length}`} className={styles.mdList}>
                        {listItems.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
                    </ol>
                );
                continue;
            }

            // Regular paragraph
            elements.push(<p key={i} className={styles.mdPara}>{renderInline(trimmed)}</p>);
            i++;
        }

        return elements;
    };

    // Render inline markdown: bold (**text**), and HTML color spans from the API
    const renderInline = (text) => {
        if (!text) return null;
        // Split on **bold**, keeping delimiters
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            // Pass through HTML color spans the API sends (e.g. <span style='color:red;'>...)
            // We render these via dangerouslySetInnerHTML on a wrapper span, but only for known safe patterns
            if (/<span\s+style=['"]color:[^'"]+['"]>/.test(part)) {
                return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
            }
            return part;
        });
    };

    // Render a markdown table from an array of pipe-delimited row strings
    const renderTable = (tableLines, keyPrefix) => {
        const rows = tableLines
            .filter(l => !/^\|[-:| ]+\|$/.test(l)) // strip separator rows
            .map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));

        if (rows.length === 0) return null;
        const [header, ...body] = rows;

        return (
            <div key={`table-${keyPrefix}`} className={styles.mdTableWrapper}>
                <table className={styles.mdTable}>
                    <thead>
                        <tr>{header.map((cell, j) => <th key={j}>{renderInline(cell)}</th>)}</tr>
                    </thead>
                    <tbody>
                        {body.map((row, ri) => (
                            <tr key={ri}>
                                {row.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Render Skeletons for Loading History
    const renderHistorySkeletons = () => {
        return [...Array(5)].map((_, i) => (
            <div className={styles.skeletonBox} key={i}>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonLineShort}></div>
            </div>
        ));
    };

    return (
        <div className={styles.aiAssistant}>
            <div className={styles.grid}>
                {/* Left Sidebar: Navigation/History list */}
                <div className={styles.items}>
                    <div className={styles.left}>
                        <div className={styles.first}>
                            <Button
                                text={activeTab === 'chat' ? 'Create New Chat' : 'Create New Blog'}
                                icon={UploadIcon}
                                onClick={handleCreateNew}
                            />
                            <div className={styles.lineText}>
                                {activeTab === 'chat' ? 'Chat History' : 'Blog History'}
                            </div>
                        </div>
                        <div className={styles.allMessage}>
                            {loadingHistory ? (
                                renderHistorySkeletons()
                            ) : activeTab === 'chat' ? (
                                chatHistory.length === 0 ? (
                                    <div className={styles.noHistory}>No past questions found</div>
                                ) : (
                                    chatHistory.map((item, index) => (
                                        <div
                                            className={`${styles.messageBox} ${selectedChat === item ? styles.selectedBox : ''}`}
                                            key={item.id || index}
                                            onClick={() => handleSelectChat(item)}
                                        >
                                            <p className={styles.truncate}>
                                                {getQuestionText(item)}
                                            </p>
                                            <div
                                                className={styles.icon}
                                                onClick={(e) => handleDeleteChat(e, index, item)}
                                            >
                                                <RemoveIcon />
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                blogHistory.length === 0 ? (
                                    <div className={styles.noHistory}>No past blogs generated</div>
                                ) : (
                                    blogHistory.map((item, index) => (
                                        <div
                                            className={`${styles.messageBox} ${selectedBlog === item ? styles.selectedBox : ''}`}
                                            key={item.id || index}
                                            onClick={() => handleSelectBlog(item)}
                                        >
                                            <p className={styles.truncate}>
                                                {getBlogTopicText(item)}
                                            </p>
                                            <div
                                                className={styles.icon}
                                                onClick={(e) => handleDeleteBlog(e, index, item)}
                                            >
                                                <RemoveIcon />
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side Pane: Chat View / Blog generation */}
                <div className={`${styles.items} ${styles.rightSide}`}>
                    {/* Premium tab control */}
                    <div className={styles.tabContainer}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.activeTab : ''}`}
                            onClick={() => handleTabChange('chat')}
                        >
                            AI Chat Copilot
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'blog' ? styles.activeTab : ''}`}
                            onClick={() => handleTabChange('blog')}
                        >
                            Blog Generator
                        </button>
                    </div>

                    {activeTab === 'chat' ? (
                        <>
                            {/* Chat interaction card */}
                            <div className={styles.chatCard}>
                                <div className={styles.chatHeader}>
                                    <div className={styles.avatar}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 3L3 20H8.5L12 12L15.5 20H21L12 3Z" fill="#0f5cf2" />
                                        </svg>
                                    </div>
                                    <div className={styles.headerInfo}>
                                        <h3>FX Guru Copilot</h3>
                                        <span>Active Pair: {selectedPair}</span>
                                    </div>
                                </div>
                                <div className={styles.chatBody}>
                                    {chatMessages.length === 0 ? (
                                        <div className={styles.welcomeContainer}>
                                            <div className={styles.welcomeIcon}></div>
                                            <h2>Welcome to FX Guru Copilot</h2>
                                            <p>Select a major pair below, ask a question, and get deep insights on forex market movement and trends instantly.</p>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : ''}`}
                                            >
                                                {msg.role === 'user' && msg.pair && (
                                                    <span className={styles.pairBadge}>{msg.pair}</span>
                                                )}
                                                <div className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}>
                                                    {msg.role === 'user' ? msg.content : formatResponse(msg.content)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {pendingRequest && (
                                        <div className={styles.messageRow}>
                                            <div className={styles.assistantMessage}>
                                                <div className={styles.loadingDots}>
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </div>

                            {/* Suggestions Chips Row */}
                            {chatMessages.length === 0 && (
                                <div className={styles.chipsRow}>
                                    <button
                                        className={styles.chip}
                                        onClick={() => handleSuggestionClick("Is EUR/USD a buy at current level on H4?", "EUR/USD")}
                                    >
                                        Analyze EUR/USD on H4
                                    </button>
                                    <button
                                        className={styles.chip}
                                        onClick={() => handleSuggestionClick("What is the current technical trend for GBP/USD?", "GBP/USD")}
                                    >
                                        GBP/USD Trend Analysis
                                    </button>
                                    <button
                                        className={styles.chip}
                                        onClick={() => handleSuggestionClick("Explain USD/JPY breakout patterns", "USD/JPY")}
                                    >
                                        USD/JPY Breakouts
                                    </button>
                                    <button
                                        className={styles.chip}
                                        onClick={() => handleSuggestionClick("Give me a scalping strategy for AUD/USD", "AUD/USD")}
                                    >
                                        AUD/USD Strategy
                                    </button>
                                </div>
                            )}

                            {/* Chat input box */}
                            <div className={styles.inputArea}>
                                <textarea
                                    placeholder="Ask anything about forex trading, chart and strategies.."
                                    className={styles.textarea}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendChatMessage();
                                        }
                                    }}
                                />
                                <div className={styles.inputFooter}>
                                    {/* Custom Dropdown Trigger */}
                                    <div className={styles.dropdownContainer} ref={dropdownRef}>
                                        <button
                                            className={styles.dropdownTrigger}
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            type="button"
                                        >
                                            <span>{selectedPair}</span>
                                            <span className={`${styles.chevron} ${dropdownOpen ? styles.rotated : ''}`}>
                                                <DownIcon />
                                            </span>
                                        </button>
                                        {dropdownOpen && (
                                            <div className={styles.dropdownMenu}>
                                                <div className={styles.dropdownHeader}>Major Pairs</div>
                                                <div className={styles.dropdownList}>
                                                    {MAJOR_PAIRS.map(pair => (
                                                        <button
                                                            key={pair}
                                                            className={`${styles.dropdownItem} ${selectedPair === pair ? styles.activePair : ''}`}
                                                            onClick={() => {
                                                                setSelectedPair(pair);
                                                                setDropdownOpen(false);
                                                            }}
                                                            type="button"
                                                        >
                                                            {selectedPair === pair && <span className={styles.checkmark}>✓</span>}
                                                            <span className={styles.pairText}>{pair}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className={styles.dropdownScrollArrow}>
                                                    <DownIcon />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Send trigger */}
                                    <button
                                        className={styles.sendBtn}
                                        onClick={handleSendChatMessage}
                                        disabled={pendingRequest || !chatInput.trim()}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="19" x2="12" y2="5"></line>
                                            <polyline points="5 12 12 5 19 12"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Blog Generator Card */}
                            <div className={styles.chatCard}>
                                <div className={styles.chatHeader}>
                                    <div className={styles.avatar}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f5cf2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </div>
                                    <div className={styles.headerInfo}>
                                        <h3>AI Blog Writer</h3>
                                        <span>Generates outline or full content</span>
                                    </div>
                                </div>
                                <div className={styles.chatBody}>
                                    {selectedBlog ? (
                                        <div className={styles.blogViewContainer}>
                                            <h2 className={styles.blogTitle}>
                                                Topic: {getBlogTopicText(selectedBlog)}
                                            </h2>
                                            <span className={styles.blogTypeBadge}>
                                                {selectedBlog.is_content ? 'Full Article' : 'Outline Only'}
                                            </span>
                                            <div className={styles.blogContent}>
                                                {selectedBlog.isLoading ? (
                                                    <div className={styles.blogLoadingState}>
                                                        <div className={styles.spinner}></div>
                                                        <p>Drafting your blog post, please wait...</p>
                                                    </div>
                                                ) : (
                                                    formatResponse(getBlogContentText(selectedBlog))
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.welcomeContainer}>
                                            <div className={styles.welcomeIcon}></div>
                                            <h2>FX Guru Blog Writer</h2>
                                            <p>Provide a topic or detailed outline guidelines. Switch toggle below to write a structured outline or a full article post.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Blog Input Area */}
                            <div className={styles.inputArea}>
                                <textarea
                                    placeholder="Enter a forex topic or outlines to generate a blog..."
                                    className={styles.textarea}
                                    value={blogInput}
                                    onChange={(e) => setBlogInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerateBlog();
                                        }
                                    }}
                                />
                                <div className={styles.inputFooter}>
                                    {/* Toggle input_data is_content */}
                                    <div className={styles.toggleContainer}>
                                        <label className={styles.switch}>
                                            <input
                                                type="checkbox"
                                                checked={isContent}
                                                onChange={(e) => setIsContent(e.target.checked)}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                        <span className={styles.toggleLabel}>Generate Full Content</span>
                                    </div>

                                    {/* Generate button */}
                                    <button
                                        className={styles.sendBtn}
                                        onClick={handleGenerateBlog}
                                        disabled={pendingRequest || !blogInput.trim()}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="19" x2="12" y2="5"></line>
                                            <polyline points="5 12 12 5 19 12"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AiAssistant;
