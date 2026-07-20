"use client";
import Footer from '@/components/footer'
import Header from '@/components/header'
import React, { useEffect } from 'react'
import { captureUtmParameters } from '@/lib/utm';

export default function Layout({ children }) {
    useEffect(() => {
        captureUtmParameters();
        document.documentElement.classList.remove('dark');
    }, []);

    return (
        <div>
            <Header />
            {children}
            <Footer />
        </div>
    )
}
