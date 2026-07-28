const EdufinsIcon = '/assets/icons/edufins.svg';
const MetaIcon = '/assets/icons/Img2.svg';
const AlgomaticIcon = '/assets/icons/algomaticIcon.svg';
const AsicIcon = '/assets/icons/asic.svg';
const NeweraLogo = '/assets/icons/Img1.svg';
const FundedMasterLogo = '/assets/icons/Img2.svg';

export const brokerList = [
    {
        id: 'newera',
        name: 'Newera Brokerage',
        subtitle: 'Liquidity Gateway',
        logo: NeweraLogo,
        category: 'Brokers',
        badge: '⚡ Liquidity Gateway Engine',
        status: 'Native Partner',
        statusType: 'partner',
        description: 'Native volume-to-credit integration engine powering your Trader Master AI usage credits directly through MT5 trading volume.',
        features: [
            'Automated 1 Lot = Credit conversion',
            'Direct MT5 account link & balance check',
            'Real-time credit balance updating',
            'Zero platform subscription required'
        ],
        highlights: [
            { id: '1', type: 'link', title: 'Best Arbitrage Brokers', sub: 'Ultra-low latency arbitrage' },
            { id: '2', type: 'server', title: 'Best IB Rewards', sub: 'High volume rebate structure' },
            { id: '3', type: 'shield', title: 'Best Spreads', sub: 'Raw ECN tightest spreads' }
        ],
        websiteUrl: 'https://newera365-app.vercel.app/en',
        canSync: true
    },
    {
        id: 'algomatic',
        name: 'Algomatic Quant',
        subtitle: 'Algo Execution Engine',
        logo: AlgomaticIcon,
        category: 'Algo Brokers',
        badge: '📊 Quant Brokerage Infrastructure',
        status: 'Partner',
        statusType: 'partner',
        description: 'High-performance quantitative brokerage infrastructure offering direct FIX API access, strategy hosting, and automated risk engines.',
        features: [
            'Quantitative model hosting & execution',
            'Direct FIX API & webhooks connectivity',
            'Automated risk management & drawdown limits',
            'Institutional grade liquidity pools'
        ],
        highlights: [
            { id: '1', type: 'link', title: '24/5 Automated Trading', sub: 'Non-stop algo execution' },
            { id: '2', type: 'server', title: 'Price Gap Arbitrage Engine', sub: 'Real-time gap detection' },
            { id: '3', type: 'shield', title: 'Broker Agnostic', sub: 'Universal MT4/MT5 compatibility' }
        ],
        websiteUrl: 'https://algomaticbot.com/',
        canSync: false
    },
    {
        id: 'edufins',
        name: 'Edufins Academy',
        subtitle: 'Trading Education Platform',
        logo: EdufinsIcon,
        category: 'Learning Platforms',
        badge: '🎓 Forex & CFD Trading Academy',
        status: 'Education Partner',
        statusType: 'supported',
        description: 'Premier financial trading academy offering structured forex courses, live market analysis webinars, risk management tools, and professional trader mentoring.',
        features: [
            'Comprehensive Forex & CFD trading courses',
            'Live market analysis & trading webinars',
            'Arbitrage & algorithmic trading education',
            'Risk management frameworks & trading tools'
        ],
        highlights: [
            { id: '1', type: 'link', title: 'Forex Courses', sub: 'Structured CFD & FX learning' },
            { id: '2', type: 'server', title: 'Live Webinars', sub: 'Real-time market analysis' },
            { id: '3', type: 'shield', title: 'Trader Mentoring', sub: 'Risk frameworks & tools' }
        ],
        websiteUrl: 'https://edufins.com',
        canSync: false
    },
    {
        id: 'funded-master',
        name: 'Funded Master',
        subtitle: 'Prop Trading Community',
        logo: FundedMasterLogo,
        category: 'Prop Trading',
        badge: '🏆 Prop Trading Firm',
        status: 'Partner',
        statusType: 'partner',
        description: 'To win the game, you need strong support and diligent preparation. Join For Traders Community — traders worldwide (18+) can apply and trade in financial markets.',
        features: [
            'Global traders application (18+ years old)',
            'Strong support & diligent preparation community',
            'Financial markets trading access & evaluation',
            'Up to 90% profit splits for disciplined traders'
        ],
        highlights: [
            { id: '1', type: 'link', title: 'Global Traders 18+', sub: 'Worldwide trader access' },
            { id: '2', type: 'server', title: 'Trader Community', sub: 'Strong support & preparation' },
            { id: '3', type: 'shield', title: 'Up to 90% Split', sub: 'Disciplined evaluation' }
        ],
        websiteUrl: 'https://fundedmaster.com/',
        canSync: false
    }
];

export function getBrokerById(id) {
    if (!id) return null;
    return brokerList.find((b) => b.id.toLowerCase() === String(id).toLowerCase()) || null;
}
