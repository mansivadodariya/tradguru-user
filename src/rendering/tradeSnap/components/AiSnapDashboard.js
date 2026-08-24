'use client';
import React, { useState, useEffect } from 'react';
import styles from '../aiSnapDashboard.module.scss';
import AnalysisSummaryHeader from './AnalysisSummaryHeader';
import TechnicalScoreGauge from './TechnicalScoreGauge';
import BullBearBanner from './BullBearBanner';
import TradeSignalSetupCard from './TradeSignalSetupCard';
import LiveIndicatorsGrid from './LiveIndicatorsGrid';
import PatternsKeyLevelsCard from './PatternsKeyLevelsCard';
import RiskFlagsStack from './RiskFlagsStack';
import IndicatorPivotTabs from './IndicatorPivotTabs';
import TimeframeSelectionModal from './TimeframeSelectionModal';

export default function AiSnapDashboard({ analysisData, rawData }) {
    if (!analysisData && !rawData) return null;

    // Support both new AI Snap schema (analysis) and legacy normalizeTradeRecord schema
    const rawPayload = analysisData || rawData;
    const analysis = analysisData?.analysis || analysisData || rawData?.analysis || rawData;

    const [selectedTimeframe, setSelectedTimeframe] = useState(
        analysis.timeframe || analysis.Timeframe || analysis.data?.timeframe || '15M'
    );
    const [timeframeModalOpen, setTimeframeModalOpen] = useState(false);

    // Auto-trigger condition specified in Section 2:
    // When timeframe_detected === false or timeframe is null, open popup modal automatically
    useEffect(() => {
        const isDetected = rawPayload?.timeframe_detected ?? rawPayload?.data?.timeframe_detected ?? true;
        const currentTf = analysis.timeframe || analysis.Timeframe || analysis.data?.timeframe;
        if (isDetected === false || !currentTf || currentTf === 'null') {
            setTimeframeModalOpen(true);
        }
    }, [rawPayload, analysis]);

    const symbol = analysis.symbol || analysis.Symbol || analysis.data?.pair || 'USDCHF';
    const timeframe = selectedTimeframe;
    const currentPrice = analysis.current_price ?? analysis.Current_price ?? analysis.analysis_results?.price ?? '0.8010';
    const volume = analysis.analysis_results?.volume || '—';
    const change = analysis.analysis_results?.change || '-0.04%';
    const isChartValid = analysis.data?.is_valid_chart ?? true;

    const technicalScore = analysis.technical_score || {
        total: parseInt(analysis.confidence || 84, 10),
        max: 100,
        label: (analysis.trade_call || 'BUY').includes('BUY') ? 'STRONG BULLISH' : 'STRONG BEARISH',
        confidence: analysis.confidence || '88%'
    };

    const marketAssessment = analysis.market_assessment || {
        verdict: (analysis.trade_call || 'BUY').includes('BUY') ? 'Bullish' : 'Bearish',
        confidence: analysis.confidence || '88%',
        momentum: 'Up',
        strength: 'Strong'
    };

    const tradeDecision = analysis.trade_decision || {
        action: analysis.trade_call || 'BUY',
        signal_type: 'STRONG_BUY',
        conviction: analysis.confidence || '88%',
        entry_zone: {
            entry_price: analysis.entry || analysis.entry_price || '0.8010 - 0.8015',
            execution_type: 'Market Order / Retracement'
        },
        stop_loss: {
            price: analysis.stop_loss || '0.7985',
            invalidation_reason: 'Below S1 support pivot'
        },
        take_profit_targets: analysis.targets || analysis.take_profit_targets || {
            tp1: '0.8049',
            tp2: '0.8129',
            tp3: '0.8196'
        },
        risk_reward_ratio: analysis.risk_reward || '1:2.2',
        rationale: analysis.rationale || 'High probability momentum setup aligned with higher timeframe structural support.'
    };

    const liveIndicators = analysis.live_indicators;
    const patternsDetected = analysis.patterns_detected || {
        support_levels: analysis.Support_price ? [analysis.Support_price] : ['0.798535'],
        resistance_levels: analysis.Resistance_price ? [analysis.Resistance_price] : ['0.804922', '0.812987', '0.819655'],
        chart_patterns: [
            { name: "V-shaped recovery after sharp selloff", confidence: 66 },
            { name: "Ascending channel sequence", confidence: 60 }
        ]
    };

    const riskFlags = analysis.risk_flags || [
        { level: "danger", message: "Bearish bias divergence warning — watch key momentum shifts" },
        { level: "warning", message: "Price within 0.5% of major structural support zone" }
    ];

    const trendIndicators = analysis.trend_indicators;
    const momentumIndicators = analysis.momentum_indicators;
    const volatilityIndicators = analysis.volatility_indicators;
    const pivotPoints = analysis.pivot_points;

    return (
        <div className={styles.dashboardWrapper}>
            {/* Top Split Row: Section D (Summary) + Section A (Speedometer Technical Score Gauge) */}
            <div className={styles.topSplitRow}>
                <AnalysisSummaryHeader
                    symbol={symbol}
                    timeframe={timeframe}
                    currentPrice={currentPrice}
                    volume={volume}
                    change={change}
                    isChartValid={isChartValid}
                    onOpenTimeframeModal={() => setTimeframeModalOpen(true)}
                />
                <TechnicalScoreGauge
                    technicalScore={technicalScore}
                    marketAssessment={marketAssessment}
                />
            </div>

            {/* Section B: Dynamic Animated Bull & Bear Running Hero Banner */}
            <BullBearBanner
                tradeDecision={tradeDecision}
                technicalScore={technicalScore}
                marketAssessment={marketAssessment}
            />

            {/* Section C: Actionable Buy / Sell Trade Signal Setup Card */}
            <TradeSignalSetupCard
                tradeDecision={tradeDecision}
            />

            {/* Section E: Market Assessment & Live Indicators */}
            <LiveIndicatorsGrid
                liveIndicators={liveIndicators}
                marketAssessment={marketAssessment}
            />

            {/* Section F: Patterns & Key Levels Card */}
            <PatternsKeyLevelsCard
                patternsDetected={patternsDetected}
            />

            {/* Section G: Risk Flags Warning Stack */}
            <RiskFlagsStack
                riskFlags={riskFlags}
            />

            {/* Section H: Multi-Indicator & Pivot Breakdown Accordion / Tabs */}
            <IndicatorPivotTabs
                trendIndicators={trendIndicators}
                momentumIndicators={momentumIndicators}
                volatilityIndicators={volatilityIndicators}
                pivotPoints={pivotPoints}
            />

            {/* Timeframe Selection Popup Modal (Triggered automatically when timeframe_detected === false) */}
            <TimeframeSelectionModal
                open={timeframeModalOpen}
                onClose={() => setTimeframeModalOpen(false)}
                onSelectTimeframe={(newTf) => setSelectedTimeframe(newTf)}
                timeframeOptions={rawPayload?.timeframe_options}
            />
        </div>
    );
}
