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
import { useTheme } from '@/context/ThemeContext';
import SymbolIcon from '@/components/SymbolIcon';
import TickerSearchDropdown from '@/components/TickerSearchDropdown';
import { getBidiProps, bidiMarkdownComponents } from '@/lib/bidi';
import TradingViewChartPane, { PAIR_GROUPS, ALL_PAIRS, SYMBOL_DATABASE, normalizeSymbol } from './TradingViewChartPane';
import AttachmentDraft from './AttachmentDraft';
import ImagePreviewModal from './ImagePreviewModal';

const UploadIcon = '/assets/icons/upload-xs.svg';
const Logo = '/assets/icons/AIChat.svg';

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
                visualData: null,
                detected_pair: null,
                detected_timeframe: null,
                is_valid_chart: true,
                image_warning: null,
                chart_sections: null,
                response_format: null
            };
        }
    }

    const isObjectPayload = payload && typeof payload === 'object' && !Array.isArray(payload);
    if (!isObjectPayload) {
        const text = typeof payload === 'string' ? payload : String(payload || '');
        return {
            shortContent: text,
            fullReport: null,
            visualData: null,
            detected_pair: null,
            detected_timeframe: null,
            is_valid_chart: true,
            image_warning: null,
            chart_sections: null,
            response_format: null
        };
    }

    const shortContent = payload.text || payload.short_response || payload.shortResponse || payload.response || '';
    const fullReport = payload.full_report || payload.fullReport || envelope?.full_report || null;
    const visualData = payload.visual_data || payload.visualData || envelope?.visual_data || null;

    const detected_pair = payload.detected_pair || payload.detectedPair || envelope?.detected_pair || null;
    const detected_timeframe = payload.detected_timeframe || payload.detectedTimeframe || envelope?.detected_timeframe || null;
    const is_valid_chart = payload.is_valid_chart ?? payload.isValidChart ?? envelope?.is_valid_chart ?? true;

    let image_warning = payload.image_warning || envelope?.image_warning || null;
    if (!image_warning && is_valid_chart === false) {
        image_warning = '⚠️ Image not clear or valid chart header missing. Please upload a clear chart screenshot.';
    }

    const chart_sections = payload.chart_sections || payload.chartSections || envelope?.chart_sections || null;
    const response_format = payload.response_format || payload.responseFormat || envelope?.response_format || null;

    return {
        shortContent: shortContent || (typeof payload === 'string' ? payload : JSON.stringify(payload)),
        fullReport: fullReport,
        visualData,
        detected_pair,
        detected_timeframe,
        is_valid_chart,
        image_warning,
        chart_sections,
        response_format
    };
};

const buildAssistantMessage = (parsed) => ({
    role: 'assistant',
    content: parsed.shortContent,
    fullReport: parsed.fullReport,
    visualData: parsed.visualData,
    detected_pair: parsed.detected_pair,
    detected_timeframe: parsed.detected_timeframe,
    is_valid_chart: parsed.is_valid_chart,
    image_warning: parsed.image_warning,
    chart_sections: parsed.chart_sections,
    response_format: parsed.response_format
});

const SECTION_TITLE_MAP = {
    overall_trend: "📈 Overall Trend",
    market_structure: "🧱 Market Structure (BOS / CHoCH)",
    support_resistance_levels: "🎯 Support & Resistance Levels",
    supply_demand_zones: "⚡ Supply & Demand Zones (FVG)",
    trader_actionable_zones: "🛑 Trader Actionable Zones (Exact Entry, SL & TP Targets)",
    volatility_price_behavior: "📊 Volatility & Price Behavior",
    session_bias: "⏰ Session Bias",
    market_mood_radar: "🧠 Market Mood Radar",
    candlestick_patterns: "🕯️ Candlestick Patterns",
    chart_patterns: "📐 Chart Patterns"
};

