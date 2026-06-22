"use client";
import Footer from '@/components/footer'
import Header from '@/components/header'
import React, { useEffect } from 'react'

export default function Layout({ children }) {
    useEffect(() => {
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
