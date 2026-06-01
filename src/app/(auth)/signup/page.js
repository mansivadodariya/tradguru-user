import Signup from '@/rendering/signup';
import React, { Suspense } from 'react';

const page = () => {
    return (
        <Suspense>
            <Signup />
        </Suspense>
    );
}

export default page;
