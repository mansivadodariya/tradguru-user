'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from '../aiAssistant.module.scss';
import { bidiMarkdownComponents } from '@/lib/bidi';

/**
 * Interface definition for AnalysisReportJSON
 * @typedef {Object} AnalysisReportJSON
 */

/**
 * Helper function to extract JSON object from backend text string
 * Handles strings with disclaimer headers, embedded JSON, and disclaimer footers.
 * @param {string|object} rawText
 * @returns {object|null}
 */
export function parseAnalysisReport(rawText) {
    if (!rawText) return null;
    if (typeof rawText === 'object') return rawText;
    try {
        if (typeof rawText === 'string') {
            // Find json block between disclaimer header and footer
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
    } catch (err) {
        console.error("Failed to parse chart report JSON:", err);
    }
    return null;
}

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

// 10 Collapsible Accordion Sections Configuration
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

export default function VisionAnalysisAccordions({ chartSections, textSummary, imageWarning, rawReportText }) {
    // If rawReportText is provided, parse it
    const data = chartSections || (rawReportText ? parseAnalysisReport(rawReportText) : null);
    const sections = data?.chart_sections || data;

    // Keep first available accordion open by default
    const [openKey, setOpenKey] = useState("overall_trend");

    if (!sections || typeof sections !== "object") {
        if (rawReportText) {
            return (
                <div className={styles.chatMarkdown}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={bidiMarkdownComponents}>
                        {rawReportText}
                    </ReactMarkdown>
                </div>
            );
        }
        return null;
    }

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
        if (!sectionData) return null;

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
            // 1. Overall Trend
            case 'overall_trend': {
                const trendStr = String(sectionData.trend_type || "").toLowerCase();
                const trendColor = trendStr.includes('bull') ? 'green' : trendStr.includes('bear') ? 'red' : 'amber';
                return (
                    <div className={styles.visionSectionDetails}>
                        <div className={styles.visionBadgesRow}>
                            <Badge text={sectionData.trend_type || "Ranging"} color={trendColor} />
                            {sectionData.trend_strength && (
                                <Badge text={`Strength: ${sectionData.trend_strength}`} color="slate" />
                            )}
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
            }

            // 2. Market Structure
            case 'market_structure': {
                const swing = sectionData.swing_sequence || {};
                return (
                    <div className={styles.visionSectionDetails}>
                        {sectionData.structure_state && (
                            <div className={styles.visionBadgesRow}>
                                <Badge text={sectionData.structure_state} color="amber" />
                            </div>
                        )}
                        {(swing.recent_swing_high || swing.recent_swing_low || sectionData.recent_swing_high || sectionData.recent_swing_low) && (
                            <div className={styles.visionSwingGrid}>
                                <div className={styles.visionSwingBox}>
                                    <span className={styles.visionSwingLabel}>Swing High:</span>
                                    <Badge text={swing.recent_swing_high || sectionData.recent_swing_high || "N/A"} color="red" />
                                </div>
                                <div className={styles.visionSwingBox}>
                                    <span className={styles.visionSwingLabel}>Swing Low:</span>
                                    <Badge text={swing.recent_swing_low || sectionData.recent_swing_low || "N/A"} color="green" />
                                </div>
                            </div>
                        )}
                        {(swing.higher_high_lower_high_pattern || sectionData.pattern) && (
                            <p className={styles.visionPatternText}>
                                <strong>Pattern:</strong> {swing.higher_high_lower_high_pattern || sectionData.pattern}
                            </p>
                        )}
                        {sectionData.description && (
                            <p className={styles.visionDescText}>{sectionData.description}</p>
                        )}
                    </div>
                );
            }

            // 3. Support & Resistance Levels
            case 'support_and_resistance': {
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
                                            <div className={styles.visionBadgesRow}>
                                                <Badge text={sup.level_description || sup.price || sup.level} color="green" />
                                                {sup.behavior_type && <Badge text={sup.behavior_type} color="green" />}
                                            </div>
                                            {sup.interaction_history && (
                                                <p className={styles.visionLevelInfo}><strong>Interaction History:</strong> {sup.interaction_history}</p>
                                            )}
                                            {sup.observations && (
                                                <p className={styles.visionLevelInfo}><strong>Observations:</strong> {sup.observations}</p>
                                            )}
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
                                            <div className={styles.visionBadgesRow}>
                                                <Badge text={res.level_description || res.price || res.level} color="red" />
                                                {res.behavior_type && <Badge text={res.behavior_type} color="red" />}
                                            </div>
                                            {res.interaction_history && (
                                                <p className={styles.visionLevelInfo}><strong>Interaction History:</strong> {res.interaction_history}</p>
                                            )}
                                            {res.observations && (
                                                <p className={styles.visionLevelInfo}><strong>Observations:</strong> {res.observations}</p>
                                            )}
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
            }

            // 4. Supply & Demand Zones
            case 'supply_and_demand_zones': {
                const demands = sectionData.demand_zones || [];
                const supplies = sectionData.supply_zones || [];
                const fvgs = sectionData.fair_value_gaps || [];
                return (
                    <div className={styles.visionSectionDetails}>
                        {/* Demand Zones (Green) */}
                        {demands.length > 0 && (
                            <div className={styles.visionLevelsGroup}>
                                <h5 className={styles.visionGroupTitleGreen}>● Demand Zones</h5>
                                <div className={styles.visionCardsCol}>
                                    {demands.map((dz, idx) => (
                                        <div key={idx} className={styles.visionZoneCardGreen}>
                                            <p className={styles.visionZoneText}><strong>Zone Location:</strong> {dz.zone_location || dz.price_range}</p>
                                            {dz.acceptance_evidence && (
                                                <p className={styles.visionZoneText}><strong>Acceptance Evidence:</strong> {dz.acceptance_evidence}</p>
                                            )}
                                            <div className={styles.visionBadgesRow}>
                                                <Badge text={`Status: ${dz.current_status || 'Active'}`} color="green" />
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
                                            <p className={styles.visionZoneText}><strong>Zone Location:</strong> {sz.zone_location || sz.price_range}</p>
                                            {sz.rejection_evidence && (
                                                <p className={styles.visionZoneText}><strong>Rejection Evidence:</strong> {sz.rejection_evidence}</p>
                                            )}
                                            <div className={styles.visionBadgesRow}>
                                                <Badge text={`Status: ${sz.current_status || 'Active'}`} color="red" />
                                                {sz.interaction_count && (
                                                    <span className={styles.visionCountBadge}>{sz.interaction_count} Interactions</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fair Value Gaps */}
                        {fvgs.length > 0 && (
                            <div className={styles.visionLevelsGroup}>
                                <h5 className={styles.visionGroupTitleBlue || styles.visionGroupTitleGreen}>⚡ Fair Value Gaps (FVG)</h5>
                                <div className={styles.visionCardsCol}>
                                    {fvgs.map((fvg, idx) => (
                                        <div key={idx} className={styles.visionLevelCardGreen}>
                                            <p className={styles.visionZoneText}><strong>Location:</strong> {fvg.location}</p>
                                            <div className={styles.visionBadgesRow}>
                                                {fvg.gap_direction && <Badge text={fvg.gap_direction} color="blue" />}
                                                {fvg.probable_fill_direction && <Badge text={`Fill: ${fvg.probable_fill_direction}`} color="slate" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {demands.length === 0 && supplies.length === 0 && fvgs.length === 0 && (
                            <div className={styles.visionDescText}>{renderFormattedValue(sectionData)}</div>
                        )}
                    </div>
                );
            }

            // 5. Trader Actionable Zones
            case 'trader_actionable_zones': {
                const entry = sectionData.entry_zone || {};
                const stopLoss = sectionData.stop_loss_zone || {};
                const target = sectionData.target_imbalance_zone || sectionData.target_zone || {};
                return (
                    <div className={styles.visionSectionDetails}>
                        {entry.level_range && (
                            <div className={styles.visionActionCardGreen}>
                                <h5 className={styles.visionActionTitleGreen}>● Entry Zone: {entry.level_range}</h5>
                                {entry.trigger_condition && (
                                    <p className={styles.visionActionText}><strong>Trigger Condition:</strong> {entry.trigger_condition}</p>
                                )}
                                {entry.confluence_factors && (
                                    <p className={styles.visionActionSub}><strong>Confluence Factors:</strong> {entry.confluence_factors}</p>
                                )}
                            </div>
                        )}
                        {stopLoss.level && (
                            <div className={styles.visionActionCardRed}>
                                <h5 className={styles.visionActionTitleRed}>● Stop Loss: {stopLoss.level}</h5>
                                {stopLoss.invalidation_reason && (
                                    <p className={styles.visionActionText}><strong>Invalidation Reason:</strong> {stopLoss.invalidation_reason}</p>
                                )}
                            </div>
                        )}
                        {target.level_range && (
                            <div className={styles.visionActionCardGreen} style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.05)' }}>
                                <h5 className={styles.visionActionTitleGreen} style={{ color: '#2563eb' }}>● Target Zone: {target.level_range}</h5>
                                {target.target_type && (
                                    <p className={styles.visionActionText}><strong>Target Type:</strong> {target.target_type}</p>
                                )}
                            </div>
                        )}
                        {!entry.level_range && !stopLoss.level && !target.level_range && (
                            <div className={styles.visionDescText}>{renderFormattedValue(sectionData)}</div>
                        )}
                    </div>
                );
            }

            // 6. Volatility & Price Behavior
            case 'volatility_and_price_behavior': {
                return (
                    <div className={styles.visionSectionDetails}>
                        <div className={styles.visionBadgesRow}>
                            {sectionData.volatility_state && (
                                <Badge text={`Volatility: ${sectionData.volatility_state}`} color="amber" />
                            )}
                            {sectionData.expansion_contraction_phase && (
                                <Badge text={sectionData.expansion_contraction_phase} color="blue" />
                            )}
                            {sectionData.price_movement_character && (
                                <Badge text={sectionData.price_movement_character} color="slate" />
                            )}
                        </div>
                        {sectionData.description && (
                            <p className={styles.visionDescText}>{sectionData.description}</p>
                        )}
                    </div>
                );
            }

            // 7. Session Behavior
            case 'session_behavior': {
                return (
                    <div className={styles.visionSectionDetails}>
                        {sectionData.opening_phase && (
                            <div className={styles.visionLevelCardGreen} style={{ borderColor: 'rgba(226, 232, 240, 0.9)', background: 'rgba(248, 250, 252, 0.6)' }}>
                                <p className={styles.visionLevelInfo}><strong>Opening Phase:</strong> {sectionData.opening_phase}</p>
                            </div>
                        )}
                        {sectionData.mid_session && (
                            <div className={styles.visionLevelCardGreen} style={{ borderColor: 'rgba(226, 232, 240, 0.9)', background: 'rgba(248, 250, 252, 0.6)' }}>
                                <p className={styles.visionLevelInfo}><strong>Mid Session:</strong> {sectionData.mid_session}</p>
                            </div>
                        )}
                        {sectionData.late_session && (
                            <div className={styles.visionLevelCardGreen} style={{ borderColor: 'rgba(226, 232, 240, 0.9)', background: 'rgba(248, 250, 252, 0.6)' }}>
                                <p className={styles.visionLevelInfo}><strong>Late Session:</strong> {sectionData.late_session}</p>
                            </div>
                        )}
                        {sectionData.description && (
                            <p className={styles.visionDescText}>{sectionData.description}</p>
                        )}
                    </div>
                );
            }

            // 8. Market Mood
            case 'market_mood': {
                const sentimentStr = String(sectionData.sentiment || "").toLowerCase();
                const sentimentColor = sentimentStr.includes('bull') || sentimentStr.includes('on') ? 'green' : sentimentStr.includes('bear') || sentimentStr.includes('off') ? 'red' : 'amber';
                return (
                    <div className={styles.visionSectionDetails}>
                        <div className={styles.visionBadgesRow}>
                            {sectionData.sentiment && (
                                <Badge text={`Sentiment: ${sectionData.sentiment}`} color={sentimentColor} />
                            )}
                            {sectionData.participation_behavior && (
                                <Badge text={sectionData.participation_behavior} color="slate" />
                            )}
                        </div>
                        {sectionData.description && (
                            <p className={styles.visionDescText}>{sectionData.description}</p>
                        )}
                    </div>
                );
            }

            // 9. Candlestick Behavior
            case 'candlestick_behavior': {
                const candles = Array.isArray(sectionData) ? sectionData : (sectionData.observations || [sectionData]);
                return (
                    <div className={styles.visionSectionDetails}>
                        <div className={styles.visionCardsCol}>
                            {candles.map((c, idx) => (
                                <div key={idx} className={styles.visionLevelCardGreen} style={{ borderColor: 'rgba(226, 232, 240, 0.9)', background: 'rgba(248, 250, 252, 0.6)' }}>
                                    <div className={styles.visionBadgesRow}>
                                        <Badge text={c.observation || `Candle Pattern #${idx + 1}`} color="blue" />
                                        {c.location_context && <Badge text={c.location_context} color="slate" />}
                                    </div>
                                    {c.market_participation && (
                                        <p className={styles.visionLevelInfo}><strong>Participation:</strong> {c.market_participation}</p>
                                    )}
                                    {c.structural_significance && (
                                        <p className={styles.visionLevelInfo}><strong>Significance:</strong> {c.structural_significance}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // 10. Chart Patterns
            case 'chart_patterns': {
                const patterns = Array.isArray(sectionData) ? sectionData : (sectionData.patterns || [sectionData]);
                return (
                    <div className={styles.visionSectionDetails}>
                        <div className={styles.visionCardsCol}>
                            {patterns.map((p, idx) => (
                                <div key={idx} className={styles.visionLevelCardGreen} style={{ borderColor: 'rgba(226, 232, 240, 0.9)', background: 'rgba(248, 250, 252, 0.6)' }}>
                                    <div className={styles.visionBadgesRow}>
                                        <Badge text={p.structure_description || `Pattern #${idx + 1}`} color="amber" />
                                    </div>
                                    {p.swing_composition && (
                                        <p className={styles.visionLevelInfo}><strong>Composition:</strong> {p.swing_composition}</p>
                                    )}
                                    {p.rejection_acceptance_zones && (
                                        <p className={styles.visionLevelInfo}><strong>Zones:</strong> {p.rejection_acceptance_zones}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

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
            {sections.overall_summary && (
                <div className={styles.visionOverviewCard}>
                    <p className={styles.visionOverviewText}>{sections.overall_summary}</p>
                </div>
            )}

            {/* 10 COLLAPSIBLE ACCORDION CARDS */}
            <div className={styles.visionAccordionList}>
                {ACCORDION_SECTIONS.map(({ key, title, icon }) => {
                    const sectionData = sections[key];
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

                                    {/* STATUS BADGES FOR OVERALL TREND IN HEADER */}
                                    {key === "overall_trend" && sectionData.trend_type && (
                                        <div className={styles.visionTrendBadges}>
                                            <Badge 
                                                text={sectionData.trend_type} 
                                                color={String(sectionData.trend_type).toLowerCase().includes('bull') ? 'green' : String(sectionData.trend_type).toLowerCase().includes('bear') ? 'red' : 'amber'} 
                                            />
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

// Export ChartAnalysisAccordions alias as requested
export const ChartAnalysisAccordions = VisionAnalysisAccordions;
