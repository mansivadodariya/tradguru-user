import React from 'react'
import Herobanner from './herobanner'
import SliderSection from './sliderSection'
import TradersSection from './tradersSection'
import TradingDesk from './tradingDesk'
import HowitWorks from './howitWorks'
import TradeSetup from './tradeSetup'
import ClientSection from './clientSection'
import ReadyTostart from './readyTostart'

export default function HomePage() {
    return (
        <div>
            <Herobanner />
            <SliderSection />
            <TradersSection />
            <TradingDesk />
            <HowitWorks />
            <TradeSetup />
            <ClientSection />
            <ReadyTostart />
        </div>
    )
}
