'use client';
import React from 'react';
import { motion } from 'framer-motion';
import styles from './historyButton.module.scss';

export default function HistoryButton({ text, onClick, icon, className = '', type = 'button' }) {
    return (
        <motion.button
            type={type}
            className={`${styles.historyBtn} ${className}`}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
        >
            {icon ? (
                icon
            ) : (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
            )}
            <span>{text}</span>
        </motion.button>
    );
}
