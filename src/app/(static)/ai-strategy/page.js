'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AiStrategyPage from '@/rendering/aiStrategyPage';
import { getStoredUserId } from '@/lib/authSession';

export default function Page() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const uid = getStoredUserId();
        if (uid) {
            router.replace('/dashboard');
        } else {
            setIsChecking(false);
        }
    }, [router]);

    if (isChecking) {
        return null;
    }

    return (
        <div>
            <AiStrategyPage />
        </div>
    );
}
