"use client";
import React, { useEffect } from 'react'
import { captureUtmParameters } from '@/lib/utm';

export default function Layout({ children }) {
    useEffect(() => {
        captureUtmParameters();
        document.documentElement.classList.remove('dark');
    }, []);

    return (
        <div>
            {children}
        </div>
    )
}