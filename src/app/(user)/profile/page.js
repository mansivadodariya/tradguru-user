'use client';
import React, { Suspense } from 'react';
import Profile from '@/rendering/profile';

export default function Page() {
    return (
        <Suspense fallback={null}>
            <Profile />
        </Suspense>
    );
}

