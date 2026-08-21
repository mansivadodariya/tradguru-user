'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from '../aiAssistant.module.scss';
import { bidiMarkdownComponents } from '@/lib/bidi';

// Status Badge Component with theme styling
function Badge({ text, color = "amber" }) {
    if (!text) return null;
    const colorClass = 
        color === "green" ? styles.badgeGreen :
        color === "red" ? styles.badgeRed :
        color === "blue" ? styles.badgeBlue :
        color === "slate" ? styles.badgeSlate :
        styles.badgeAmber;

    return (
        <span className={`${styles.visionBadge} ${colorClass}`}>
            {text}
        </span>
    );
}

// 1. Accordion Schema Configuration
export const ACCORDION_SECTIONS = [
    { key: "overall_trend", title: "Overall Trend", icon: "📈" },
    { key: "market_structure", title: "Market Structure", icon: "🧱" },
    { key: "support_and_resistance", title: "Support & Resistance Levels", icon: "📊" },
    { key: "supply_and_demand_zones", title: "Supply & Demand Zones", icon: "⚡" },
    { key: "trader_actionable_zones", title: "Trader Actionable Zones", icon: "🎯" },
    { key: "volatility_and_price_behavior", title: "Volatility & Price Behavior", icon: "📉" },
    { key: "session_behavior", title: "Session Behavior", icon: "🕒" },
    { key: "market_mood", title: "Market Mood", icon: "😃" },
    { key: "candlestick_behavior", title: "Candlestick Behavior", icon: "🕯️" },
    { key: "chart_patterns", title: "Chart Patterns", icon: "📐" }
];

