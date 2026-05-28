import Footer from '@/components/footer'
import React from 'react'

export default function layout({ children }) {
    return (
        <div>
            {children}
            <Footer />
        </div>
    )
}
