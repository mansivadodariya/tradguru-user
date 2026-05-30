import Login from '@/rendering/login';
import React, { Suspense } from 'react';

const page = () => {
    return (
        <Suspense>
            <Login />
        </Suspense>
    );
}

export default page;