export default function VisionAnalysisAccordions({ chartSections, textSummary, imageWarning }) {
    // Keep first accordion open by default
    const [openKey, setOpenKey] = useState("overall_trend");

    if (!chartSections || typeof chartSections !== "object") return null;

    const toggleAccordion = (key) => {
        setOpenKey(prev => (prev === key ? null : key));
    };

    const renderFormattedValue = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
            return (
                <div className={styles.chatMarkdown}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                        {val}
                    </ReactMarkdown>
                </div>
            );
        }
        if (Array.isArray(val)) {
            return (
                <ul className={styles.visionList}>
                    {val.map((item, i) => (
                        <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                    ))}
                </ul>
            );
        }
        if (typeof val === 'object') {
            return (
                <div className={styles.visionObjectGrid}>
                    {Object.entries(val).map(([k, v]) => (
                        <div key={k} className={styles.visionFieldRow}>
                            <span className={styles.visionFieldKey}>
                                {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span className={styles.visionFieldValue}>
                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span>{String(val)}</span>;
    };

    // Render Specific Section Contents
    const renderSectionContent = (key, sectionData) => {
        if (typeof sectionData === 'string') {
            return (
                <div className={styles.chatMarkdown}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                        {sectionData}
                    </ReactMarkdown>
                </div>
            );
        }

        switch (key) {
            case 'overall_trend':
                return (
                    <div className={styles.visionSectionDetails}>
                        <div className={styles.visionBadgesRow}>
                            <Badge text={sectionData.trend_type || "Ranging"} color={String(sectionData.trend_type).toLowerCase().includes('bull') ? 'green' : String(sectionData.trend_type).toLowerCase().includes('bear') ? 'red' : 'amber'} />
                            <Badge text={`Strength : ${sectionData.trend_strength || "Indecisive"}`} color="slate" />
                        </div>
                        {sectionData.description && (
                            <p className={styles.visionDescText}>{sectionData.description}</p>
                        )}
                        {sectionData.key_observation && (
                            <p className={styles.visionObservationText}>
                                <strong>Observation:</strong> {sectionData.key_observation}
                            </p>
                        )}
                    </div>
                );

            case 'market_structure':
                const swing = sectionData.swing_sequence || {};
                return (
                    <div className={styles.visionSectionDetails}>
                        {sectionData.structure_state && (
                            <div className={styles.visionBadgesRow}>
                                <Badge text={sectionData.structure_state} color="amber" />
                            </div>
                        )}
                        <div className={styles.visionSwingGrid}>
                            <div className={styles.visionSwingBox}>
                                <span className={styles.visionSwingLabel}>Swing High :</span>
                                <Badge text={swing.recent_swing_high || sectionData.recent_swing_high || "Unreadable From Chart"} color="red" />
                            </div>
                            <div className={styles.visionSwingBox}>
                                <span className={styles.visionSwingLabel}>Swing Low :</span>
                                <Badge text={swing.recent_swing_low || sectionData.recent_swing_low || "Unreadable From Chart"} color="green" />
                            </div>
                        </div>
                        {(swing.higher_high_lower_high_pattern || sectionData.pattern) && (
                            <p className={styles.visionPatternText}>
                                <strong>Pattern :</strong> {swing.higher_high_lower_high_pattern || sectionData.pattern}
                            </p>
                        )}
                        {sectionData.description && (
                            <p className={styles.visionDescText}>{sectionData.description}</p>
                        )}
                    </div>
                );

            case 'support_and_resistance':
                const supports = sectionData.support_levels || [];
                const resistances = sectionData.resistance_levels || [];
                return (
                    <div className={styles.visionSectionDetails}>
                        {/* Support Levels (Green) */}
                        {supports.length > 0 && (
                            <div className={styles.visionLevelsGroup}>
                                <h5 className={styles.visionGroupTitleGreen}>● Support Levels</h5>
                                <div className={styles.visionCardsCol}>
                                    {supports.map((sup, idx) => (
                                        <div key={idx} className={styles.visionLevelCardGreen}>
                                            {sup.interaction_history && (
                                                <p className={styles.visionLevelInfo}><strong>Interaction History :</strong> {sup.interaction_history}</p>
                                            )}
                                            {sup.observations && (
                                                <p className={styles.visionLevelInfo}><strong>Observations :</strong> {sup.observations}</p>
                                            )}
                                            <div className={styles.visionBadgesRow}>
                                                <Badge text={sup.level_description || sup.price || sup.level} color="green" />
                                                {sup.behavior_type && <Badge text={sup.behavior_type} color="green" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resistance Levels (Red) */}
                        {resistances.length > 0 && (
                            <div className={styles.visionLevelsGroup}>
                                <h5 className={styles.visionGroupTitleRed}>● Resistance Levels</h5>
                                <div className={styles.visionCardsCol}>
                                    {resistances.map((res, idx) => (
                                        <div key={idx} className={styles.visionLevelCardRed}>
                                            {res.interaction_history && (
                                                <p className={styles.visionLevelInfo}><strong>Interaction History :</strong> {res.interaction_history}</p>
                                            )}
                                            {res.observations && (
                                                <p className={styles.visionLevelInfo}><strong>Observations :</strong> {res.observations}</p>
                                            )}
                                            <div className={styles.visionBadgesRow}>
                                                <Badge text={res.level_description || res.price || res.level} color="red" />
                                                {res.behavior_type && <Badge text={res.behavior_type} color="red" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {supports.length === 0 && resistances.length === 0 && (
                            <div className={styles.visionDescText}>{renderFormattedValue(sectionData)}</div>
                        )}
                    </div>
                );

            case 'supply_and_demand_zones':
                const demands = sectionData.demand_zones || [];
                const supplies = sectionData.supply_zones || [];
                return (
                    <div className={styles.visionSectionDetails}>
                        {/* Demand Zones (Green) */}
                        {demands.length > 0 && (
                            <div className={styles.visionLevelsGroup}>
                                <h5 className={styles.visionGroupTitleGreen}>● Demand Zones</h5>
                                <div className={styles.visionCardsCol}>
                                    {demands.map((dz, idx) => (
                                        <div key={idx} className={styles.visionZoneCardGreen}>
                                            <p className={styles.visionZoneText}><strong>Zone Location Around :</strong> {dz.zone_location || dz.price_range}</p>
                                            {dz.acceptance_evidence && (
                                                <p className={styles.visionZoneText}><strong>Acceptance Evidence :</strong> {dz.acceptance_evidence}</p>
                                            )}
                                            <div className={styles.visionBadgesRow}>
                                                <Badge text={`Status : ${dz.current_status || 'Active'}`} color="green" />
                                                {dz.interaction_count && (
                                                    <span className={styles.visionCountBadge}>{dz.interaction_count} Interactions</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Supply Zones (Red) */}
                        {supplies.length > 0 && (
                            <div className={styles.visionLevelsGroup}>
                                <h5 className={styles.visionGroupTitleRed}>● Supply Zones</h5>
                                <div className={styles.visionCardsCol}>
                                    {supplies.map((sz, idx) => (
                                        <div key={idx} className={styles.visionZoneCardRed}>
                                            <p className={styles.visionZoneText}><strong>Zone Location Around :</strong> {sz.zone_location || sz.price_range}</p>
                                            {sz.rejection_evidence && (
                                                <p className={styles.visionZoneText}><strong>Rejection Evidence :</strong> {sz.rejection_evidence}</p>
                                            )}
                                            <div className={styles.visionBadgesRow}>
                                                <Badge text={`Status : ${sz.current_status || 'Active'}`} color="red" />
                                                {sz.interaction_count && (
                                                    <span className={styles.visionCountBadge}>{sz.interaction_count} Interactions</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {demands.length === 0 && supplies.length === 0 && (
                            <div className={styles.visionDescText}>{renderFormattedValue(sectionData)}</div>
                        )}
                    </div>
                );

            case 'trader_actionable_zones':
                const entry = sectionData.entry_zone || {};
                const stopLoss = sectionData.stop_loss_zone || {};
                return (
                    <div className={styles.visionSectionDetails}>
                        {entry.level_range && (
                            <div className={styles.visionActionCardGreen}>
                                <h5 className={styles.visionActionTitleGreen}>● Entry Zone : {entry.level_range}</h5>
                                {entry.trigger_condition && (
                                    <p className={styles.visionActionText}><strong>Trigger :</strong> {entry.trigger_condition}</p>
                                )}
                                {entry.confluence_factors && (
                                    <p className={styles.visionActionSub}><strong>Confluence :</strong> {entry.confluence_factors}</p>
                                )}
                            </div>
                        )}
                        {stopLoss.level && (
                            <div className={styles.visionActionCardRed}>
                                <h5 className={styles.visionActionTitleRed}>● Stop Loss : {stopLoss.level}</h5>
                                {stopLoss.invalidation_reason && (
                                    <p className={styles.visionActionText}><strong>Invalidation Reason :</strong> {stopLoss.invalidation_reason}</p>
                                )}
                            </div>
                        )}
                        {!entry.level_range && !stopLoss.level && (
                            <div className={styles.visionDescText}>{renderFormattedValue(sectionData)}</div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className={styles.visionSectionDetails}>
                        {sectionData.description && (
                            <p className={styles.visionDescText}>{sectionData.description}</p>
                        )}
                        {sectionData.summary && (
                            <p className={styles.visionSummaryText}>{sectionData.summary}</p>
                        )}
                        {Object.entries(sectionData)
                            .filter(([k]) => !['description', 'summary', 'trend_type', 'trend_strength', 'structure_state', 'overall_summary'].includes(k))
                            .map(([k, v]) => (
                                <div key={k} className={styles.visionFieldBlock}>
                                    <span className={styles.visionBlockHeading}>
                                        {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    <div className={styles.visionBlockContent}>
                                        {renderFormattedValue(v)}
                                    </div>
                                </div>
                            ))}
                    </div>
                );
        }
    };

    return (
        <div className={styles.visionAnalysisContainer}>
            {/* OPTIONAL IMAGE WARNING */}
            {imageWarning && (
                <div className={styles.visionWarningCard}>
                    <span className={styles.visionWarningIcon}>⚠️</span>
                    <span>{imageWarning}</span>
                </div>
            )}

            {/* 1. TOP SHORT EXECUTIVE SUMMARY (BULLETS) */}
            {textSummary && (
                <div className={styles.visionSummaryCard}>
                    <div className={styles.chatMarkdown}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                            {textSummary}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* 2. OVERVIEW SUMMARY TEXT */}
            {chartSections.overall_summary && (
                <div className={styles.visionOverviewCard}>
                    <p className={styles.visionOverviewText}>{chartSections.overall_summary}</p>
                </div>
            )}

            {/* 10 COLLAPSIBLE ACCORDION CARDS */}
            <div className={styles.visionAccordionList}>
                {ACCORDION_SECTIONS.map(({ key, title, icon }) => {
                    const sectionData = chartSections[key];
                    if (!sectionData) return null;

                    const isOpen = openKey === key;

                    return (
                        <div
                            key={key}
                            className={`${styles.visionAccordionCard} ${isOpen ? styles.visionAccordionOpen : ''}`}
                        >
                            {/* ACCORDION HEADER */}
                            <button
                                type="button"
                                onClick={() => toggleAccordion(key)}
                                className={styles.visionAccordionHeader}
                            >
                                <div className={styles.visionHeaderLeft}>
                                    <span className={styles.visionSectionIcon}>{icon}</span>
                                    <span className={styles.visionSectionTitle}>{title}</span>

                                    {/* OPTIONAL STATUS BADGES FOR OVERALL TREND IN HEADER */}
                                    {key === "overall_trend" && sectionData.trend_type && (
                                        <div className={styles.visionTrendBadges}>
                                            <Badge text={sectionData.trend_type} color={String(sectionData.trend_type).toLowerCase().includes('bull') ? 'green' : String(sectionData.trend_type).toLowerCase().includes('bear') ? 'red' : 'amber'} />
                                            {sectionData.trend_strength && (
                                                <Badge text={`Strength: ${sectionData.trend_strength}`} color="slate" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* EXPAND / COLLAPSE ARROW ICON */}
                                <span className={`${styles.visionChevron} ${isOpen ? styles.visionChevronOpen : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {/* ACCORDION CONTENT BODY */}
                            {isOpen && (
                                <div className={styles.visionAccordionBody}>
                                    {renderSectionContent(key, sectionData)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
