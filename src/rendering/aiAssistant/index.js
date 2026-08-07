'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './aiAssistant.module.scss';
import Button from '@/components/button';
import HistoryButton from '@/components/historyButton';
import RemoveIcon from '@/icons/removeIcon';
import DownIcon from '@/icons/downIcon';
import { toast } from '@/components/toast';
import { fxApi } from '@/lib/api';
import { getStoredUserId } from '@/lib/authSession';
import { syncCreditsAfterAction, notifyCreditsUpdated } from '@/lib/credits';
import { historyDeletes } from '@/lib/historyDeletes';
import Modal from '@/rendering/tradeSnap/Modal';
import Loader from '@/components/loader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ReportPanel from './ReportPanel';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps, bidiMarkdownComponents } from '@/lib/bidi';

const UploadIcon = '/assets/icons/upload-xs.svg';
const Logo = '/assets/icons/AIChat.svg';

const PAIR_GROUPS = [
    {
        label: 'Major Pairs',
        pairs: ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'XAU/USD'],
    },
    {
        label: 'Euro Crosses',
        pairs: ['EUR/GBP', 'EUR/CHF', 'EUR/JPY', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD'],
    },
    {
        label: 'Pound Crosses',
        pairs: ['GBP/JPY', 'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/NZD'],
    },
    {
        label: 'Yen Crosses',
        pairs: ['CHF/JPY', 'CAD/JPY', 'AUD/JPY', 'NZD/JPY'],
    },
    {
        label: 'Other Crosses',
        pairs: ['AUD/CHF', 'AUD/CAD', 'AUD/NZD', 'CAD/CHF', 'NZD/CHF'],
    },
];

const ALL_PAIRS = PAIR_GROUPS.flatMap(g => g.pairs);

const parseAssistantResponse = (raw) => {
    const envelope = raw?.data || raw;
    let payload = envelope?.response ?? envelope?.message ?? envelope?.answer ?? envelope;

    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            return {
                shortContent: payload,
                fullReport: null,
                visualData: null
            };
        }
    }

    const isObjectPayload = payload && typeof payload === 'object' && !Array.isArray(payload);
    if (!isObjectPayload) {
        const text = typeof payload === 'string' ? payload : String(payload || '');
        return { shortContent: text, fullReport: null, visualData: null };
    }

    const shortContent = payload.short_response || payload.shortResponse || '';
    const fullReport = payload.full_report || payload.fullReport || null;
    const visualData =
        payload.visual_data ||
        payload.visualData ||
        envelope?.visual_data ||
        envelope?.visualData ||
        raw?.visual_data ||
        raw?.visualData ||
        null;

    return {
        shortContent: shortContent || fullReport || payload.response || JSON.stringify(payload),
        fullReport: fullReport || shortContent || null,
        visualData
    };
};

const buildAssistantMessage = (parsed) => ({
    role: 'assistant',
    content: parsed.shortContent,
    fullReport: parsed.fullReport,
    visualData: parsed.visualData
});

