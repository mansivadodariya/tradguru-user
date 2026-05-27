'use client';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import styles from './toast.module.scss';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const show = useCallback((message, type = 'error') => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <ToastContext.Provider value={show}>
            {children}
            <div className={styles.container} aria-live="polite" aria-atomic="false">
                {toasts.map((t) => (
                    <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="alert">
                        <span>{t.message}</span>
                        <button type="button" onClick={() => remove(t.id)} aria-label="Dismiss" className={styles.close}>✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
