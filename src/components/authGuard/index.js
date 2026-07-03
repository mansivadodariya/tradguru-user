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
            router.replace('/login');
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);

        const checkUserStatus = async () => {
            const uid = getStoredUserId();
            console.log('AuthGuard checkUserStatus: uid =', uid);
            if (uid && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('phone_number, is_active')
                        .eq('id', uid)
                        .single();
                    
                    console.log('AuthGuard status check: data =', data, 'error =', error);

                    // User deleted/not found
                    if (error || !data) {
                        clearAuthSession();
                        toast.error('Your account has been deleted. Please contact admin.');
                        router.replace('/login');
                        return;
                    }

                    // User inactive
                    if (data.is_active === false) {
                        clearAuthSession();
                        toast.error('Your account is inactive. Please contact admin.');
                        router.replace('/login');
                        return;
                    }

                    const user = getStoredUser();
                    if (!user?.phone_number) {
                        if (!data?.phone_number) {
                            console.log('AuthGuard: No phone number, redirecting to login with need_phone');
                            router.replace(`/login?need_phone=true&uid=${uid}`);
                        } else {
                            console.log('AuthGuard: Phone number found, updating session');
                            if (user) {
                                user.phone_number = data.phone_number;
                                localStorage.setItem('user', JSON.stringify(user));
                            }
                            document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                        }
                    }
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
