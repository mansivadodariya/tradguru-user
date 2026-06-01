"use client";
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import AuthGuard from '@/components/authGuard';
import React, { useState } from 'react';
import './layout.scss';

const layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AuthGuard>
            <div className='user-layout'>
                <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </div>
                {isSidebarOpen && (
                    <div className='sidebar-overlay' onClick={() => setIsSidebarOpen(false)} />
                )}
                <div className='children-wrapper'>
                    <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                    <div className='children-spacing'>
                        {children}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}

export default layout;
