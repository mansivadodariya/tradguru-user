import React from 'react'
import Herobanner from './herobanner'
import SliderSection from './sliderSection'
import TradersSection from './tradersSection'
import TradingDesk from './tradingDesk'
import HowitWorks from './howitWorks'
import TradeSetup from './tradeSetup'
import EcosystemSection from './ecosystemSection'
import ClientSection from './clientSection'
import PlansSection from './plansSection'
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
            <EcosystemSection />
            <ClientSection />
            <PlansSection />
            <ReadyTostart />
        </div>
    )
}
