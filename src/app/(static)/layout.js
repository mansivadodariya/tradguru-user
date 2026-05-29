import Footer from '@/components/footer'
import Header from '@/components/header'
import React from 'react'

export default function layout({ children }) {
    return (
        <div>
            <Header />
            {children}
            <Footer />
        </div>
    )
}