function formatSectionTitle(key, index) {
    if (SECTION_TITLE_MAP[key]) return SECTION_TITLE_MAP[key];
    const defaultTitles = [
        "📈 Overall Trend",
        "🧱 Market Structure (BOS / CHoCH)",
        "🎯 Support & Resistance Levels",
        "⚡ Supply & Demand Zones (FVG)",
        "🛑 Trader Actionable Zones (Exact Entry, SL & TP Targets)",
        "📊 Volatility & Price Behavior",
        "⏰ Session Bias",
        "🧠 Market Mood Radar",
        "🕯️ Candlestick Patterns",
        "📐 Chart Patterns"
    ];
    if (defaultTitles[index]) return defaultTitles[index];
    return key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function AccordionSections({ sections }) {
    const [openIndices, setOpenIndices] = useState([0]);

    const toggleIndex = (idx) => {
        setOpenIndices((prev) =>
            prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
        );
    };

    let items = [];
    if (Array.isArray(sections)) {
        items = sections.map((sec, idx) => ({
            key: `sec_${idx}`,
            title: typeof sec === 'object' ? (sec.title || sec.name) : null,
            content: typeof sec === 'string' ? sec : (sec.content || sec.details || sec.text || JSON.stringify(sec)),
            index: idx
        }));
    } else if (typeof sections === 'object' && sections !== null) {
        items = Object.entries(sections).map(([key, content], idx) => ({
            key,
            title: formatSectionTitle(key, idx),
            content,
            index: idx
        }));
    }

    if (items.length === 0) return null;

    return (
        <div className={styles.accordionContainer}>
            {items.map((sec, idx) => {
                const title = sec.title || formatSectionTitle(sec.key, idx);
                const content = typeof sec.content === 'string' ? sec.content : JSON.stringify(sec.content);
                const isOpen = openIndices.includes(idx);

                return (
                    <div key={sec.key || idx} className={`${styles.accordionCard} ${isOpen ? styles.accordionOpen : ''}`}>
                        <button
                            type="button"
                            className={styles.accordionHeader}
                            onClick={() => toggleIndex(idx)}
                        >
                            <span className={styles.accordionTitle}>{title}</span>
                            <span className={styles.accordionChevron}>{isOpen ? '▲' : '▼'}</span>
                        </button>
                        {isOpen && (
                            <div className={styles.accordionBody}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                    {content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function AiResponseHeader({ msg }) {
    if (!msg || (!msg.detected_pair && !msg.detected_timeframe && !msg.query_type)) return null;
    return (
        <div className={styles.aiResponseHeaderBar}>
            <div className={styles.aiHeaderLeftBadges}>
                {msg.detected_pair && (
                    <span className={styles.badgeDetectedPair}>
                        📍 {msg.detected_pair}
                    </span>
                )}
                {msg.detected_timeframe && (
                    <span className={styles.badgeDetectedTf}>
                        ⏱️ {msg.detected_timeframe}
                    </span>
                )}
            </div>
            {msg.query_type && (
                <span className={styles.badgeQueryType}>
                    {msg.query_type}
                </span>
            )}
        </div>
    );
}

function ClarificationOptionButtons({ onSelect }) {
    const options = [
        { id: '1', icon: '📈', label: 'Technical Structure', sub: 'Pivots, RSI, MAs & Levels' },
        { id: '2', icon: '📰', label: 'Fundamental & Macro', sub: 'Central Bank & News Drivers' },
        { id: '3', icon: '⚡', label: 'Intraday Scalp Setup', sub: '15m/1H Quick Entry & Tight SL' },
        { id: '4', icon: '📊', label: 'Medium Term Setup', sub: '1H/4H Weekly Trend Setup' },
        { id: '5', icon: '🔄', label: 'Swing Position Setup', sub: '4H/Daily Multi-Day Setup' },
        { id: '6', icon: '🏆', label: 'Complete Pro Setup', sub: 'Full Tech + Macro + SL/TP' },
    ];

    return (
        <div className={styles.interactiveOptionsGrid}>
            {options.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    className={styles.optionChipButton}
                    onClick={() => onSelect(opt.id)}
                >
                    <span className={styles.optionChipIcon}>{opt.icon}</span>
                    <div className={styles.optionChipTextGroup}>
                        <div className={styles.optionChipTitle}>{opt.label}</div>
                        <div className={styles.optionChipSub}>{opt.sub}</div>
                    </div>
                </button>
            ))}
        </div>
    );
}

const AiAssistant = ({ initialTab, initialOpenId } = {}) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const isDark = theme !== 'light';

    // Authentication & Identification
    const [userId, setUserId] = useState(null);

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [selectedPair, setSelectedPair] = useState('XAU/USD');
    const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [attachDropdownOpen, setAttachDropdownOpen] = useState(false);
    const [chatTickerSearch, setChatTickerSearch] = useState('');
    const [chatActiveCategoryTab, setChatActiveCategoryTab] = useState('all');
    const [attachmentDraft, setAttachmentDraft] = useState(null);
    const [previewAttachment, setPreviewAttachment] = useState(null);

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

    // Resizable Splitter State (default 35% chat / 65% graph pane)
    const [chatWidthPercent, setChatWidthPercent] = useState(35);
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const dropdownRef = useRef(null);
    const attachDropdownRef = useRef(null);
    const chatEndRef = useRef(null);
    const exportRef = useRef(null);
    const gridRef = useRef(null);
    const fileInputRef = useRef(null);
    const chartPaneRef = useRef(null);

    // Quick Action Chip Handlers
    const handleGenerateFromImageClick = () => {
        let draft = null;
        if (chartPaneRef.current) {
            const dataUrl = chartPaneRef.current.getScreenshotDataUrl();
            if (dataUrl) {
                draft = {
                    name: `${normalizeSymbol(selectedPair)}_chart.png`,
                    url: dataUrl,
                    type: 'image/png'
                };
            }
        }
        handleSendChatMessage({
            overrideMessage: 'Analyze this chart screenshot and identify technical patterns & breakouts',
            overrideAttachment: draft
        });
    };

    const handleDeepAnalysisClick = () => {
        const sym = normalizeSymbol(selectedPair);
        handleSendChatMessage({
            overrideMessage: `Perform a Deep Pro Analysis for ${sym} including multi-timeframe market structure, pivot points, key indicators, macro drivers, and complete risk-reward trade setup`
        });
    };

    const handleMacroNewsClick = () => {
        handleSendChatMessage({
            overrideMessage: 'Show latest financial news, market sentiment, and central bank stance for active pair'
        });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setAttachmentDraft({
                url: event.target.result,
                name: file.name || 'Image Attachment'
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        let animationFrameId = null;

        const handleMouseMove = (e) => {
            if (!gridRef.current) return;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            animationFrameId = requestAnimationFrame(() => {
                if (!gridRef.current) return;
                const rect = gridRef.current.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const totalWidth = rect.width;
                const newPercent = (offsetX / totalWidth) * 100;
                const clamped = Math.max(20, Math.min(60, newPercent));
                setChatWidthPercent(clamped);
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isDragging]);

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
            if (attachDropdownRef.current && !attachDropdownRef.current.contains(e.target)) {
                setAttachDropdownOpen(false);
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
        setChatWidthPercent(35);
        [100, 200, 300, 400].forEach((ms) => {
            setTimeout(() => window.dispatchEvent(new Event('resize')), ms);
        });
    };

    const handleSelectChat = (item) => {
        setHistoryModalOpen(false);
        setSelectedChat(item);
        setChatWidthPercent(60);
        [100, 200, 300, 400].forEach((ms) => {
            setTimeout(() => window.dispatchEvent(new Event('resize')), ms);
        });
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

    const handleSendChatMessage = async (opts = {}) => {
        const msg = opts.overrideMessage !== undefined ? opts.overrideMessage : chatInput;
        const currentAttachment = opts.overrideAttachment !== undefined ? opts.overrideAttachment : attachmentDraft;

        if ((!msg.trim() && !currentAttachment) || pendingRequest) return;

        // Automatically expand chat panel to full wide mode (60%) when sending a message if currently small
        if (chatWidthPercent < 60) {
            setChatWidthPercent(60);
            [100, 200, 300, 400].forEach((ms) => {
                setTimeout(() => window.dispatchEvent(new Event('resize')), ms);
            });
        }

        setChatInput('');
        setAttachmentDraft(null);
        setPendingRequest(true);

        const cleanPair = normalizeSymbol(selectedPair);
        const activeTf = (typeof selectedTimeframe !== 'undefined' && selectedTimeframe) ? selectedTimeframe : '15m';

        const newUserMsg = {
            role: 'user',
            content: msg,
            pair: cleanPair,
            timeframe: activeTf,
            attachment: currentAttachment
        };
        setChatMessages(prev => [...prev, newUserMsg]);

        try {
            const chatPayload = {
                message: msg,
                pair: cleanPair,
                timeframe: activeTf,
                image_base64: currentAttachment?.url || null,
                stream: false,
                user_id: userId || undefined
            };

            const result = await fxApi.chat(chatPayload);
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

    const handleOptionClick = (optionNumber) => {
        handleSendChatMessage({
            overrideMessage: String(optionNumber),
        });
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
            <div
                ref={gridRef}
                className={`${styles.splitLayoutGrid} ${isDragging ? styles.isDraggingGrid : ''}`}
                style={{
                    gridTemplateColumns: `minmax(280px, ${chatWidthPercent}%) 10px minmax(0, 1fr)`,
                    transition: isDragging ? 'none' : 'grid-template-columns 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Center / Left Panel: Chatbot conversation view */}
                <div className={styles.chatSingleBody}>
                    {/* Chat interaction card */}
                    <div className={styles.chatCard}>
                        <div className={`${styles.chatHeader} ${chatWidthPercent <= 42 ? styles.compactHeader : ''}`}>
                            <div className={styles.avatar}>
                                <img src={Logo} alt='logo' />
                            </div>
                            <div className={styles.headerInfo}>
                                <h3>{t('aiAssistant.copilotTitle', 'Trader Master Copilot')}</h3>
                                <span>{t('aiAssistant.activePair', 'Active Pair')}: {selectedPair}</span>
                            </div>
                            <div className={styles.headerAction}>
                                <button
                                    type="button"
                                    className={styles.createNewBtn}
                                    onClick={handleCreateNew}
                                    title={t('aiAssistant.createNewChat', 'Create New Chat')}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
                                    </svg>
                                    <span>{t('aiAssistant.createNewChat', 'Create New Chat')}</span>
                                </button>
                                <HistoryButton
                                    text={t('aiAssistant.history', 'History')}
                                    onClick={() => setHistoryModalOpen(true)}
                                    className={styles.historyHeaderBtn}
                                />
                            </div>
                        </div>
                        <div className={styles.chatBody}>
                            {chatMessages.length === 0 && !pendingRequest ? (
                                <div className={styles.welcomeContainer}>
                                    {/* <div className={styles.welcomeHeroBadge}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <defs>
                                                <linearGradient id="badgeSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#38bdf8" />
                                                    <stop offset="100%" stopColor="#a855f7" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#badgeSparkleGrad)" />
                                        </svg>
                                        <span>AI Market Assistant</span>
                                    </div> */}
                                    <h2 className={styles.welcomeTitle}>
                                        What do you want <br />to <span className={styles.titleGradient}>analyze?</span>
                                    </h2>
                                    <p className={styles.welcomeSubtitle}>Select an analysis mode or ask any market question to start</p>
                                    <div className={styles.welcomeActionCards}>
                                        <button
                                            type="button"
                                            className={`${styles.welcomeActionCard} ${styles.deepCard}`}
                                            onClick={handleDeepAnalysisClick}
                                        >
                                            <div className={styles.cardIconWrapper}>
                                                <svg width="22" height="22" viewBox="0 0 512 512" fill="currentColor">
                                                    <g>
                                                        <path d="M345.934,233.32c-3.329-1.882-7.555-0.71-9.438,2.619c-1.882,3.329-0.71,7.565,2.624,9.447 c5.114,2.912,8.235,6.161,10.298,9.518c-8.54,3-16.11,4.234-22.799,4.234c-9.789-0.009-17.796-2.593-24.548-6.552 c-6.734-3.968-12.18-9.393-16.309-15.022c-6.806-9.278-15.661-17.542-26.098-23.571c-10.422-6.011-22.479-9.767-35.419-9.767 c-11.347-0.008-23.305,2.913-35.153,9.42c-4.844,2.655-9.043,5.762-12.7,9.153c-14.414,5.549-26.834,7.546-37.341,7.546 c-14.969,0-26.151-4.022-33.627-7.973c-3.733-1.971-6.525-3.933-8.332-5.353c-0.906-0.719-1.566-1.288-1.976-1.66l-0.426-0.409 l-0.067-0.062H94.62c-2.655-2.726-7.023-2.796-9.771-0.151c-2.752,2.654-2.832,7.04-0.177,9.792 c0.386,0.391,5.149,5.265,14.267,10.095c3.991,2.113,8.883,4.19,14.534,5.886c-1.501,2.113-3.551,5.202-5.784,9.135 c-4.293,7.573-9.225,18.201-11.738,30.737c-0.75,3.746,1.683,7.396,5.434,8.15c3.751,0.745,7.404-1.688,8.15-5.442 c2.108-10.556,6.414-19.94,10.205-26.608c1.891-3.338,3.645-5.993,4.906-7.778c0.63-0.896,1.136-1.58,1.474-2.024 c0.168-0.214,0.297-0.382,0.373-0.48l0.08-0.098l0.009-0.009l0.004-0.009c0.639-0.781,1.066-1.66,1.309-2.583 c3.525,0.434,7.227,0.701,11.156,0.692c7.284,0.009,15.261-0.852,23.851-2.805c-4.258,9.18-6.01,18.76-6.015,27.54 c0.017,8.843,1.7,16.869,4.701,23.261c1.637,3.463,5.77,4.936,9.228,3.303c3.458-1.634,4.936-5.771,3.298-9.224v-0.009 c-1.926-4.013-3.392-10.334-3.369-17.331c-0.005-7.546,1.624-15.856,5.531-23.438c3.928-7.582,10.028-14.498,19.479-19.701 c9.974-5.46,19.496-7.698,28.49-7.706c10.24,0,19.887,2.957,28.498,7.91c8.603,4.963,16.119,11.95,21.844,19.762 c5.038,6.872,11.778,13.655,20.452,18.769c8.656,5.114,19.284,8.478,31.58,8.469c8.136,0,16.975-1.474,26.466-4.706l0.022,0.497 c0,3.392-0.528,6.481-1.056,8.665c-0.262,1.092-0.524,1.954-0.706,2.513c-0.093,0.275-0.164,0.479-0.208,0.594l-0.04,0.107 l-0.004,0.017h0.004c-1.403,3.543,0.324,7.556,3.866,8.976c3.551,1.421,7.586-0.311,9.007-3.862 c0.177-0.497,2.966-7.413,2.992-17.011c0-5.505-0.964-11.968-4.164-18.35C359.62,244.054,354.133,237.928,345.934,233.32z"/>
                                                        <path d="M361.382,187.056c-19.043,0-34.336-7.014-44.914-16.194c-5.278-4.581-9.336-9.704-12.003-14.604 c-2.681-4.91-3.911-9.58-3.893-13.078c0-3.827-3.103-6.925-6.929-6.925c-3.826,0-6.926,3.098-6.926,6.925 c0.018,6.516,2.055,13.193,5.58,19.692c3.689,6.766,9.078,13.335,15.928,19.123c-1.381,1.918-3.286,4.387-5.718,7.032 c-5.278,5.762-12.886,12.145-21.969,15.368c-3.604,1.287-5.482,5.256-4.194,8.851c1.287,3.605,5.252,5.488,8.852,4.199 c12.327-4.43,21.555-12.508,27.815-19.381c2.788-3.072,4.958-5.877,6.561-8.123c11.462,6.614,25.618,10.982,41.812,10.973 c3.822,0,6.93-3.098,6.93-6.925C368.311,190.164,365.204,187.056,361.382,187.056z"/>
                                                        <path d="M315.197,322.537c-12.961,0-23.26-2.504-31.535-6.33c-12.385-5.753-20.42-14.595-25.476-23.412 c-2.521-4.395-4.261-8.771-5.358-12.616c-1.101-3.826-1.532-7.182-1.523-9.215c0-3.826-3.098-6.926-6.925-6.926 c-3.831,0-6.929,3.099-6.929,6.926c0,2.495,0.297,5.256,0.906,8.292c1.056,5.291,3.067,11.409,6.326,17.712 c4.888,9.447,12.647,19.354,24.242,26.884c2.903,1.899,6.046,3.622,9.428,5.166c0.528,2.273,1.261,6.321,1.256,11.204 c0,3.552-0.382,7.511-1.456,11.569c-1.074,4.057-2.823,8.195-5.602,12.216c-2.179,3.152-1.394,7.466,1.754,9.642 c3.148,2.175,7.462,1.394,9.638-1.749c3.782-5.469,6.178-11.151,7.608-16.567c1.434-5.424,1.913-10.582,1.913-15.111 c0-2.264-0.124-4.359-0.311-6.276c6.677,1.554,13.992,2.459,22.044,2.45c3.823,0,6.926-3.107,6.926-6.934 C322.123,325.644,319.02,322.537,315.197,322.537z"/>
                                                        <path d="M409.302,218.468c-3.431-2.956-7.133-5.38-11.04-7.103c-3.902-1.722-8.026-2.752-12.248-2.752 c-3.826,0-6.929,3.098-6.929,6.925c0,3.836,3.103,6.934,6.929,6.934c2.548-0.009,5.771,0.879,9.158,2.841 c5.078,2.912,10.357,8.141,14.196,14.693c3.862,6.543,6.308,14.33,6.304,22.373c-0.031,8.852-2.819,18.085-10.365,27.266 c-2.437,2.956-2.02,7.315,0.932,9.756c2.948,2.433,7.316,2.016,9.753-0.932c9.508-11.472,13.565-24.194,13.534-36.09 c0-7.227-1.447-14.142-3.879-20.446C421.988,232.485,416.16,224.398,409.302,218.468z"/>
                                                        <path d="M168.073,181.534v-0.009c4.759-5.638,11.538-10.059,19.266-13.033c7.715-2.983,16.327-4.475,24.384-4.466 c7.848-0.018,15.155,1.429,20.514,3.924c3.476,1.598,7.59,0.089,9.198-3.391c1.602-3.472,0.084-7.582-3.387-9.19 c-7.741-3.56-16.837-5.194-26.324-5.202c-9.739,0-19.901,1.758-29.365,5.388c-9.441,3.64-18.235,9.199-24.862,17.02 c-2.473,2.921-2.109,7.297,0.812,9.766C161.228,184.819,165.601,184.446,168.073,181.534z"/>
                                                        <path d="M492.215,208.417c-1.225-1.243-2.539-2.424-3.87-3.586c0.696-3.88,1.1-7.831,1.1-11.844 c0.004-10.636-2.53-21.467-7.808-31.464c-6.033-11.462-14.969-20.554-25.401-26.715c-7.297-4.315-15.323-7.191-23.642-8.532 c-2.019-7.182-5.185-14.019-9.438-20.224c-7.08-10.334-17.148-18.892-29.467-24.193c-8.811-3.791-18.058-5.611-27.14-5.611 c0,0-0.28-0.009-0.79,0.036c-11.533,0.134-22.759,3.161-32.69,8.692c-3.884-4.679-8.376-8.843-13.375-12.35 c-10.956-7.697-24.353-12.261-38.687-12.403c-0.165-0.009-0.364-0.017-0.608-0.026c-0.031,0-0.062,0-0.097,0h-0.009h-0.009h-0.004 c-0.022,0-0.044,0-0.066,0c-0.133,0-0.293,0.009-0.497,0.017c-12.482,0.098-24.277,3.543-34.354,9.508 c-4.368,2.575-8.354,5.673-12.012,9.118c-10.44-6.508-22.777-10.308-35.917-10.37l-0.048-0.008h-0.311c-0.009,0-0.014,0-0.022,0 c-0.018,0-0.036,0-0.057,0c-0.16,0-0.36,0.008-0.613,0.026c-13.979,0.133-27.088,4.466-37.896,11.817 c-6.264,4.253-11.746,9.518-16.279,15.545c-5.735-1.553-11.723-2.396-17.841-2.396c-5.091,0-10.254,0.577-15.394,1.749 c-15.138,3.471-28.068,11.772-37.334,22.861h0.005c-6.503,7.768-11.195,16.93-13.77,26.812 c-9.873,3.348-19.177,8.959-26.959,16.886c-0.004,0.009-0.013,0.018-0.022,0.027c-13.051,13.308-19.621,30.718-19.616,48.004v0.026 v0.036c0,0,0,0.017,0,0.035v0.186h0.004c0.017,6.01,0.83,12.003,2.415,17.827C4.799,239.81,0.005,254.272,0,269.073 c-0.004,10.955,2.638,22.097,8.128,32.369c6.17,11.533,15.244,20.668,25.8,26.856c7.404,4.341,15.532,7.21,23.952,8.559 c4.484,12.048,12.172,22.444,22.009,30.141c11.701,9.172,26.462,14.596,42.278,14.596c1.643,0,3.281-0.052,4.918-0.177h0.04h0.022 h0.005h0.004c6.982-0.506,13.672-2.077,19.904-4.501c4.142,6.64,9.348,12.508,15.395,17.348 c11.697,9.366,26.572,14.96,42.517,15.031c0.058,0.009,0.106,0.009,0.156,0.009c0.054,0,0.106,0,0.156,0h0.009 c0.005,0,0.005,0,0.005,0h0.013h0.071c0.023,0,0.032,0,0.054,0l0.173-0.009h0.049c1.274-0.009,2.553-0.062,3.826-0.142h0.018 l0.75-0.018c5.708-0.418,11.222-1.528,16.447-3.249c6.583,9.775,15.75,18.022,27.092,23.492h-0.005 c9.57,4.616,19.78,6.827,29.8,6.827c9.756,0,19.3-2.121,28.054-6.046c12.722,13.512,30.661,21.627,49.957,21.646 c4.231,0,8.51-0.391,12.79-1.199c16.438-3.089,30.523-11.888,40.378-23.9h-0.004c6.436-7.821,11.067-17.054,13.544-27.016 c11.368-1.118,22.648-5.078,32.618-12.092c9.487-6.659,16.838-15.36,21.765-25.072c4.928-9.704,7.467-20.412,7.467-31.216 c0-7.2-1.172-14.428-3.476-21.397c5.917-4.82,11.15-10.698,15.323-17.578c6.748-11.098,9.997-23.474,9.997-35.638 C511.996,238.914,505.102,221.468,492.215,208.417z M481.277,279.744c-6.965,11.47-18.192,18.609-30.457,20.731 c-3.773,0.648-6.303,4.235-5.656,7.998c0.648,3.774,4.231,6.304,8,5.656c2.819-0.479,5.594-1.181,8.315-2.068 c2.964,6.126,4.426,12.696,4.426,19.248c0.004,7.005-1.651,13.965-4.838,20.242c-3.192,6.278-7.898,11.861-14.077,16.212 c-7.781,5.451-16.615,8.053-25.418,8.061c-0.688,0-1.376-0.053-2.064-0.088c-0.146-1.154-0.289-2.299-0.502-3.445v-0.009 c-1.518-8.035-4.643-15.386-8.936-21.769l-0.524-0.782l-0.71-0.613c-5.252-4.492-12.217-11.879-17.593-19.407 c-2.694-3.756-4.998-7.556-6.547-10.938c-1.568-3.383-2.286-6.34-2.26-8.088c0-0.781,0.116-1.305,0.245-1.66 c0.137-0.346,0.266-0.551,0.537-0.834c2.703-2.699,2.703-7.094,0-9.793c-2.708-2.707-7.094-2.707-9.798,0v-0.008 c-1.686,1.686-2.96,3.719-3.742,5.85c-0.781,2.131-1.096,4.324-1.096,6.446c0.026,4.803,1.478,9.348,3.52,13.858 c3.095,6.73,7.711,13.415,12.696,19.514c4.692,5.736,9.686,10.876,14.156,14.818c3.076,4.741,5.323,10.086,6.433,15.972 c0.466,2.477,0.723,4.936,0.759,7.306l0.004,0.036c0.005,0.32,0.009,0.631,0.009,0.95c0,10.477-3.725,20.375-10.13,28.179 c-6.415,7.796-15.44,13.442-26.124,15.457c-2.796,0.525-5.571,0.782-8.301,0.782c-14.693,0.009-28.286-7.36-36.453-19.115 c4.395-4.457,8.141-9.695,11.008-15.625c3.556-7.351,5.42-15.129,5.762-22.817c0.169-3.836-2.796-7.067-6.614-7.236 c-3.826-0.168-7.063,2.796-7.232,6.615c-0.262,5.886-1.673,11.781-4.394,17.4l-0.004,0.018c-2.904,6.019-6.97,11.053-11.804,15.04 l-0.026,0.017c-7.941,6.517-17.992,10.104-28.259,10.104c-6.472,0-13.029-1.421-19.266-4.422 c-11.551-5.576-19.572-15.43-23.119-26.758l-0.005-0.009c-1.354-4.298-2.055-8.799-2.055-13.335c0-6.472,1.421-13.024,4.434-19.292 c1.665-3.445,0.214-7.582-3.232-9.242c-3.444-1.66-7.586-0.213-9.246,3.232c-3.934,8.15-5.811,16.806-5.811,25.303 c0,4.119,0.471,8.195,1.323,12.19c-5.411,2.956-11.515,4.838-18.112,5.328h-0.013c-1.074,0.071-2.14,0.106-3.187,0.106 c-10.401,0-20.038-3.605-27.7-9.73c-6.668-5.328-11.777-12.545-14.507-20.9c4.878-4.812,8.918-10.44,11.87-16.682 c1.633-3.454,0.155-7.591-3.303-9.225c-3.458-1.634-7.591-0.16-9.225,3.303c-2.743,5.806-6.72,10.956-11.617,15.084 c-6.934,5.85-15.692,9.624-25.444,10.325h-0.014c-1.07,0.071-2.135,0.115-3.187,0.115c-22,0.009-40.777-16.22-43.947-37.971 l-0.008-0.054l-0.009-0.054c-0.169-1.029-0.289-2.113-0.369-3.231c-0.075-1.084-0.114-2.149-0.114-3.214 c0-2.806,0.262-5.549,0.758-8.221c0.693-3.765-1.793-7.378-5.557-8.08c-3.76-0.693-7.373,1.794-8.07,5.558 c-0.644,3.48-0.986,7.076-0.986,10.743l0.014,0.399c-6.228-0.693-12.274-2.672-17.69-5.85c-6.832-4.005-12.66-9.855-16.682-17.366 c-3.578-6.694-5.26-13.85-5.265-20.926c0-9.127,2.833-18.093,8.075-25.586c2.006,2.841,4.293,5.54,6.854,8.052 c5.838,5.736,12.611,9.989,19.79,12.758c3.565,1.386,7.578-0.39,8.958-3.959c1.381-3.569-0.394-7.582-3.959-8.959 c-5.478-2.122-10.618-5.344-15.08-9.73l-0.009-0.008c-3.924-3.845-6.974-8.23-9.172-12.927c-2.783-5.948-4.181-12.403-4.181-18.866 c0.004-11.249,4.208-22.426,12.691-31.1c7.213-7.342,16.292-11.64,25.728-12.927h0.009h0.009l0.026-0.009 c1.994-0.266,4-0.408,6.015-0.399c11.245,0.009,22.444,4.218,31.114,12.696c2.734,2.672,7.12,2.628,9.797-0.106 c2.677-2.734,2.628-7.12-0.106-9.793c-11.032-10.805-25.338-16.327-39.668-16.602c1.634-6.632,4.75-12.793,9.1-17.987 c6.019-7.191,14.299-12.518,24.157-14.791c3.348-0.764,6.686-1.136,9.97-1.136c5.806,0,11.449,1.154,16.664,3.267 c-1.483,5.158-2.299,10.601-2.299,16.22c0,3.826,3.103,6.925,6.929,6.925c3.826,0,6.925-3.098,6.925-6.925 c0-6.064,1.221-11.852,3.401-17.108c3.346-8.026,9.002-14.88,16.118-19.719c7.13-4.838,15.684-7.644,24.961-7.653 c13.348,0.009,25.272,5.851,33.444,15.164l0.014,0.009c6.871,7.821,11.013,18.049,11.018,29.306c0,3.826,3.098,6.925,6.929,6.925 c3.827,0,6.925-3.098,6.925-6.925c0.005-12.793-4.133-24.672-11.142-34.288c3.587-4.971,8.159-9.18,13.45-12.305 c6.623-3.915,14.312-6.152,22.586-6.152c9.504,0,18.249,2.965,25.472,8.035c7.222,5.06,12.878,12.225,16.069,20.579l-0.004-0.008 c1.883,4.945,2.917,10.263,2.921,15.874c0,3.826,3.099,6.926,6.926,6.926c3.826,0,6.929-3.099,6.929-6.926 c0-5.718-0.857-11.24-2.393-16.46c8.203-7.644,19.092-11.968,30.328-11.968c5.868,0,11.817,1.172,17.57,3.64 c8.022,3.454,14.463,8.949,19.057,15.643c4.59,6.685,7.298,14.56,7.756,22.692c0.044,0.835,0.071,1.678,0.071,2.521 c-0.005,5.868-1.164,11.809-3.631,17.562c-1.510,3.516,0.111,7.59,3.626,9.099c3.516,1.518,7.59-0.115,9.1-3.631 c2.57-5.966,4.048-12.154,4.549-18.315c6.792,0.453,13.407,2.512,19.266,5.975c6.689,3.96,12.38,9.73,16.282,17.135v0.008 c3.414,6.464,5.012,13.353,5.016,20.163c0,3.125-0.36,6.214-1.021,9.242c-4.182-1.616-8.475-2.726-12.803-3.338 c-3.787-0.533-7.288,2.105-7.821,5.904c-0.533,3.783,2.104,7.289,5.895,7.822c4.346,0.613,8.63,1.865,12.74,3.8 c0.728,1.181,1.802,2.166,3.174,2.752c0.857,0.364,1.745,0.542,2.624,0.55c2.556,1.705,4.883,3.614,6.96,5.727l-0.093-0.097 l0.111,0.115c8.296,8.381,12.788,19.701,12.784,31.233C487.749,264.571,485.672,272.518,481.277,279.744z"/>
                                                    </g>
                                                </svg>
                                            </div>
                                            <div className={styles.cardTextContent}>
                                                <span className={styles.cardMainTitle}>{t('aiAssistant.deepMarketAnalysis', 'Deep Market Analysis')}</span>
                                                <span className={styles.cardSubTitle}>Technical signals, key levels & trend breakdown</span>
                                            </div>
                                            <div className={styles.cardArrow}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="m9 18 6-6-6-6" />
                                                </svg>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.welcomeActionCard} ${styles.imageCard}`}
                                            onClick={handleGenerateFromImageClick}
                                        >
                                            <div className={styles.cardIconWrapper}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                    <circle cx="12" cy="13" r="4" />
                                                </svg>
                                            </div>
                                            <div className={styles.cardTextContent}>
                                                <span className={styles.cardMainTitle}>{t('aiAssistant.generateFromImage', 'Generate From Image')}</span>
                                                <span className={styles.cardSubTitle}>Upload chart photo or snapshot for AI diagnosis</span>
                                            </div>
                                            <div className={styles.cardArrow}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="m9 18 6-6-6-6" />
                                                </svg>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.welcomeActionCard} ${styles.newsCard}`}
                                            onClick={handleMacroNewsClick}
                                        >
                                            <div className={styles.cardIconWrapper}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                                                    <path d="M18 14h-8" />
                                                    <path d="M15 18h-5" />
                                                    <path d="M10 6h8v4h-8z" />
                                                </svg>
                                            </div>
                                            <div className={styles.cardTextContent}>
                                                <span className={styles.cardMainTitle}>{t('aiAssistant.macroNews', 'Macro News & Economic Events')}</span>
                                                <span className={styles.cardSubTitle}>High-impact calendar catalysts & market sentiment</span>
                                            </div>
                                            <div className={styles.cardArrow}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="m9 18 6-6-6-6" />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                chatMessages.map((msg, index) => {
                                    const isDeepAnalysis = msg.response_format === "deep_analysis" || msg.response_format === "deep_decision";
                                    return (
                                        <div
                                            key={index}
                                            className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : ''} ${msg.fullReport ? styles.reportRow : ''}`}
                                        >
                                            {msg.role === 'user' && msg.pair && (
                                                <span className={styles.pairBadge}>{msg.pair}</span>
                                            )}
                                            <div {...getBidiProps(msg.content, msg.role === 'user' ? styles.userMessage : styles.assistantMessage)}>
                                                {msg.role === 'user' ? (
                                                    <>
                                                        {msg.attachment && (
                                                            <div
                                                                className={styles.userMsgAttachment}
                                                                onClick={() => setPreviewAttachment(msg.attachment)}
                                                                title="Click to preview image"
                                                            >
                                                                <img src={msg.attachment.url} alt="Attached Chart" />
                                                            </div>
                                                        )}
                                                        {msg.content}
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Dynamic Header Badges */}
                                                        <AiResponseHeader msg={msg} />

                                                        {/* Image Warning Banner */}
                                                        {msg.image_warning && (
                                                            <div className={styles.warningBanner}>
                                                                {msg.image_warning}
                                                            </div>
                                                        )}

                                                        {/* Main Content Markdown */}
                                                        <div className={styles.chatMarkdown}>
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>

                                                        {/* 10 Expandable Accordion UI Cards for Image Uploads */}
                                                        {msg.chart_sections && (
                                                            <AccordionSections sections={msg.chart_sections} />
                                                        )}

                                                        {/* 6 Interactive Perspective Option Chips */}
                                                        {msg.response_format === "interactive_clarification" && (
                                                            <ClarificationOptionButtons onSelect={handleOptionClick} />
                                                        )}

                                                        {/* Download Full Report STRICTLY ONLY in Deep Analysis Mode */}
                                                        {isDeepAnalysis && msg.fullReport && (
                                                            <button
                                                                type="button"
                                                                className={styles.downloadReportBtnGradient}
                                                                onClick={() => handleDownloadReportContent(msg.fullReport, null, msg.visualData)}
                                                            >
                                                                📥 Download Full Trade Report (.md)
                                                            </button>
                                                        )}

                                                        {isDeepAnalysis && msg.fullReport && (
                                                            <ReportPanel
                                                                inline
                                                                fullReport={msg.fullReport}
                                                                visualData={msg.visualData}
                                                                onDownload={(el) => handleDownloadReportContent(msg.fullReport, el, msg.visualData)}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
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

                    {/* Chat input box */}
                    <div className={styles.inputArea}>
                        {attachmentDraft && (
                            <AttachmentDraft
                                attachment={attachmentDraft}
                                onRemove={() => setAttachmentDraft(null)}
                                onPreview={(att) => setPreviewAttachment(att)}
                            />
                        )}
                        <textarea
                            placeholder={t('aiAssistant.askAnythingPlaceholder', 'Ask anything about forex trading, chart and strategies...')}
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
                            <div className={styles.leftInputControls}>
                                {/* Plus/Cross Attachment Dropdown Trigger */}
                                <div className={styles.attachDropdownContainer} ref={attachDropdownRef}>
                                    <button
                                        type="button"
                                        className={`${styles.attachPlusBtn} ${attachDropdownOpen ? styles.attachPlusActive : ''}`}
                                        onClick={() => setAttachDropdownOpen(!attachDropdownOpen)}
                                        title={attachDropdownOpen ? "Close attachment menu" : "Add attachment"}
                                    >
                                        <div className={styles.plusIconWrapper}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        </div>
                                    </button>

                                    {attachDropdownOpen && (
                                        <div className={styles.attachFloatingMenu}>
                                            <button
                                                type="button"
                                                className={styles.attachMenuItem}
                                                onClick={() => {
                                                    setAttachDropdownOpen(false);
                                                    fileInputRef.current?.click();
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                                </svg>
                                                <span>Upload files</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.attachMenuItem}
                                                onClick={() => {
                                                    setAttachDropdownOpen(false);
                                                    handleGenerateFromImageClick();
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                    <circle cx="12" cy="13" r="4" />
                                                </svg>
                                                <span>Chart Snapshot</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />

                                {/* Custom Dropdown Trigger */}
                                <div className={styles.dropdownContainer} ref={dropdownRef}>
                                    <button
                                        className={styles.dropdownTrigger}
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        type="button"
                                    >
                                        <SymbolIcon symbol={selectedPair} size={18} />
                                        <span>{selectedPair}</span>
                                        <span className={`${styles.chevron} ${dropdownOpen ? styles.rotated : ''}`}>
                                            <DownIcon />
                                        </span>
                                    </button>
                                    {dropdownOpen && (
                                        <TickerSearchDropdown
                                            selectedSymbol={selectedPair}
                                            onSelectSymbol={(newSym) => setSelectedPair(newSym)}
                                            onClose={() => setDropdownOpen(false)}
                                            position="top"
                                            isDark={isDark}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Send trigger */}
                            <button
                                className={styles.sendBtn}
                                onClick={handleSendChatMessage}
                                disabled={pendingRequest || (!chatInput.trim() && !attachmentDraft)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="19" x2="12" y2="5"></line>
                                    <polyline points="5 12 12 5 19 12"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resizable Splitter Line Handle */}
                <div
                    className={`${styles.resizerSplitter} ${isDragging ? styles.resizerActive : ''}`}
                    onMouseDown={handleMouseDown}
                    title="Drag to resize panels"
                >
                    <div className={styles.resizerLine} />
                </div>

                {/* Right Panel: TradingView Real-Time Chart Pane */}
                <div className={styles.chartSidePanel}>
                    <TradingViewChartPane
                        ref={chartPaneRef}
                        symbol={selectedPair}
                        onSymbolChange={(newSymbol) => {
                            if (!newSymbol || newSymbol === 'No Pair' || newSymbol === 'NO_PAIR' || String(newSymbol).toUpperCase().includes('NO PAIR')) {
                                setSelectedPair('XAU/USD');
                                return;
                            }
                            const match = ALL_PAIRS.find(p => p.replace(/[^A-Z0-9]/g, '') === newSymbol.toUpperCase());
                            setSelectedPair(match || newSymbol);
                        }}
                        onAttachScreenshot={(attachment) => {
                            setAttachmentDraft(attachment);
                        }}
                    />
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

            <ImagePreviewModal
                attachment={previewAttachment}
                onClose={() => setPreviewAttachment(null)}
            />
        </div>
    );
}

export default AiAssistant;
