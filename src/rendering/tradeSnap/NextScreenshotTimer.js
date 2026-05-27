'use client';
import React, { useEffect, useState } from 'react';
import styles from './tradeSnap.module.scss';

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (min > 0) {
        return `${min} min${min > 1 ? 's' : ''} ${sec} sec`;
    }
    return `${sec} sec`;
}

export default function NextScreenshotTimer({ intervalMinutes, isActive, endTime }) {
    const [secondsLeft, setSecondsLeft] = useState(
        endTime ? Math.max(0, Math.round((endTime - Date.now()) / 1000)) : intervalMinutes * 60
    );

    useEffect(() => {
        if (!isActive || !endTime) return;
        setSecondsLeft(Math.max(0, Math.round((endTime - Date.now()) / 1000)));
        const timer = setInterval(() => {
            setSecondsLeft(Math.max(0, Math.round((endTime - Date.now()) / 1000)));
        }, 1000);
        return () => clearInterval(timer);
    }, [isActive, endTime]);

    return (
        <div className={styles.timerBadge}>
            Next screenshot in {formatTime(secondsLeft)}
        </div>
    );
}
