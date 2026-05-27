import { Suspense } from 'react';
import VerifyEmail from '@/rendering/verifyEmail';

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={null}>
            <VerifyEmail />
        </Suspense>
    );
}
