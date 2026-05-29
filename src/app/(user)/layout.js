import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import AuthGuard from '@/components/authGuard';
import React from 'react';

const layout = ({ children }) => {
    return (
        <AuthGuard>
            <div className='user-layout'>
                <div className='sidebar-wrapper'>
                    <Sidebar />
                </div>
                <div className='children-wrapper'>
                    <Topbar />
                    <div className='children-spacing'>
                        {children}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}

export default layout;
