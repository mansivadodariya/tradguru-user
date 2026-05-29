'use client';
import { Toaster } from 'react-hot-toast';

export { default as toast } from 'react-hot-toast';

export function ToastProvider({ children }) {
    return (
        <>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        fontSize: '14px',
                        fontWeight: '500',
                        maxWidth: '360px',
                    },
                    success: {
                        style: {
                            background: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                        },
                        iconTheme: { primary: '#15803d', secondary: '#f0fdf4' },
                    },
                    error: {
                        style: {
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                        },
                        iconTheme: { primary: '#b91c1c', secondary: '#fef2f2' },
                    },
                }}
            />
        </>
    );
}
