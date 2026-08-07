'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './tradeSnap.module.scss';
import HistoryButton from '@/components/historyButton';
import { analyzeTradeScreenshots, dataUrlToBlob, extractTradesFromPayload } from '@/lib/tradeSnapApi';
import { getStoredUserId } from '@/lib/authSession';
import { toast } from '@/components/toast';
import { notifyCreditsUpdated } from '@/lib/credits';
import { tradeSnapApi } from '@/lib/api';
import { historyDeletes } from '@/lib/historyDeletes';
import AnalysisResultItem from './AnalysisResultItem';
import NextScreenshotTimer from './NextScreenshotTimer';
import Modal from './Modal';
import Loader from '@/components/loader';
import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';
import {
    MonitorIcon,
    MonitorOffIcon,
    PlayIcon,
    StopIcon,
    CameraIcon,
    ChartIcon,
    ClockIcon,
    LiveIcon,
    UploadIcon,
} from './icons';

const AUTO_CAPTURE_OPTIONS = [
    { value: '', label: 'Off' },
    { value: '1', label: 'Every 1 min' },
    { value: '5', label: 'Every 5 min' },
    { value: '30', label: 'Every 30 min' },
    { value: '60', label: 'Every 1 hour' },
    { value: '90', label: 'Every 1.5 hour' },
    { value: '120', label: 'Every 2 hour' },
];

const AUTO_CAPTURE_OPTIONS_MULTI_LOW = [
    ...AUTO_CAPTURE_OPTIONS.slice(0, 2),
    { value: '2', label: 'Every 2 min' },
    ...AUTO_CAPTURE_OPTIONS.slice(2),
];

function getUserId() {
    return getStoredUserId();
}

