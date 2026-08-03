import { supabase } from '@/lib/supabaseClient';

export const brokerList = [
    {
        id: 'newera',
        name: 'Newera Brokerage',
        subtitle: 'Liquidity Gateway',
        logo: '/assets/icons/Img1.svg',
        category: 'Brokers',
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
        websiteUrl: 'https://trade.newera365.com/client/register/6a68798de0aaa'
    },
    {
        id: 'algomatic',
        name: 'Algomatic Quant',
        subtitle: 'Algo Execution Engine',
        logo: '/assets/icons/algomaticIcon.svg',
        category: 'Algo Brokers',
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
        websiteUrl: 'https://algomaticbot.com/'
    }
];

export function formatBroker(item) {
    if (!item) return null;
    return {
        id: item.id,
        name: item.name,
        subtitle: item.subtitle || '',
        logo: item.logo || '',
        category: item.category || 'Brokers',
        description: item.description || '',
        features: typeof item.features === 'string' ? JSON.parse(item.features) : (item.features || []),
        highlights: typeof item.highlights === 'string' ? JSON.parse(item.highlights) : (item.highlights || []),
        websiteUrl: item.website_url || item.websiteUrl || ''
    };
}

export async function fetchBrokers() {
    if (!supabase) {
        return brokerList;
    }
    try {
        const { data, error } = await supabase
            .from('brokers')
            .select('*')
            .order('created_at', { ascending: true });

        if (error || !data || data.length === 0) {
            return brokerList;
        }
        return data.map(formatBroker);
    } catch (err) {
        console.error('Error fetching brokers from Supabase:', err);
        return brokerList;
    }
}

export async function fetchBrokerById(id) {
    if (!id) return null;
    if (!supabase) {
        return getBrokerById(id);
    }
    try {
        const { data, error } = await supabase
            .from('brokers')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error || !data) {
            return getBrokerById(id);
        }
        return formatBroker(data);
    } catch (err) {
        return getBrokerById(id);
    }
}

export function getBrokerById(id) {
    if (!id) return null;
    return brokerList.find((b) => b.id.toLowerCase() === String(id).toLowerCase()) || null;
}


