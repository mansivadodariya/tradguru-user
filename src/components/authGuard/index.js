'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUserId, getStoredUser } from '@/lib/authSession';
import { supabase } from '@/lib/supabaseClient';

export default function AuthGuard({ children }) {
    const router = useRouter();

    useEffect(() => {
        const handleUnauthorized = () => {
            router.replace('/login');
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);

        const checkPhone = async () => {
            const uid = getStoredUserId();
            console.log('AuthGuard checkPhone: uid =', uid);
            if (uid) {
                const user = getStoredUser();
                console.log('AuthGuard checkPhone: user =', user);
                if (!user?.phone_number) {
                    if (supabase) {
                        try {
                            const { data, error } = await supabase
                                .from('users')
                                .select('phone_number')
                                .eq('id', uid)
                                .single();
                            console.log('AuthGuard checkPhone: supabase data =', data, 'error =', error);
                            if (!data?.phone_number) {
                                console.log('AuthGuard checkPhone: No phone number, redirecting to login with need_phone');
                                router.replace(`/login?need_phone=true&uid=${uid}`);
                            } else {
                                console.log('AuthGuard checkPhone: Phone number found, updating session');
                                if (user) {
                                    user.phone_number = data.phone_number;
                                    localStorage.setItem('user', JSON.stringify(user));
                                }
                                document.cookie = 'has_phone=true; path=/; SameSite=Lax';
                            }
                        } catch (e) {
                            console.error('AuthGuard checkPhone error:', e);
                        }
                    }
                } else {
                    console.log('AuthGuard checkPhone: phone number already in session:', user?.phone_number);
                }
            }
        };

        checkPhone();

        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [router]);

    return children;
}
