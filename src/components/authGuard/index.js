'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUserId, getStoredUser, clearAuthSession } from '@/lib/authSession';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/toast';

export default function AuthGuard({ children }) {
    const router = useRouter();

    useEffect(() => {
        const handleUnauthorized = () => {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            router.replace('/login' + (currentPath && currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : ''));
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);

        const checkUserStatus = async () => {
            const uid = getStoredUserId();
            console.log('AuthGuard checkUserStatus: uid =', uid);
            if (uid && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('phone_number, is_phone_verified, is_active')
                        .eq('id', uid)
                        .single();

                    console.log('AuthGuard status check: data =', data, 'error =', error);

                    // Check if account is actually deleted (PGRST116 = 0 rows returned from Supabase)
                    const isUserDeleted = error?.code === 'PGRST116' || (!data && !error);
                    if (isUserDeleted) {
                        clearAuthSession();
                        toast.error('Your account has been deleted. Please contact admin.');
                        router.replace('/login');
                        return;
                    }

                    // For other errors (network drop, RLS permission, transient query error), do NOT log out the user
                    if (error || !data) {
                        console.error('AuthGuard: Unable to verify user status due to error:', error);
                        return;
                    }

                    // User inactive
                    if (data.is_active === false) {
                        clearAuthSession();
                        toast.error('Your account is inactive. Please contact admin.');
                        router.replace('/login');
                        return;
                    }

                    // Strict Phone Verification Guard:
                    // Only users with verified phone numbers (is_phone_verified === true) can navigate to dashboard
                    if (!data.phone_number || data.is_phone_verified !== true) {
                        console.log('AuthGuard: Phone number missing or not verified (is_phone_verified is false), redirecting to verification popup flow');
                        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
                        router.replace(`/login?need_phone=true&uid=${uid}${currentPath && currentPath !== '/' ? `&redirect=${encodeURIComponent(currentPath)}` : ''}`);
                        return;
                    }

                    // Sync verified status to localStorage and cookie
                    const user = getStoredUser();
                    if (user) {
                        user.phone_number = data.phone_number;
                        user.is_phone_verified = true;
                        localStorage.setItem('user', JSON.stringify(user));
                        window.dispatchEvent(new CustomEvent('user:updated'));
                    }
                    document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                } catch (e) {
                    console.error('AuthGuard status check error:', e);
                }
            }
        };

        checkUserStatus();

        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [router]);

    return children;
}
