import { Suspense } from 'react';
import ResetPassword from '@/rendering/resetPassword';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPassword />
        </Suspense>
    );
}
