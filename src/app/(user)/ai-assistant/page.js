'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AiAssistant from '@/rendering/aiAssistant';

function AiAssistantWithParams() {
    const params = useSearchParams();
    const initialTab = params.get('tab') || undefined;
    const initialOpenId = params.get('open') || undefined;
    return <AiAssistant initialTab={initialTab} initialOpenId={initialOpenId} />;
}

export default function Page() {
    return (
        <Suspense fallback={null}>
            <AiAssistantWithParams />
        </Suspense>
    );
}
