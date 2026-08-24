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
import {
    TechnicalStructureIcon,
    FundamentalMacroIcon,
    IntradayScalpIcon,
    MediumTermIcon,
    SwingPositionIcon,
    CompleteProIcon
} from './components/ClarificationIcons';
import RenderMarkdownWithWidgets from './components/MarkdownWidgetRenderer';
import VisionAnalysisAccordions, { parseAnalysisReport, ChartAnalysisAccordions } from './components/VisionAnalysisAccordions';
import { WarningIcon, ChatIcon, AnalyticsIcon, DownloadIcon, BrainIcon } from './components/VisionIcons';
import { parseChatMessage } from '@/utils/chatParser';

const UploadIcon = '/assets/icons/upload-xs.svg';
const Logo = '/assets/icons/AIChat.svg';

const parseAssistantResponse = (raw) => {
    let envelope = raw?.data || raw;

    // Check if envelope has chats array (new With_Image / structured response format)
    let chatItem = null;
    if (envelope && Array.isArray(envelope.chats) && envelope.chats.length > 0) {
        chatItem = envelope.chats[envelope.chats.length - 1]; // latest chat item
    } else if (raw && Array.isArray(raw.chats) && raw.chats.length > 0) {
        chatItem = raw.chats[raw.chats.length - 1];
    }

    let payload = chatItem ? chatItem.response : (envelope?.response ?? envelope?.message ?? envelope?.answer ?? envelope);
    const imageUrl = chatItem?.image_url || envelope?.image_url || null;
    const chatType = chatItem?.chat_type || envelope?.chat_type || null;

    let rawText = '';
    let rawFullReport = envelope?.full_report || null;

    if (typeof payload === 'string') {
        rawText = payload;
    } else if (payload && typeof payload === 'object') {
        rawText = payload.short_response || payload.shortResponse || payload.text || payload.response || '';
        rawFullReport = payload.full_report || payload.fullReport || rawFullReport;
    }

    const parsed = parseChatMessage(rawText, rawFullReport);

    let shortContent = parsed.fallbackText || (typeof payload === 'string' ? '' : (payload?.short_response || payload?.shortResponse || payload?.text || payload?.response || ''));
    let fullReport = rawFullReport;

    const visualData = (payload && typeof payload === 'object') ? (payload.visual_data || payload.visualData || envelope?.visual_data || null) : null;
    let detected_pair = (payload && typeof payload === 'object') ? (payload.detected_pair || payload.detectedPair || envelope?.detected_pair || null) : null;
    let detected_timeframe = (payload && typeof payload === 'object') ? (payload.detected_timeframe || payload.detectedTimeframe || envelope?.detected_timeframe || null) : null;
    let is_valid_chart = (payload && typeof payload === 'object') ? (payload.is_valid_chart ?? payload.isValidChart ?? envelope?.is_valid_chart ?? true) : true;
    let image_warning = (payload && typeof payload === 'object') ? (payload.image_warning || envelope?.image_warning || null) : null;
    let chart_sections = (payload && typeof payload === 'object') ? (payload.chart_sections || payload.chartSections || envelope?.chart_sections || null) : null;
    let response_format = (payload && typeof payload === 'object') ? (payload.response_format || payload.responseFormat || envelope?.response_format || null) : null;
    let disclaimer_header = parsed.disclaimerHeader || null;
    let disclaimer_footer = parsed.disclaimerFooter || null;

    if (parsed.jsonData) {
        chart_sections = parsed.jsonData.chart_sections || parsed.jsonData;
        response_format = 'vision_analysis';
        if (!detected_pair && parsed.jsonData.detected_pair) detected_pair = parsed.jsonData.detected_pair;
        if (!detected_timeframe && parsed.jsonData.detected_timeframe) detected_timeframe = parsed.jsonData.detected_timeframe;
        if (parsed.jsonData.is_valid_chart !== undefined) is_valid_chart = parsed.jsonData.is_valid_chart;
        if (!image_warning && parsed.jsonData.image_warning) image_warning = parsed.jsonData.image_warning;
        if (!shortContent && parsed.jsonData.overall_summary) {
            shortContent = parsed.jsonData.overall_summary;
        }
    }

    // Check if payload itself is the chart report object
    if (payload && typeof payload === 'object' && !chart_sections && (payload.overall_trend || payload.market_structure || payload.support_and_resistance || payload.supply_and_demand_zones || payload.trader_actionable_zones)) {
        chart_sections = payload;
        response_format = 'vision_analysis';
    }

    if (chatType === 'With_Image' && !response_format) {
        response_format = 'vision_analysis';
    }

    if (!image_warning && is_valid_chart === false) {
        image_warning = 'Image not clear or valid chart header missing. Please upload a clear chart screenshot.';
    }

    return {
        shortContent: shortContent || (typeof payload === 'string' ? parsed.fallbackText : JSON.stringify(payload)),
        fullReport: fullReport,
        visualData,
        detected_pair,
        detected_timeframe,
        is_valid_chart,
        image_warning,
        chart_sections,
        response_format,
        image_url: imageUrl,
        chat_type: chatType,
        disclaimer_header,
        disclaimer_footer
    };
};

