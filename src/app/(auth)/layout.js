"use client";
import React, { useEffect } from 'react'

export default function Layout({ children }) {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    return (
        <div>
            {children}
        </div>
    )
}