const AiAssistant = ({ initialTab, initialOpenId } = {}) => {
    const { t } = useLanguage();

    // Authentication & Identification
    const [userId, setUserId] = useState(null);

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [selectedPair, setSelectedPair] = useState('XAU/USD');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Blog State - kept for history modal compatibility
    const [blogHistory, setBlogHistory] = useState([]);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [blogInput, setBlogInput] = useState('');
    const [isContent, setIsContent] = useState(false);

    // Loading & Network state
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [pendingRequest, setPendingRequest] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [pendingDeleteItem, setPendingDeleteItem] = useState(null);

    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // Refs
    const dropdownRef = useRef(null);
    const chatEndRef = useRef(null);
    const exportRef = useRef(null);

    // PDF Exporting State
    const [exportData, setExportData] = useState(null);

    // Fetch user details on mount
    useEffect(() => {
        const syncUserId = () => {
            const id = getStoredUserId();
            if (id) setUserId(id);
        };
        syncUserId();
        window.addEventListener('user:updated', syncUserId);
        return () => window.removeEventListener('user:updated', syncUserId);
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
            let historyList = Array.isArray(data) ? data : (data?.data || data?.questions || []);
            historyList = historyList.filter(item => item?.is_delete !== true);
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
            let historyList = Array.isArray(data) ? data : (data?.data || data?.blogs || []);
            historyList = historyList.filter(item => item?.is_delete !== true);
            setBlogHistory(historyList);
        } catch (err) {
            console.warn("Could not fetch blog history:", err.message);
            setBlogHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (userId) fetchChatHistory(userId);
    }, [userId]);

    // Deep-link support: /ai-assistant?open=<id>
    useEffect(() => {
        if (!initialOpenId || chatHistory.length === 0) return;
        const matchId = (item, index) =>
            String(item?.id || item?.created_at || item?.createdAt || index) === String(initialOpenId);
        const found = chatHistory.find((it, idx) => matchId(it, idx));
        if (found) handleSelectChat(found);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialOpenId, chatHistory]);

    // Actions

    const handleCreateNew = () => {
        setHistoryModalOpen(false);
        setSelectedChat(null);
        setChatMessages([]);
        setChatInput('');
    };

    const handleSelectChat = (item) => {
        setHistoryModalOpen(false);
        setSelectedChat(item);
        const question = item.question || item.message || '';
        const rawResponse = item.response || item.answer || item;
        // History items may store the response as a JSON string — parse it first
        let resolvedResponse = rawResponse;
        if (typeof rawResponse === 'string') {
            try { resolvedResponse = JSON.parse(rawResponse); } catch { resolvedResponse = rawResponse; }
        }
        const parsed = parseAssistantResponse(resolvedResponse);
        const pair = item.pair || '';

        setChatMessages([
            { role: 'user', content: question, pair: pair },
            buildAssistantMessage(parsed)
        ]);


        if (pair && ALL_PAIRS.includes(pair)) {
            setSelectedPair(pair);
        }
    };

    const handleSelectBlog = (item) => {
        setHistoryModalOpen(false);
        setSelectedBlog(item);
    };

    const getHistoryItemId = (item, index) => item?.id || item?.created_at || item?.createdAt || index;

    const openDeleteConfirm = (e, type, index, item) => {
        e.stopPropagation();
        setPendingDeleteItem({
            type,
            item,
            index,
            itemId: getHistoryItemId(item, index),
        });
        setConfirmDeleteOpen(true);
        setHistoryModalOpen(false);
    };

    const closeDeleteConfirm = () => {
        setConfirmDeleteOpen(false);
        setPendingDeleteItem(null);
    };

    const removeChatFromState = (itemId) => {
        setChatHistory(prev => prev.filter((ch, idx) => getHistoryItemId(ch, idx) !== itemId));
        if (selectedChat && getHistoryItemId(selectedChat) === itemId) {
            setSelectedChat(null);
            setChatMessages([]);
        }
    };

    const removeBlogFromState = (itemId) => {
        setBlogHistory(prev => prev.filter((b, idx) => getHistoryItemId(b, idx) !== itemId));
        if (selectedBlog && getHistoryItemId(selectedBlog) === itemId) {
            setSelectedBlog(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!pendingDeleteItem) return;
        const { type, item, itemId } = pendingDeleteItem;
        const deleteId = item?.id || item?.history_id || item?.question_id || item?.blog_id;
        if (!deleteId) {
            toast('Unable to delete this history item.');
            closeDeleteConfirm();
            return;
        }

        try {
            if (type === 'chat') {
                await historyDeletes.deleteQuestionHistoryItem({ userId, id: deleteId });
                removeChatFromState(itemId);
            } else {
                await historyDeletes.deleteBlogHistoryItem({ userId, id: deleteId });
                removeBlogFromState(itemId);
            }
        } catch (err) {
            toast(err?.message || 'Failed to delete history item.');
        } finally {
            closeDeleteConfirm();
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
            const parsed = parseAssistantResponse(result);
            const assistantMsg = buildAssistantMessage(parsed);
            setChatMessages(prev => [...prev, assistantMsg]);
            fetchChatHistory(userId);
            syncCreditsAfterAction(result);
        } catch (err) {
            const errorMessage = err?.message || "I apologize, but the FX Copilot API is currently unavailable. Please verify the endpoint or try again later.";
            setChatMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
            if (err?.detail?.error_code === 'INSUFFICIENT_CREDITS' || err?.message?.toLowerCase().includes('insufficient credits')) {
                notifyCreditsUpdated(0);
            }
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
            const source = result.data || result;
            const blogText = source.generated_content?.blog || source.response || source.content || source.blog_content || (typeof source === 'string' ? source : JSON.stringify(source));

            setSelectedBlog({
                input_data: topic,
                is_content: isContent,
                response: blogText,
                isLoading: false
            });
            fetchBlogHistory(userId);
            syncCreditsAfterAction(result);
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

    const handleDownloadReportContent = (reportContent, element, visualData) => {
        if (!element) {
            if (!reportContent) return;
            const blob = new Blob([reportContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'market-analysis-report.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        }

        setExportData({ fullReport: reportContent, visualData });
    };

    useEffect(() => {
        if (!exportData) return;

        const generatePdf = async () => {
            try {
                toast('Preparing PDF download...');
                const html2pdf = (await import('html2pdf.js')).default;

                // Give a short delay to let layout and ApexCharts settle in the off-screen element
                await new Promise((resolve) => setTimeout(resolve, 500));

                const element = exportRef.current;
                if (!element) {
                    throw new Error("Export element not found");
                }

                const opt = {
                    margin: 15,
                    filename: 'market-analysis-report.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        windowWidth: 800,
                        width: 800
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: {
                        mode: ['avoid-all', 'css', 'legacy'],
                        before: [],
                        after: [],
                        avoid: [
                            `.${styles.reportWidget}`,
                            `.${styles.reportGauge}`,
                            `.${styles.reportRadar}`,
                            `.${styles.mdTableWrapper}`,
                            `.${styles.reportMarkdown}`,
                            'h1',
                            'h2',
                            'h3',
                            'h4',
                            'h5',
                            'h6',
                            'p',
                            'li',
                            'ul',
                            'ol',
                            'blockquote',
                            'img',
                            'canvas',
                            'svg',
                            'table',
                            'tr',
                            'td',
                            'th',
                            'pre'
                        ]
                    }
                };

                await html2pdf().set(opt).from(element).save();
                toast('Report downloaded successfully!');
            } catch (err) {
                console.error('PDF download error:', err);
                toast('PDF generation failed. Downloading markdown version...');
                if (exportData.fullReport) {
                    const blob = new Blob([exportData.fullReport], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'market-analysis-report.md';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            } finally {
                setExportData(null);
            }
        };

        generatePdf();
    }, [exportData]);

    // Helper functions for safe rendering
    const getQuestionText = (item) => item.question || item.message || item.input_data || 'Untitled interaction';
    const getBlogTopicText = (item) => item.input_data || item.topic || item.title || 'Untitled Blog';
    const getBlogContentText = (item) => {
        const source = item.data || item;
        const raw = source.generated_content?.blog || source.response || source.content || source.blog_content || '';
        if (typeof raw === 'string' && raw) {
            try {
                const parsed = JSON.parse(raw);
                return parsed?.generated_content?.blog || parsed?.response || parsed?.content || parsed?.blog_content || raw;
            } catch { return raw; }
        }
        return raw?.generated_content?.blog || raw?.response || raw?.content || raw?.blog_content || String(raw || '');
    };

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
            <div className={styles.chatSingleBody}>
                {/* Chat interaction card */}
                <div className={styles.chatCard}>
                    <div className={styles.chatHeader}>
                        <div className={styles.avatar}>
                            <img src={Logo} alt='logo' />
                        </div>
                        <div className={styles.headerInfo}>
                            <h3>Trader Master Copilot</h3>
                            <span>{t('aiChat.activePair', 'Active Pair')}: {selectedPair}</span>
                        </div>
                        <div className={styles.headerAction}>
                            <Button
                                text={t('aiChat.createNewChat', 'Create New Chat')}
                                icon={UploadIcon}
                                onClick={handleCreateNew}
                            />
                            <HistoryButton
                                text={t('aiChat.history', 'History')}
                                onClick={() => setHistoryModalOpen(true)}
                            />
                        </div>
                    </div>
                    <div className={styles.chatBody}>
                        {chatMessages.length === 0 ? (
                            <div className={styles.welcomeContainer}>
                                <div className={styles.welcomeIcon}></div>
                                <h2>{t('aiChat.copilotTitle', 'Welcome to Trader Master Copilot')}</h2>
                                <p>{t('aiChat.copilotSubtitle', 'Select a major pair below, ask a question, and get deep insights on forex market movement and trends instantly.')}</p>
                            </div>
                        ) : (
                            chatMessages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : ''} ${msg.fullReport ? styles.reportRow : ''}`}
                                >
                                    {msg.role === 'user' && msg.pair && (
                                        <span className={styles.pairBadge}>{msg.pair}</span>
                                    )}
                                    <div {...getBidiProps(msg.content, msg.role === 'user' ? styles.userMessage : styles.assistantMessage)}>
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <>
                                                {msg.fullReport ? (
                                                    <>
                                                        <div className={styles.chatMarkdown}>
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                        <ReportPanel
                                                            inline
                                                            fullReport={msg.fullReport}
                                                            visualData={msg.visualData}
                                                            onDownload={(el) => handleDownloadReportContent(msg.fullReport, el, msg.visualData)}
                                                        />
                                                    </>
                                                ) : (
                                                    <div className={styles.chatMarkdown}>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </>
                                        )}
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
                            onClick={() => handleSuggestionClick(`Is ${selectedPair} a buy at current level on H4?`, selectedPair)}
                        >
                            Analyze {selectedPair} on H4
                        </button>
                        <button
                            className={styles.chip}
                            onClick={() => handleSuggestionClick(`What is the current technical trend for ${selectedPair}?`, selectedPair)}
                        >
                            {selectedPair} Trend Analysis
                        </button>
                        <button
                            className={styles.chip}
                            onClick={() => handleSuggestionClick(`Explain ${selectedPair} breakout patterns`, selectedPair)}
                        >
                            {selectedPair} Breakouts
                        </button>
                        <button
                            className={styles.chip}
                            onClick={() => handleSuggestionClick(`Give me a scalping strategy for ${selectedPair}`, selectedPair)}
                        >
                            {selectedPair} Strategy
                        </button>
                    </div>
                )}

                {/* Chat input box */}
                <div className={styles.inputArea}>
                    <textarea
                        placeholder={t('aiChat.askPlaceholder', 'Ask anything about forex trading, chart and strategies..')}
                        className={styles.textarea}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value.trimStart())}
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
                                    {PAIR_GROUPS.map(group => (
                                        <div key={group.label}>
                                            <div className={styles.dropdownHeader}>{group.label}</div>
                                            <div className={styles.dropdownList}>
                                                {group.pairs.map(pair => (
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
                                        </div>
                                    ))}
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
            </div>
            <Modal
                open={confirmDeleteOpen}
                onClose={closeDeleteConfirm}
                title="Delete history item?"
                description="This action cannot be undone."
                footer={
                    <>
                        <button type="button" className={styles.modalCancelBtn} onClick={closeDeleteConfirm}>
                            Cancel
                        </button>
                        <button type="button" className={styles.modalDeleteBtn} onClick={handleConfirmDelete}>
                            Delete
                        </button>
                    </>
                }
            >
                <p className={styles.modalText}>
                    Are you sure you want to delete this {pendingDeleteItem?.type === 'chat' ? 'chat' : 'blog'} history item?
                </p>
            </Modal>

            <Modal
                open={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                title={t('aiChat.history', 'Chat History')}
            >
                <div className={styles.historyModalContent}>
                    <div className={styles.allMessage}>
                        {loadingHistory ? (
                            <Loader centered />
                        ) : chatHistory.length === 0 ? (
                            <div className={styles.noHistory}>No past questions found</div>
                        ) : (
                            chatHistory.map((item, index) => (
                                <div
                                    className={`${styles.messageBox} ${selectedChat === item ? styles.selectedBox : ''}`}
                                    key={item.id || index}
                                    onClick={() => handleSelectChat(item)}
                                >
                                    <p {...getBidiProps(getQuestionText(item), styles.truncate)}>
                                        {getQuestionText(item)}
                                    </p>
                                    <div
                                        className={styles.icon}
                                        onClick={(e) => openDeleteConfirm(e, 'chat', index, item)}
                                    >
                                        <RemoveIcon />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            {exportData && (
                <div
                    style={{
                        position: 'absolute',
                        left: '-9999px',
                        top: '-9999px',
                        width: '800px',
                        background: '#ffffff',
                        zIndex: -1000
                    }}
                >
                    <div ref={exportRef} className={styles.pdfExporting}>
                        <ReportPanel
                            inline
                            fullReport={exportData.fullReport}
                            visualData={exportData.visualData}
                            isLoading={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiAssistant;
