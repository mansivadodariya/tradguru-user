'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }) {
    const router = useRouter();

    useEffect(() => {
        const handleUnauthorized = () => {
            router.replace('/login');
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [router]);

    return children;
}