export default function TradeSnap() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('single');
    const [error, setError] = useState(null);

    // Single mode
    const [isSharing, setIsSharing] = useState(false);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [showSnapshot, setShowSnapshot] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [allAnalyses, setAllAnalyses] = useState([]);
    const [autoCaptureInterval, setAutoCaptureInterval] = useState(null);
    const [nextScreenshotEndTime, setNextScreenshotEndTime] = useState(null);
    const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(false);

    // Multi mode
    const [isSharing2, setIsSharing2] = useState(false);
    const [stream2, setStream2] = useState(null);
    const [capturedImage1, setCapturedImage1] = useState(null);
    const [capturedImage2, setCapturedImage2] = useState(null);
    const [showSnapshot1, setShowSnapshot1] = useState(false);
    const [showSnapshot2, setShowSnapshot2] = useState(false);
    const [isAnalyzingMulti, setIsAnalyzingMulti] = useState(false);
    const [autoCaptureInterval1, setAutoCaptureInterval1] = useState(null);
    const [autoCaptureInterval2, setAutoCaptureInterval2] = useState(null);
    const [nextScreenshotEndTime1, setNextScreenshotEndTime1] = useState(null);
    const [nextScreenshotEndTime2, setNextScreenshotEndTime2] = useState(null);
    const [shouldAutoAnalyzeMulti, setShouldAutoAnalyzeMulti] = useState(false);

    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Upload mode
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploadPreviews, setUploadPreviews] = useState([]);
    const [isAnalyzingUpload, setIsAnalyzingUpload] = useState(false);
    const uploadInputRef = useRef(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [pendingDeleteHistory, setPendingDeleteHistory] = useState(null);
    const [showTabSwitchConfirm, setShowTabSwitchConfirm] = useState(false);
    const [pendingTab, setPendingTab] = useState(null);
    const [isDesktop, setIsDesktop] = useState(true);
    const [isScreenShareSupported, setIsScreenShareSupported] = useState(true);

    const videoRef = useRef(null);
    const videoRef2 = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const check = () => {
            const userAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
            const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(userAgent) ||
                (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 2 && /Macintosh/i.test(userAgent));
            
            const hasDisplayMedia = typeof navigator !== 'undefined' &&
                !!navigator.mediaDevices &&
                typeof navigator.mediaDevices.getDisplayMedia === 'function';

            setIsDesktop(window.innerWidth >= 1024 && !isMobile);
            setIsScreenShareSupported(hasDisplayMedia && !isMobile);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (error) {
            toast.dismiss();
            toast.error(error);
            setError(null);
        }
    }, [error]);

    const normalizeHistory = (payload) => {
        const list = Array.isArray(payload) ? payload : (payload?.data || payload?.items || []);
        return (Array.isArray(list) ? list : []).map((item, idx) => {
            const ts = item?.created_at || item?.createdAt || item?.timestamp || item?.time || item?.date || new Date().toISOString();
            const trades = extractTradesFromPayload(item);
            return {
                id: item?.id || item?.analysis_id || item?.history_id || ts || idx,
                deleteId: item?.id || item?.analysis_id || item?.history_id || null,
                timestamp: ts,
                data: trades,
            };
        });
    };

    const openHistory = async () => {
        const userId = getUserId();
        if (!userId) {
            setError('User not found. Please login again.');
            return;
        }
        setHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const res = await tradeSnapApi.getAnalysisHistory(userId);
            let rawList = Array.isArray(res) ? res : (res?.data || res?.items || []);
            rawList = rawList.filter(item => item?.is_delete !== true);
            setHistoryItems(normalizeHistory(rawList));
        } catch (e) {
            setError(e?.message || 'Failed to load history');
            setHistoryItems([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const requestDeleteHistory = (item) => {
        setPendingDeleteHistory(item);
        setConfirmDeleteOpen(true);
        setHistoryOpen(false);
    };

    const closeDeleteHistoryModal = () => {
        setConfirmDeleteOpen(false);
        setPendingDeleteHistory(null);
    };

    const confirmDeleteHistory = async () => {
        if (!pendingDeleteHistory) return;
        if (!pendingDeleteHistory.deleteId) {
            toast.error('Unable to delete this history item.');
            closeDeleteHistoryModal();
            return;
        }

        const userId = getUserId();
        if (!userId) {
            toast.error('User not found. Please login again.');
            closeDeleteHistoryModal();
            return;
        }

        try {
            await historyDeletes.deleteAnalysisHistoryItem({
                userId,
                id: pendingDeleteHistory.deleteId,
            });
            setHistoryItems((prev) => prev.filter((item) => item.id !== pendingDeleteHistory.id));
            toast.success('History deleted successfully.');
        } catch (e) {
            toast.error(e?.message || 'Failed to delete history item.');
        } finally {
            closeDeleteHistoryModal();
        }
    };

    const stopScreenShare = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            setStream(null);
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsSharing(false);
        setCapturedImage(null);
        // Multi: ensure old lower timeframe snapshot never lingers
        setCapturedImage1(null);
        setShowSnapshot1(false);
        setAutoCaptureInterval1(null);
        setNextScreenshotEndTime1(null);
        setAllAnalyses([]);
        setShowAnalysis(false);
        setShowSnapshot(false);
        setAutoCaptureInterval(null);
        setNextScreenshotEndTime(null);
    }, [stream]);

    const startScreenShare = useCallback(async () => {
        try {
            // Clear prior captures (prevents reusing old screenshots)
            setCapturedImage(null);
            setShowSnapshot(false);
            setCapturedImage1(null);
            setShowSnapshot1(false);
            setAutoCaptureInterval(null);
            setAutoCaptureInterval1(null);
            setNextScreenshotEndTime(null);
            setNextScreenshotEndTime1(null);

            if (!isScreenShareSupported || !navigator.mediaDevices?.getDisplayMedia) {
                toast.dismiss();
                throw new Error('Screen sharing is not supported on mobile devices or in Safari on iOS. Please use desktop Chrome, Edge, or Safari on Mac.');
            }
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 60 },
                    },
                    audio: true,
                    selfBrowserSurface: 'include',
                });
            } catch (constraintErr) {
                if (constraintErr?.name === 'NotAllowedError') throw constraintErr;
                // Fallback for Safari on macOS which doesn't support selfBrowserSurface/audio in getDisplayMedia
                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                });
            }
            setStream(mediaStream);
            setIsSharing(true);
            mediaStream.getVideoTracks()[0].addEventListener('ended', stopScreenShare);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play().catch(console.error);
            }
            setTimeout(() => window.focus(), 100);
        } catch (err) {
            if (err?.name === 'NotAllowedError') {
                setError('Screen sharing permission was denied.');
            } else if (err?.name === 'NotFoundError') {
                setError('No screen sharing source was selected.');
            } else {
                setError(err?.message || 'Failed to start screen sharing');
            }
        }
    }, [stopScreenShare, isScreenShareSupported]);

    const stopScreenShare2 = useCallback(() => {
        if (stream2) {
            stream2.getTracks().forEach((t) => t.stop());
            setStream2(null);
        }
        if (videoRef2.current) videoRef2.current.srcObject = null;
        setIsSharing2(false);
        // Multi: ensure old higher timeframe snapshot never lingers
        setCapturedImage2(null);
        setShowSnapshot2(false);
        setAutoCaptureInterval2(null);
        setNextScreenshotEndTime2(null);
    }, [stream2]);

    const startScreenShare2 = useCallback(async () => {
        try {
            // Clear prior higher timeframe captures (prevents reusing old screenshots)
            setCapturedImage2(null);
            setShowSnapshot2(false);
            setAutoCaptureInterval2(null);
            setNextScreenshotEndTime2(null);

            if (!isScreenShareSupported || !navigator.mediaDevices?.getDisplayMedia) {
                toast.dismiss();
                throw new Error('Screen sharing is not supported on mobile devices or in Safari on iOS. Please use desktop Chrome, Edge, or Safari on Mac.');
            }
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 60 },
                    },
                    audio: true,
                    selfBrowserSurface: 'include',
                });
            } catch (constraintErr) {
                if (constraintErr?.name === 'NotAllowedError') throw constraintErr;
                // Fallback for Safari on macOS which doesn't support selfBrowserSurface/audio in getDisplayMedia
                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                });
            }
            setStream2(mediaStream);
            setIsSharing2(true);
            mediaStream.getVideoTracks()[0].addEventListener('ended', stopScreenShare2);
            if (videoRef2.current) {
                videoRef2.current.srcObject = mediaStream;
                videoRef2.current.play().catch(console.error);
            }
            setTimeout(() => window.focus(), 100);
        } catch (err) {
            setError(err?.message || 'Failed to start second screen share');
        }
    }, [stopScreenShare2, isScreenShareSupported]);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
        }
    }, [stream]);

    useEffect(() => {
        if (videoRef2.current && stream2) {
            videoRef2.current.srcObject = stream2;
            videoRef2.current.play().catch(console.error);
        }
    }, [stream2]);

    const captureFromVideo = useCallback((videoEl) => {
        const canvas = canvasRef.current;
        if (!videoEl || !canvas) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        canvas.width = videoEl.videoWidth || videoEl.clientWidth;
        canvas.height = videoEl.videoHeight || videoEl.clientHeight;
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png', 1.0);
    }, []);

    const captureScreenshot = useCallback(() => {
        const image = captureFromVideo(videoRef.current);
        if (!image) {
            setError('Unable to capture screenshot');
            return;
        }
        setCapturedImage(image);
        setShowSnapshot(true);
    }, [captureFromVideo]);

    const captureScreenshot1 = useCallback(() => {
        const image = captureFromVideo(videoRef.current);
        if (!image) {
            setError('Unable to capture lower timeframe screenshot');
            return;
        }
        setCapturedImage1(image);
        setShowSnapshot1(true);
    }, [captureFromVideo]);

    const captureScreenshot2 = useCallback(() => {
        const image = captureFromVideo(videoRef2.current);
        if (!image) {
            setError('Unable to capture higher timeframe screenshot');
            return;
        }
        setCapturedImage2(image);
        setShowSnapshot2(true);
    }, [captureFromVideo]);

    const pushAnalysis = (analysisData) => {
        const trades = Array.isArray(analysisData)
            ? analysisData
            : extractTradesFromPayload({ ai_response: analysisData });
        if (!trades.length) return;

        setAllAnalyses([
            { data: trades, timestamp: new Date().toISOString() },
        ]);
        setShowAnalysis(true);
    };

    const applyAnalyzeResult = (result, { onInvalidChart } = {}) => {
        const trades = extractTradesFromPayload(result);
        if (trades[0]?.error) {
            setError(trades[0].raw || 'No valid chart found in the image');
            onInvalidChart?.();
            return false;
        }
        if (!trades.length) {
            setError('No analysis data in response');
            onInvalidChart?.();
            return false;
        }
        pushAnalysis(trades);
        return true;
    };

    const analyzeImage = async () => {
        if (!capturedImage) {
            setError('No image captured');
            return;
        }
        setIsAnalyzing(true);
        try {
            const blob = await dataUrlToBlob(capturedImage);
            const result = await analyzeTradeScreenshots([blob], getUserId());
            if (applyAnalyzeResult(result, { onInvalidChart: () => setShowSnapshot(true) })) {
                setShowSnapshot(false);
            }
        } catch (err) {
            setError(err?.message || 'Failed to analyze image');
            if (err?.detail?.error_code === 'INSUFFICIENT_CREDITS' || err?.message?.toLowerCase().includes('insufficient credits')) {
                notifyCreditsUpdated(0);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const analyzeMulti = async () => {
        if (!capturedImage1 || !capturedImage2) {
            setError('Capture both timeframes before analyzing');
            return;
        }
        setIsAnalyzingMulti(true);
        try {
            const blob1 = await dataUrlToBlob(capturedImage1);
            const blob2 = await dataUrlToBlob(capturedImage2);
            const result = await analyzeTradeScreenshots([blob1, blob2], getUserId());
            if (applyAnalyzeResult(result)) {
                setShowSnapshot1(false);
                setShowSnapshot2(false);
            }
        } catch (err) {
            setError(err?.message || 'Failed to analyze images');
            if (err?.detail?.error_code === 'INSUFFICIENT_CREDITS' || err?.message?.toLowerCase().includes('insufficient credits')) {
                notifyCreditsUpdated(0);
            }
        } finally {
            setIsAnalyzingMulti(false);
        }
    };

    const handleScreenshot = () => {
        captureScreenshot();
        if (autoCaptureInterval) {
            setNextScreenshotEndTime(Date.now() + autoCaptureInterval * 60 * 1000);
        }
    };

    // Auto-capture: single
    useEffect(() => {
        if (!autoCaptureInterval || !isSharing) return;
        let lastCapture = Date.now();
        const timer = setInterval(async () => {
            if (Date.now() - lastCapture >= autoCaptureInterval * 60 * 1000) {
                captureScreenshot();
                lastCapture = Date.now();
                setNextScreenshotEndTime(Date.now() + autoCaptureInterval * 60 * 1000);
                setShouldAutoAnalyze(true);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [autoCaptureInterval, isSharing, captureScreenshot]);

    useEffect(() => {
        if (autoCaptureInterval && isSharing) {
            setNextScreenshotEndTime(Date.now() + autoCaptureInterval * 60 * 1000);
        } else {
            setNextScreenshotEndTime(null);
        }
    }, [autoCaptureInterval, isSharing]);

    useEffect(() => {
        if (shouldAutoAnalyze && capturedImage && !isAnalyzing) {
            analyzeImage();
            setShouldAutoAnalyze(false);
        }
    }, [shouldAutoAnalyze, capturedImage, isAnalyzing]);

    // Auto-capture: multi lower
    useEffect(() => {
        if (!autoCaptureInterval1 || !isSharing) return;
        let lastCapture = Date.now();
        const timer = setInterval(async () => {
            if (Date.now() - lastCapture >= autoCaptureInterval1 * 60 * 1000) {
                captureScreenshot1();
                lastCapture = Date.now();
                setNextScreenshotEndTime1(Date.now() + autoCaptureInterval1 * 60 * 1000);
                if (capturedImage2) setShouldAutoAnalyzeMulti(true);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [autoCaptureInterval1, isSharing, captureScreenshot1, capturedImage2]);

    useEffect(() => {
        if (autoCaptureInterval1 && isSharing) {
            setNextScreenshotEndTime1(Date.now() + autoCaptureInterval1 * 60 * 1000);
        } else {
            setNextScreenshotEndTime1(null);
        }
    }, [autoCaptureInterval1, isSharing]);

    // Auto-capture: multi higher
    useEffect(() => {
        if (!autoCaptureInterval2 || !isSharing2) return;
        let lastCapture = Date.now();
        const timer = setInterval(async () => {
            if (Date.now() - lastCapture >= autoCaptureInterval2 * 60 * 1000) {
                captureScreenshot2();
                lastCapture = Date.now();
                setNextScreenshotEndTime2(Date.now() + autoCaptureInterval2 * 60 * 1000);
                if (capturedImage1) setShouldAutoAnalyzeMulti(true);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [autoCaptureInterval2, isSharing2, captureScreenshot2, capturedImage1]);

    useEffect(() => {
        if (autoCaptureInterval2 && isSharing2) {
            setNextScreenshotEndTime2(Date.now() + autoCaptureInterval2 * 60 * 1000);
        } else {
            setNextScreenshotEndTime2(null);
        }
    }, [autoCaptureInterval2, isSharing2]);

    useEffect(() => {
        if (shouldAutoAnalyzeMulti && capturedImage1 && capturedImage2 && !isAnalyzingMulti) {
            analyzeMulti();
            setShouldAutoAnalyzeMulti(false);
        }
    }, [shouldAutoAnalyzeMulti, capturedImage1, capturedImage2, isAnalyzingMulti]);

    const handleUploadFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const limited = files.slice(0, 2);
        setUploadedImages(limited);
        const previews = limited.map((f) => URL.createObjectURL(f));
        setUploadPreviews(previews);
    };

    const handleUploadDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
        if (!files.length) return;
        const limited = files.slice(0, 2);
        setUploadedImages(limited);
        const previews = limited.map((f) => URL.createObjectURL(f));
        setUploadPreviews(previews);
    };

    const clearUpload = () => {
        uploadPreviews.forEach((url) => URL.revokeObjectURL(url));
        setUploadedImages([]);
        setUploadPreviews([]);
        if (uploadInputRef.current) uploadInputRef.current.value = '';
    };

    const analyzeUpload = async () => {
        if (!uploadedImages.length) {
            setError('Please upload at least one chart image');
            return;
        }
        setIsAnalyzingUpload(true);
        try {
            const result = await analyzeTradeScreenshots(uploadedImages, getUserId());
            if (applyAnalyzeResult(result)) {
                clearUpload();
            }
        } catch (err) {
            setError(err?.message || 'Failed to analyze uploaded image');
            if (err?.detail?.error_code === 'INSUFFICIENT_CREDITS' || err?.message?.toLowerCase().includes('insufficient credits')) {
                notifyCreditsUpdated(0);
            }
        } finally {
            setIsAnalyzingUpload(false);
        }
    };

    const requestTabSwitch = (tab) => {
        if ((isSharing || isSharing2) && activeTab !== tab) {
            setPendingTab(tab);
            setShowTabSwitchConfirm(true);
        } else {
            setActiveTab(tab);
        }
    };

    const confirmTabSwitch = () => {
        if (isSharing) stopScreenShare();
        if (isSharing2) stopScreenShare2();
        setCapturedImage(null);
        setCapturedImage1(null);
        setCapturedImage2(null);
        setAutoCaptureInterval(null);
        setAutoCaptureInterval1(null);
        setAutoCaptureInterval2(null);
        if (pendingTab) setActiveTab(pendingTab);
        setPendingTab(null);
        setShowTabSwitchConfirm(false);
    };

    const renderVideoPlaceholder = (sharing, loadingText) => (
        <div className={styles.videoPlaceholder}>
            <MonitorIcon className={styles.placeholderIcon} />
            <h3>
                {sharing 
                    ? loadingText 
                    : (isScreenShareSupported ? t('tradeSnap.noScreenSharing', 'No screen sharing active') : t('tradeSnap.screenShareNotSupported', 'Screen sharing not supported'))}
            </h3>
            <p>
                {sharing 
                    ? t('tradeSnap.waitScreenLoading', 'Please wait while we load your screen') 
                    : (isScreenShareSupported 
                        ? t('tradeSnap.clickStartSharing', 'Click "Start Sharing" to begin') 
                        : t('tradeSnap.desktopRequiredDesc', 'Screen sharing is not supported on mobile Safari or iOS devices. Please open on desktop Chrome, Edge, or Mac Safari.'))}
            </p>
        </div>
    );

    const renderAutoCaptureSelect = (id, value, onChange, options) => (
        <div className={styles.autoCapture}>
            <CameraIcon />
            <label htmlFor={id}>{t('tradeSnap.autoCapture', 'Auto Capture')}</label>
            <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
                {options.map((o) => (
                    <option key={o.value || 'off'} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );

    if (!isDesktop) {
        return (
            <div className={styles.tradeSnap}>
                <div className={styles.mobileNotice}>
                    <motion.div
                        className={styles.mobileCard}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.mobileIconWrap}>
                            <MonitorIcon className={styles.mobileMonitor} />
                        </div>
                        <h3>{t('tradeSnap.desktopViewRequired', 'Desktop View Required')}</h3>
                        <p>
                            {t('tradeSnap.mobileNoticeText', 'AI Trade uses screen sharing and requires a desktop or laptop computer with Chrome, Edge, or macOS Safari. Screen sharing is not supported on mobile devices or iOS Safari.')}
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.tradeSnap}>
            <div className={styles.title}>
                <div className={styles.titleRow}>
                    <div>
                        <h2>{t('nav.aiTrade', 'AI Trade')}</h2>
                        <p>
                            {t('tradeSnap.subtitle', 'Capture your screen, analyze chart movements, and get AI trade insights with single or multi-timeframe views.')}
                        </p>
                    </div>
                    <HistoryButton
                        text={t('tradeSnap.history', 'History')}
                        onClick={openHistory}
                    />
                </div>
            </div>

            <canvas ref={canvasRef} className={styles.hiddenCanvas} aria-hidden="true" />

            <div className={styles.tabSwitcher}>
                <button
                    type="button"
                    className={activeTab === 'single' ? styles.tabActive : ''}
                    onClick={() => requestTabSwitch('single')}
                >
                    <MonitorIcon />
                    {t('tradeSnap.singleTimeframe', 'Single Timeframe')}
                </button>
                <button
                    type="button"
                    className={activeTab === 'multi' ? styles.tabActive : ''}
                    onClick={() => requestTabSwitch('multi')}
                >
                    <ChartIcon />
                    {t('tradeSnap.multiTimeframe', 'Multi Timeframe')}
                </button>

            </div>

            <div className={`${styles.workspace} ${activeTab === 'multi' ? styles.workspaceMulti : ''}`}>
                <div className={styles.mainColumn}>
                    {activeTab === 'single' ? (
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h3>
                                    {isSharing ? (
                                        <>
                                            <LiveIcon />
                                            {t('tradeSnap.liveScreenShare', 'Live Screen Share')}
                                        </>
                                    ) : (
                                        <>
                                            <MonitorOffIcon />
                                            {t('tradeSnap.screenPreview', 'Screen Preview')}
                                        </>
                                    )}
                                </h3>
                                {isSharing &&
                                    renderAutoCaptureSelect(
                                        'auto-capture-single',
                                        autoCaptureInterval,
                                        setAutoCaptureInterval,
                                        AUTO_CAPTURE_OPTIONS
                                    )}
                            </div>
                            <div className={styles.videoFrame}>
                                {isSharing && stream ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className={styles.video}
                                        onLoadedMetadata={() => videoRef.current?.play().catch(console.error)}
                                    />
                                ) : (
                                    renderVideoPlaceholder(isSharing, t('tradeSnap.loadingScreenShare', 'Loading screen share...'))
                                )}
                            </div>
                            <div className={styles.panelActions}>
                                {isSharing ? (
                                    <>
                                        <button type="button" className={styles.btnDanger} onClick={stopScreenShare}>
                                            <StopIcon />
                                            Stop Sharing
                                        </button>
                                        {autoCaptureInterval ? (
                                            <NextScreenshotTimer
                                                intervalMinutes={autoCaptureInterval}
                                                isActive={isSharing}
                                                endTime={nextScreenshotEndTime}
                                            />
                                        ) : (
                                            <button type="button" className={styles.btnPrimary} onClick={handleScreenshot}>
                                                <CameraIcon />
                                                {t('tradeSnap.captureScreenshot', 'Capture Screenshot')}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button type="button" className={styles.btnPrimaryWide} onClick={startScreenShare}>
                                        <PlayIcon />
                                        {t('tradeSnap.startSharing', 'Start Sharing')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.multiGrid}>
                            <div className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <h3>
                                        {isSharing ? (
                                            <span className={styles.liveDot}>{t('tradeSnap.lowerTimeframe', 'Lower Timeframe')}</span>
                                        ) : (
                                            <>
                                                <MonitorOffIcon />
                                                {t('tradeSnap.lowerTimeframe', 'Lower Timeframe')}
                                            </>
                                        )}
                                    </h3>
                                    {isSharing &&
                                        renderAutoCaptureSelect(
                                            'auto-capture-1',
                                            autoCaptureInterval1,
                                            (v) => {
                                                setAutoCaptureInterval1(v);
                                                if (v) captureScreenshot1();
                                            },
                                            AUTO_CAPTURE_OPTIONS_MULTI_LOW
                                        )}
                                </div>
                                <div className={styles.videoFrame}>
                                    {isSharing && stream ? (
                                        <video ref={videoRef} autoPlay muted playsInline className={styles.video} />
                                    ) : (
                                        renderVideoPlaceholder(false, '')
                                    )}
                                </div>
                                <div className={styles.panelActions}>
                                    {isSharing ? (
                                        <>
                                            <button type="button" className={styles.btnDanger} onClick={stopScreenShare}>
                                                <StopIcon />
                                                {t('tradeSnap.stop', 'Stop')}
                                            </button>
                                            {autoCaptureInterval1 ? (
                                                <NextScreenshotTimer
                                                    intervalMinutes={autoCaptureInterval1}
                                                    isActive={isSharing}
                                                    endTime={nextScreenshotEndTime1}
                                                />
                                            ) : (
                                                <button type="button" className={styles.btnPrimary} onClick={captureScreenshot1}>
                                                    <CameraIcon />
                                                    {t('tradeSnap.capture', 'Capture')}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <button type="button" className={styles.btnPrimary} onClick={startScreenShare}>
                                            <PlayIcon />
                                            {t('tradeSnap.startSharing', 'Start Sharing')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <h3>
                                        {isSharing2 ? (
                                            <span className={styles.liveDot}>{t('tradeSnap.higherTimeframe', 'Higher Timeframe')}</span>
                                        ) : (
                                            <>
                                                <MonitorOffIcon />
                                                {t('tradeSnap.higherTimeframe', 'Higher Timeframe')}
                                            </>
                                        )}
                                    </h3>
                                    {isSharing2 &&
                                        renderAutoCaptureSelect(
                                            'auto-capture-2',
                                            autoCaptureInterval2,
                                            (v) => {
                                                setAutoCaptureInterval2(v);
                                                if (v) captureScreenshot2();
                                            },
                                            AUTO_CAPTURE_OPTIONS_MULTI_LOW
                                        )}
                                </div>
                                <div className={styles.videoFrame}>
                                    {isSharing2 && stream2 ? (
                                        <video ref={videoRef2} autoPlay muted playsInline className={styles.video} />
                                    ) : (
                                        renderVideoPlaceholder(false, '')
                                    )}
                                </div>
                                <div className={styles.panelActions}>
                                    {isSharing2 ? (
                                        <>
                                            <button type="button" className={styles.btnDanger} onClick={stopScreenShare2}>
                                                <StopIcon />
                                                {t('tradeSnap.stop', 'Stop')}
                                            </button>
                                            {autoCaptureInterval2 ? (
                                                <NextScreenshotTimer
                                                    intervalMinutes={autoCaptureInterval2}
                                                    isActive={isSharing2}
                                                    endTime={nextScreenshotEndTime2}
                                                />
                                            ) : (
                                                <button type="button" className={styles.btnPrimary} onClick={captureScreenshot2}>
                                                    <CameraIcon />
                                                    {t('tradeSnap.capture', 'Capture')}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <button type="button" className={styles.btnPrimary} onClick={startScreenShare2}>
                                            <PlayIcon />
                                            {t('tradeSnap.startSharing', 'Start Sharing')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {(isSharing || isSharing2) && (showSnapshot1 || showSnapshot2) && (
                                <div className={`${styles.panel} ${styles.snapshotPanel}`}>
                                    <div className={styles.snapshotHeader}>
                                        <h3>
                                            <CameraIcon />
                                            {t('tradeSnap.latestSnapshot', 'Latest Timeframe Snapshot')}
                                        </h3>
                                        <button
                                            type="button"
                                            className={styles.btnAnalyze}
                                            onClick={analyzeMulti}
                                            disabled={isAnalyzingMulti || !capturedImage1 || !capturedImage2}
                                        >
                                            {isAnalyzingMulti ? t('tradeSnap.analyzing', 'Analyzing...') : t('tradeSnap.analyze', 'Analyze')}
                                        </button>
                                    </div>
                                    <div className={styles.dualSnapshot}>
                                        <div>
                                            {capturedImage1 ? (
                                                <img src={capturedImage1} alt="Lower timeframe" />
                                            ) : (
                                                <div className={styles.snapshotEmpty}>{t('tradeSnap.captureLowerTimeframe', 'Capture lower timeframe')}</div>
                                            )}
                                        </div>
                                        <div>
                                            {capturedImage2 ? (
                                                <img src={capturedImage2} alt="Higher timeframe" />
                                            ) : (
                                                <div className={styles.snapshotEmpty}>{t('tradeSnap.captureHigherTimeframe', 'Capture higher timeframe')}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {activeTab === 'single' && isSharing && showSnapshot && (
                    <div className={styles.sideColumn}>
                        <div className={styles.panel}>
                            <div className={styles.snapshotHeader}>
                                <h3>
                                    <CameraIcon />
                                    Latest Snapshot
                                </h3>
                                <button
                                    type="button"
                                    className={styles.btnAnalyze}
                                    onClick={analyzeImage}
                                    disabled={isAnalyzing || !capturedImage}
                                >
                                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                                </button>
                            </div>
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captured screenshot" className={styles.snapshotImg} />
                            ) : (
                                <div className={styles.snapshotEmpty}>Capture a screenshot to analyze</div>
                            )}
                        </div>
                    </div>
                )}

                {(showAnalysis || allAnalyses.length > 0) && (
                    <div className={styles.resultsColumn}>
                        <div className={styles.resultsPanel}>
                            <div className={styles.resultsHeader}>
                                <h3>Analysis Results</h3>
                            </div>
                            <div className={styles.resultsBody}>
                                {isAnalyzing && (
                                    <div className={styles.spinnerWrap}>
                                        <Loader centered />
                                    </div>
                                )}
                                {allAnalyses.map((analysis, analysisIndex) => {
                                    const formatted = new Date(analysis.timestamp).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                    });
                                    return (
                                        <div key={`history-${analysisIndex}`} className={styles.historyGroup}>
                                            <div className={styles.historyTime}>
                                                <ClockIcon />
                                                Analysis at {formatted}
                                            </div>
                                            {analysis.data.map((trade, tradeIndex) => (
                                                <AnalysisResultItem
                                                    key={`trade-${analysisIndex}-${tradeIndex}`}
                                                    trade={trade}
                                                    index={tradeIndex}
                                                    onViewDetails={(t) => {
                                                        setSelectedAnalysis(t);
                                                        setIsDetailModalOpen(true);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                open={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Analysis Details"
                description="Detailed analysis of the selected trade"
            >
                {selectedAnalysis?.risk_reward && selectedAnalysis.risk_reward !== 'N/A' && (
                    <div className={styles.riskReward}>
                        <span>Risk/Reward</span>
                        <strong>{selectedAnalysis.risk_reward}</strong>
                    </div>
                )}
                {selectedAnalysis?.rationale && (
                    <div className={styles.rationale}>
                        <h4>Analysis</h4>
                        <p>{selectedAnalysis.rationale}</p>
                    </div>
                )}
                {selectedAnalysis?.entry?.includes('(') && (
                    <p className={styles.entryNote}>{selectedAnalysis.entry.match(/\(([^)]+)\)/)?.[1]}</p>
                )}
            </Modal>

            <Modal
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                title={t('tradeSnap.historyTitle', 'AI Trade History')}
                description={t('tradeSnap.historyDesc', 'Your past AI Trade analyses')}
                footer={
                    <button type="button" className={styles.btnGhost} onClick={() => setHistoryOpen(false)}>
                        {t('common.close', 'Close')}
                    </button>
                }
            >
                {historyLoading ? (
                    <Loader centered />
                ) : historyItems.length === 0 ? (
                    <div {...getBidiProps(t('tradeSnap.noHistoryYet', 'No history yet.'), styles.recentEmpty)}>
                        {t('tradeSnap.noHistoryYet', 'No history yet.')}
                    </div>
                ) : (
                    <div className={styles.historyList}>
                        {historyItems.map((h, i) => {
                            const formatted = new Date(h.timestamp).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                            });
                            return (
                                <div key={`${h.id}-${i}`} className={styles.historyGroup}>
                                    <div className={styles.historyTime}>
                                        <ClockIcon /> {formatted}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 10 }}>
                                        <button
                                            type="button"
                                            className={styles.btnDanger}
                                            onClick={() => requestDeleteHistory(h)}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.btnSecondary}
                                            onClick={() => {
                                                // load this history into results view
                                                setAllAnalyses([{ data: h.data, timestamp: h.timestamp }]);
                                                setShowAnalysis(true);
                                                setHistoryOpen(false);
                                            }}
                                        >
                                            Open
                                        </button>
                                    </div>
                                    {h.data.map((trade, idx) => (
                                        <AnalysisResultItem
                                            key={`${h.id}-trade-${idx}`}
                                            trade={trade}
                                            index={idx}
                                            onViewDetails={(t) => {
                                                setSelectedAnalysis(t);
                                                setIsDetailModalOpen(true);
                                                setHistoryOpen(false);
                                            }}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>

            <Modal
                open={confirmDeleteOpen}
                onClose={closeDeleteHistoryModal}
                title="Delete analysis history?"
                description="This action cannot be undone."
                footer={
                    <>
                        <button type="button" className={styles.btnGhost} onClick={closeDeleteHistoryModal}>
                            Cancel
                        </button>
                        <button type="button" className={styles.btnDanger} onClick={confirmDeleteHistory}>
                            Delete
                        </button>
                    </>
                }
            >
                <div className={styles.recentEmpty}>
                    Are you sure you want to delete this history item?
                </div>
            </Modal>

            <Modal
                open={showTabSwitchConfirm}
                onClose={() => {
                    setShowTabSwitchConfirm(false);
                    setPendingTab(null);
                }}
                title="Switch mode?"
                description="Switching tabs will stop all active screen sharing. Continue?"
                footer={
                    <>
                        <button
                            type="button"
                            className={styles.btnGhost}
                            onClick={() => {
                                setShowTabSwitchConfirm(false);
                                setPendingTab(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button type="button" className={styles.btnPrimary} onClick={confirmTabSwitch}>
                            Yes, Switch
                        </button>
                    </>
                }
            />
        </div>
    );
}