const CLARIFICATION_BUTTONS = [
    { label: 'Technical Structure',    icon: TechnicalStructureIcon, sub: 'Pivots, RSI, MAs & Levels' },
    { label: 'Fundamental & Macro',    icon: FundamentalMacroIcon, sub: 'Central Bank & News Drivers' },
    { label: 'Intraday Scalp Setup',   icon: IntradayScalpIcon, sub: '15m/1H Quick Entry & Tight SL' },
    { label: 'Medium Term Setup',      icon: MediumTermIcon, sub: '1H/4H Weekly Trend Setup' },
    { label: 'Swing Position Setup',   icon: SwingPositionIcon, sub: '4H/Daily Multi-Day Setup' },
    { label: 'Complete Pro Setup',     icon: CompleteProIcon, sub: 'Full Tech + Macro + SL/TP' },
];

function ClarificationOptionButtons({ onSelect }) {
    return (
        <div className={styles.clarificationOptionsGrid}>
            {CLARIFICATION_BUTTONS.map((btn) => {
                const IconComponent = btn.icon;
                return (
                    <button
                        key={btn.label}
                        type="button"
                        onClick={() => onSelect(btn.label)}
                        className={styles.clarificationOptionBtn}
                    >
                        <span className={styles.clarificationOptionIcon}>
                            <IconComponent size={18} />
                        </span>
                        <div className={styles.clarificationOptionText}>
                            <span className={styles.clarificationOptionLabel}>
                                {btn.label}
                            </span>
                            {btn.sub && (
                                <span className={styles.clarificationOptionSub}>
                                    {btn.sub}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

const buildAssistantMessage = (parsed) => ({
    role: 'assistant',
    content: parsed.shortContent,
    fullReport: parsed.fullReport,
    visualData: parsed.visualData,
    response_format: parsed.response_format,
    detected_pair: parsed.detected_pair,
    detected_timeframe: parsed.detected_timeframe,
    chart_sections: parsed.chart_sections,
    image_warning: parsed.image_warning,
    image_url: parsed.image_url,
    chat_type: parsed.chat_type
});

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

    // Active Mode Tab State ('deep' | 'news' | 'image' | null)
    const [activeAnalysisMode, setActiveAnalysisMode] = useState(null);

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
    const activeRequestIdRef = useRef(null);
    const textareaRef = useRef(null);

    // Quick Action Chip & Mode Tab Handlers
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
                setAttachmentDraft(draft);
            }
        }
        setActiveAnalysisMode('image');
        setTimeout(() => textareaRef.current?.focus(), 60);
    };

    const handleDeepAnalysisClick = () => {
        setActiveAnalysisMode(prev => prev === 'deep' ? null : 'deep');
        setTimeout(() => textareaRef.current?.focus(), 60);
    };

    const handleMacroNewsClick = () => {
        setActiveAnalysisMode(prev => prev === 'news' ? null : 'news');
        setTimeout(() => textareaRef.current?.focus(), 60);
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
            setSelectedPair('No Pair');
        };
        reader.readAsDataURL(file);
        setSelectedPair('No Pair');
        e.target.value = '';
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setAttachmentDraft({
                            url: event.target.result,
                            name: file.name || 'Pasted Screenshot.png'
                        });
                        setSelectedPair('No Pair');
                    };
                    reader.readAsDataURL(file);
                    setSelectedPair('No Pair');
                    break;
                }
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setAttachmentDraft({
                    url: event.target.result,
                    name: file.name || 'Image Attachment'
                });
                setSelectedPair('No Pair');
            };
            reader.readAsDataURL(file);
            setSelectedPair('No Pair');
        }
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
        activeRequestIdRef.current = null;
        setPendingRequest(false);
        setHistoryModalOpen(false);
        setSelectedChat(null);
        setChatMessages([]);
        setChatInput('');
        setActiveAnalysisMode(null);
        setAttachmentDraft(null);
        setPreviewAttachment(null);
        setChatWidthPercent(35);
        if (typeof window !== 'undefined' && window.history?.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('open');
            window.history.replaceState({}, '', url.toString());
        }
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
        const rawPair = item.pair || '';
        const isPairNone = !rawPair || rawPair === 'No Pair' || rawPair === 'NO_PAIR' || String(rawPair).toLowerCase().includes('no pair') || String(rawPair).toLowerCase() === 'none';
        const pair = isPairNone ? '' : rawPair;

        setChatMessages([
            { role: 'user', content: question, pair: pair || null },
            buildAssistantMessage(parsed)
        ]);

        if (pair && ALL_PAIRS.includes(pair)) {
            setSelectedPair(pair);
        } else if (isPairNone) {
            setSelectedPair('No Pair');
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
        let msg = opts.overrideMessage !== undefined ? opts.overrideMessage : chatInput;
        const currentAttachment = opts.overrideAttachment !== undefined ? opts.overrideAttachment : attachmentDraft;

        const isNoPair = !selectedPair || selectedPair === 'No Pair' || selectedPair === 'NO_PAIR' || String(selectedPair).toLowerCase().includes('no pair') || String(selectedPair).toLowerCase() === 'none';
        const cleanPair = isNoPair ? null : (normalizeSymbol(selectedPair) || null);
        const activeTf = (typeof selectedTimeframe !== 'undefined' && selectedTimeframe) ? selectedTimeframe : '15m';
        const sym = cleanPair || 'the market';

        // Contextual prompt formatting if active mode tab is selected
        if (!msg.trim()) {
            if (activeAnalysisMode === 'deep') {
                msg = `Perform a Deep Pro Analysis for ${sym} including multi-timeframe market structure, pivot points, key indicators, macro drivers, and complete risk-reward trade setup`;
            } else if (activeAnalysisMode === 'news') {
                msg = `Show latest financial news, market sentiment, and central bank stance for ${sym}`;
            } else if (activeAnalysisMode === 'image' && currentAttachment) {
                msg = 'Analyze this chart screenshot and identify technical patterns & breakouts';
            }
        } else {
            if (activeAnalysisMode === 'deep' && !msg.toLowerCase().includes('deep')) {
                msg = `[Deep Market Analysis for ${sym}] ${msg}`;
            } else if (activeAnalysisMode === 'news' && !msg.toLowerCase().includes('news') && !msg.toLowerCase().includes('macro')) {
                msg = `[Macro News & Events for ${sym}] ${msg}`;
            }
        }

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
        setActiveAnalysisMode(null);
        setPendingRequest(true);

        const requestId = Date.now();
        activeRequestIdRef.current = requestId;

        const newUserMsg = {
            role: 'user',
            content: msg,
            pair: cleanPair,
            timeframe: cleanPair ? activeTf : null,
            attachment: currentAttachment
        };
        setChatMessages(prev => [...prev, newUserMsg]);

        try {
            const chatPayload = {
                message: msg,
                ...(cleanPair ? { pair: cleanPair, timeframe: activeTf } : {}),
                image_base64: currentAttachment?.url || null,
                stream: false,
                user_id: userId || undefined
            };

            const result = await fxApi.chat(chatPayload);
            if (activeRequestIdRef.current !== requestId) return;

            const parsed = parseAssistantResponse(result);
            const assistantMsg = buildAssistantMessage(parsed);
            setChatMessages(prev => [...prev, assistantMsg]);
            fetchChatHistory(userId);
            syncCreditsAfterAction(result);
        } catch (err) {
            if (activeRequestIdRef.current !== requestId) return;
            const errorMessage = err?.message || "I apologize, but the FX Copilot API is currently unavailable. Please verify the endpoint or try again later.";
            setChatMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
            if (err?.detail?.error_code === 'INSUFFICIENT_CREDITS' || err?.message?.toLowerCase().includes('insufficient credits')) {
                notifyCreditsUpdated(0);
            }
        } finally {
            if (activeRequestIdRef.current === requestId) {
                setPendingRequest(false);
            }
        }
    };

    const handleOptionClick = (optionName) => {
        handleSendChatMessage({
            overrideMessage: String(optionName),
        });
    };

    const handleDownloadFullReport = (fullReportText, pairName) => {
        if (!fullReportText) return;
        const cleanPair = (pairName && pairName !== 'No Pair' && !String(pairName).toLowerCase().includes('no pair'))
            ? pairName.replace('/', '').toUpperCase()
            : (selectedPair && selectedPair !== 'No Pair' ? selectedPair.replace('/', '').toUpperCase() : 'Forex');
        const blob = new Blob([fullReportText], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cleanPair}_Trade_Report.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                            {chatMessages.length === 0 ? (
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
                                                <BrainIcon size={22} />
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
                                            {msg.role === 'user' &&
                                             msg.pair &&
                                             typeof msg.pair === 'string' &&
                                             msg.pair.trim() !== '' &&
                                             msg.pair !== 'No Pair' &&
                                             msg.pair !== 'NO_PAIR' &&
                                             !msg.pair.toLowerCase().includes('no pair') &&
                                             msg.pair.toLowerCase() !== 'none' && (
                                                <span className={styles.pairBadge}>
                                                    <ChatIcon size={12} /> {msg.pair.toUpperCase()}
                                                </span>
                                            )}
                                            <div {...getBidiProps(msg.content, msg.role === 'user' ? styles.userMessage : styles.assistantMessage)}>
                                                {msg.role === 'user' ? (
                                                    <>
                                                        {(msg.attachment?.url || msg.image_url) && (
                                                            <div
                                                                className={styles.userMsgAttachment}
                                                                onClick={() => setPreviewAttachment(msg.attachment || { url: msg.image_url, name: 'Chart Image' })}
                                                                title="Click to preview image"
                                                            >
                                                                <img src={msg.attachment?.url || msg.image_url} alt="Attached Chart" />
                                                            </div>
                                                        )}
                                                        {msg.content}
                                                    </>
                                                ) : (() => {
                                                    const parsed = parseChatMessage(msg.content, msg.fullReport);
                                                    const sections = msg.chart_sections || (parsed.jsonData ? (parsed.jsonData.chart_sections || parsed.jsonData) : null);
                                                    const disclaimerHeader = msg.disclaimer_header || parsed.disclaimerHeader;
                                                    const disclaimerFooter = msg.disclaimer_footer || parsed.disclaimerFooter;
                                                    const contentText = parsed.fallbackText || (typeof msg.content === 'string' && !msg.content.includes('{') ? msg.content : '');

                                                    if (sections) {
                                                        return (
                                                            <VisionAnalysisAccordions
                                                                data={sections}
                                                                chartSections={sections}
                                                                textSummary={contentText || sections.overall_summary}
                                                                imageWarning={msg.image_warning}
                                                                disclaimerHeader={disclaimerHeader}
                                                                disclaimerFooter={disclaimerFooter}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            {/* 1. Disclaimer Banner if present on plain message */}
                                                            {disclaimerHeader && (
                                                                <div className={styles.visionWarningCard} style={{ marginBottom: 12 }}>
                                                                    <span className={styles.visionWarningIcon}>
                                                                        <WarningIcon size={16} />
                                                                    </span>
                                                                    <div className={styles.chatMarkdown}>
                                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                                                                            {disclaimerHeader.replace(/^[>⚠️\s*]+/, '').replace(/^⚠️\s*/, '')}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* 2. Structured Deep Analysis or Markdown Content */}
                                                            {(msg.response_format === "deep_analysis" || isDeepAnalysis) && msg.fullReport ? (
                                                                <div className={styles.deepAnalysisCardWrapper}>
                                                                    {/* TOP SECTION: SHORT EXECUTIVE BULLETS */}
                                                                    {(contentText || msg.content) && (
                                                                        <div className={styles.executiveSummaryCard}>
                                                                            <RenderMarkdownWithWidgets
                                                                                content={contentText || msg.content}
                                                                                visualData={msg.visualData}
                                                                                defaultSymbol={msg.detected_pair || selectedPair}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* BOTTOM SECTION: ANALYSIS CENTER */}
                                                                    <div className={styles.analysisCenterCard}>
                                                                        <div className={styles.analysisCenterHeader}>
                                                                            <span className={styles.analysisCenterIcon}>
                                                                                <AnalyticsIcon size={18} />
                                                                            </span>
                                                                            <span className={styles.analysisCenterTitle}>Analysis Center</span>
                                                                        </div>

                                                                        <RenderMarkdownWithWidgets
                                                                            content={msg.fullReport}
                                                                            visualData={msg.visualData}
                                                                            defaultSymbol={msg.detected_pair || selectedPair}
                                                                        />

                                                                        {/* DOWNLOAD REPORT BUTTON */}
                                                                        <div className={styles.downloadReportRow}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDownloadFullReport(msg.fullReport, msg.detected_pair || selectedPair)}
                                                                                className={styles.downloadFullReportBtn}
                                                                            >
                                                                                <DownloadIcon size={15} />
                                                                                <span>Download Full Report (.md)</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <RenderMarkdownWithWidgets
                                                                    content={contentText || msg.content}
                                                                    visualData={msg.visualData}
                                                                    defaultSymbol={msg.detected_pair || selectedPair}
                                                                />
                                                            )}

                                                            {/* 3. Disclaimer Footer if present on plain message */}
                                                            {disclaimerFooter && (
                                                                <div className={styles.visionOverviewCard} style={{ marginTop: 12, opacity: 0.8, fontSize: '11.5px', fontStyle: 'italic' }}>
                                                                    <div className={styles.chatMarkdown}>
                                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                                                                            {disclaimerFooter}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {msg.response_format === "interactive_clarification" && (
                                                                <ClarificationOptionButtons onSelect={handleOptionClick} />
                                                            )}
                                                        </>
                                                    );
                                                })()}
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
                    <div
                        className={styles.inputArea}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {attachmentDraft && (
                            <AttachmentDraft
                                attachment={attachmentDraft}
                                                onRemove={() => setAttachmentDraft(null)}
                                onPreview={(att) => setPreviewAttachment(att)}
                            />
                        )}
                        <textarea
                            ref={textareaRef}
                            placeholder={
                                pendingRequest
                                    ? t('aiAssistant.loadingChart', 'Processing analysis...')
                                    : activeAnalysisMode === 'deep'
                                        ? t('aiAssistant.deepPlaceholder', `Ask for deep technical structure, key levels, trade setup for ${selectedPair || 'market'}...`).replace('{pair}', selectedPair || 'market')
                                        : activeAnalysisMode === 'news'
                                            ? t('aiAssistant.newsPlaceholder', 'Ask about economic events, catalysts, news sentiment...')
                                            : activeAnalysisMode === 'image'
                                                ? t('aiAssistant.imagePlaceholder', 'Ask about technical patterns and diagnosis on this chart...')
                                                : t('aiAssistant.askAnythingPlaceholder', 'Ask anything about forex trading, chart and strategies...')
                            }
                            className={styles.textarea}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value.trimStart())}
                            onPaste={handlePaste}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendChatMessage();
                                }
                            }}
                        />
                        <div className={styles.inputFooter}>
                            <div className={styles.leftInputControls}>
                                {/* Floating Attachment Dropdown Menu */}
                                <div className={styles.attachDropdownContainer} ref={attachDropdownRef}>
                                    <button
                                        type="button"
                                        className={`${styles.attachPlusBtn} ${attachDropdownOpen ? styles.attachPlusActive : ''}`}
                                        onClick={() => setAttachDropdownOpen(!attachDropdownOpen)}
                                        title={attachDropdownOpen ? t('aiAssistant.closeAttachmentMenu', 'Close attachment menu') : t('aiAssistant.addAttachment', 'Add attachment')}
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
                                                <span>{t('aiAssistant.uploadFiles', 'Upload files')}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.attachMenuItem} ${activeAnalysisMode === 'image' ? styles.attachMenuItemActive : ''}`}
                                                onClick={() => {
                                                    setAttachDropdownOpen(false);
                                                    handleGenerateFromImageClick();
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                    <circle cx="12" cy="13" r="4" />
                                                </svg>
                                                <span>{t('aiAssistant.chartSnapshot', 'Chart Snapshot')}</span>
                                                {activeAnalysisMode === 'image' && <span className={styles.activeModeDot} />}
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.attachMenuItem} ${activeAnalysisMode === 'deep' ? styles.attachMenuItemActive : ''}`}
                                                onClick={() => {
                                                    setAttachDropdownOpen(false);
                                                    handleDeepAnalysisClick();
                                                }}
                                            >
                                                <BrainIcon size={16} />
                                                <span>{t('aiAssistant.deepMarketAnalysis', 'Deep Market Analysis')}</span>
                                                {activeAnalysisMode === 'deep' && <span className={styles.activeModeDot} />}
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.attachMenuItem} ${activeAnalysisMode === 'news' ? styles.attachMenuItemActive : ''}`}
                                                onClick={() => {
                                                    setAttachDropdownOpen(false);
                                                    handleMacroNewsClick();
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                                                    <path d="M18 14h-8" />
                                                    <path d="M15 18h-5" />
                                                    <path d="M10 6h8v4h-8z" />
                                                </svg>
                                                <span>{t('aiAssistant.macroNews', 'Macro News & Economic Events')}</span>
                                                {activeAnalysisMode === 'news' && <span className={styles.activeModeDot} />}
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
                                            allowNoPair={true}
                                        />
                                    )}
                                </div>

                                {/* Active Analysis Mode Tab Badge */}
                                {activeAnalysisMode && (
                                    <div className={`${styles.activeModeTab} ${styles[`mode_${activeAnalysisMode}`]}`}>
                                        <span className={styles.activeModeIcon}>
                                            {activeAnalysisMode === 'deep' && <BrainIcon size={14} />}
                                            {activeAnalysisMode === 'news' && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                                                    <path d="M18 14h-8" />
                                                    <path d="M15 18h-5" />
                                                    <path d="M10 6h8v4h-8z" />
                                                </svg>
                                            )}
                                            {activeAnalysisMode === 'image' && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                    <circle cx="12" cy="13" r="4" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className={styles.activeModeLabel}>
                                            {activeAnalysisMode === 'deep' ? t('aiAssistant.deepAnalysis', 'Deep Analysis') : activeAnalysisMode === 'news' ? t('aiAssistant.macroNewsTab', 'Macro News') : t('aiAssistant.chartVision', 'Chart Vision')}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.activeModeCloseBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveAnalysisMode(null);
                                            }}
                                            title={t('aiAssistant.clearMode', 'Clear mode')}
                                        >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Send trigger */}
                            <button
                                className={styles.sendBtn}
                                onClick={handleSendChatMessage}
                                disabled={pendingRequest || (!chatInput.trim() && !attachmentDraft && !activeAnalysisMode)}
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
