'use client';

import React, { useState, useEffect } from 'react';
import styles from './aiStrategy.module.scss';

export default function StrategyDropdown({ onSelect }) {
    const [strategies, setStrategies] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStrategies() {
            try {
                const res = await fetch('/api/v1/chart/strategies', {
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
            } catch (err) {
                console.error("Error fetching strategies:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStrategies();
    }, []);

    const handleChange = (e) => {
        const id = e.target.value;
        setSelectedId(id);
        if (onSelect) {
            onSelect(id);
        }
    };

    return (
        <div className={styles.strategyDropdownContainer}>
            <label htmlFor="strategy-select" className={styles.dropdownLabel}>Active Strategy:</label>
            <div className={styles.selectWrapper}>
                <select
                    id="strategy-select"
                    value={selectedId}
                    onChange={handleChange}
                    disabled={loading}
                    className={styles.dropdownSelect}
                >
                    <option value="">No Strategy (Raw Chart)</option>
                    {strategies.map((st) => (
                        <option key={st.id || st.strategy_id} value={st.id || st.strategy_id}>
                            {st.name || st.title || st.description || `Strategy ${st.id}`}
                        </option>
                    ))}
                </select>
                {loading && <div className={styles.dropdownSpinner} />}
            </div>
        </div>
    );
}
