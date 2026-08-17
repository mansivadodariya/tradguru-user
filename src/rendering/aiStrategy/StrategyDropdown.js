'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './aiStrategy.module.scss';
import { useLanguage } from '@/context/LanguageContext';

function ChevronDownIcon({ className, ...props }) {
    return (
        <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
            {...props}
        >
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    );
}

export default function StrategyDropdown({ strategies: propStrategies = [], selectedStrategyId, onSelect, loading: propLoading = false }) {
    const { t } = useLanguage();
    const [strategies, setStrategies] = useState(propStrategies);
    const [loading, setLoading] = useState(propLoading);
    const [selectedId, setSelectedId] = useState(selectedStrategyId || '');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const initialSelectFiredRef = useRef(false);

    useEffect(() => {
        if (selectedStrategyId && selectedStrategyId !== selectedId) {
            setSelectedId(selectedStrategyId);
        }
    }, [selectedStrategyId]);

    useEffect(() => {
        if (propStrategies && propStrategies.length > 0) {
            setStrategies(propStrategies);
            setLoading(false);
            if (!selectedId) {
                const firstId = propStrategies[0].id || propStrategies[0].strategy_id;
                setSelectedId(firstId);
                if (onSelect && !initialSelectFiredRef.current) {
                    initialSelectFiredRef.current = true;
                    onSelect(firstId);
                }
            }
            return;
        }

        async function fetchStrategies() {
            setLoading(true);
            try {
                const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.thetradermaster.com').replace(/\/+$/, '');
                const res = await fetch(`${backendUrl}/api/v1/chart/strategies`, {
                    headers: { 
                        'accept': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch strategies');
                const data = await res.json();
                
                // Handle various response wrappers
                const list = Array.isArray(data) ? data : (data.strategies || data.data || []);
                setStrategies(list);
                if (list.length > 0) {
                    const firstId = list[0].id || list[0].strategy_id;
                    setSelectedId(prev => prev || firstId);
                    if (onSelect && !initialSelectFiredRef.current) {
                        initialSelectFiredRef.current = true;
                        onSelect(firstId);
                    }
                }
            } catch (err) {
                console.error("Error fetching strategies:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStrategies();
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectOption = (id) => {
        setSelectedId(id);
        setIsOpen(false);
        if (onSelect) {
            onSelect(id);
        }
    };

    const selectedStrategy = strategies.find(st => (st.id || st.strategy_id) === selectedId);
    const selectedLabel = selectedStrategy 
        ? (selectedStrategy.name || selectedStrategy.title || selectedStrategy.description || `Strategy ${selectedStrategy.id}`)
        : (loading ? 'Loading strategies...' : 'No Strategies Available');

    return (
        <div className={styles.strategyDropdownContainer} ref={dropdownRef}>
            <bdi className={styles.dropdownLabel}>{t('aiStrategy.activeStrategyLabel', 'Active Strategy:')}</bdi>
            
            <div className={styles.customSelectWrapper}>
                <button
                    type="button"
                    className={styles.customSelectTrigger}
                    onClick={() => !loading && strategies.length > 0 && setIsOpen(!isOpen)}
                    disabled={loading || strategies.length === 0}
                >
                    <span className={styles.selectedText}>{selectedLabel}</span>
                    <ChevronDownIcon className={`${styles.chevronIcon} ${isOpen ? styles.chevronRotated : ''}`} />
                </button>

                {isOpen && strategies.length > 0 && (
                    <div className={styles.customDropdownMenu}>
                        {strategies.map((st) => {
                            const optionId = st.id || st.strategy_id;
                            const optionLabel = st.name || st.title || st.description || `Strategy ${st.id}`;
                            const isSelected = optionId === selectedId;
                            
                            return (
                                <button
                                    key={optionId}
                                    type="button"
                                    className={`${styles.customDropdownItem} ${isSelected ? styles.itemSelected : ''}`}
                                    onClick={() => handleSelectOption(optionId)}
                                >
                                    <span>{optionLabel}</span>
                                    {isSelected && <span className={styles.checkmarkIcon}>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
                
            </div>
        </div>
    );
}
