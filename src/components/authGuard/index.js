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
            if (uid) {
                const user = getStoredUser();
                if (!user?.phone_number) {
                    if (supabase) {
                        try {
                            const { data } = await supabase
                                .from('users')
                                .select('phone_number')
                                .eq('id', uid)
                                .single();
                            if (!data?.phone_number) {
                                router.replace(`/login?need_phone=true&uid=${uid}`);
                            } else {
                                if (user) {
                                    user.phone_number = data.phone_number;
                                    localStorage.setItem('user', JSON.stringify(user));
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }
        };

        checkPhone();

        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [router]);

    return children;
}
