import { supabase } from '@/lib/supabaseClient';

export const brokerList = [
    {
        id: 'newera',
        name: 'Newera Brokerage',
        name_ar: 'وساطة نيو ايرا',
        subtitle: 'Liquidity Gateway',
        subtitle_ar: 'بوابة السيولة',
        logo: '/assets/icons/Img1.svg',
        category: 'Brokers',
        description: 'Native volume-to-credit integration engine powering your Trader Master AI usage credits directly through MT5 trading volume.',
        description_ar: 'محرك متكامل لتحويل حجم التداول إلى رصيد ذكاء اصطناعي مباشرة من خلال تداولك على منصة MT5.',
        features: [
            'Automated 1 Lot = Credit conversion',
            'Direct MT5 account link & balance check',
            'Real-time credit balance updating',
            'Zero platform subscription required'
        ],
        features_ar: [
            'تحويل آلي 1 لوت = رصيد',
            'ربط مباشر بحساب MT5 وفحص الرصيد',
            'تحديث رصيد الائتمان في الوقت الفعلي',
            'لا يتطلب اشتراكاً في المنصة'
        ],
        highlights: [
            { id: '1', type: 'link', title: 'Best Arbitrage Brokers', title_ar: 'أفضل وسطاء المراجحة', sub: 'Ultra-low latency arbitrage', sub_ar: 'تداول مراجحة بفترة كمون فائقة الانخفاض' },
            { id: '2', type: 'server', title: 'Best IB Rewards', title_ar: 'أفضل مكافآت IB', sub: 'High volume rebate structure', sub_ar: 'هيكل عمولات حوافز أحجام تداول عالية' },
            { id: '3', type: 'shield', title: 'Best Spreads', title_ar: 'أفضل فروق أسعار', sub: 'Raw ECN tightest spreads', sub_ar: 'أضيق فروق أسعار حسابات ECN المباشرة' }
        ],
        websiteUrl: 'https://trade.newera365.com/client/register/6a68798de0aaa'
    },
    {
        id: 'algomatic',
        name: 'Algomatic Quant',
        name_ar: 'الخوارزمية الكمية',
        subtitle: 'Algo Execution Engine',
        subtitle_ar: 'محرك تنفيذ الخوارزميات',
        logo: '/assets/icons/algomaticIcon.svg',
        category: 'Algo Brokers',
        description: 'High-performance quantitative brokerage infrastructure offering direct FIX API access, strategy hosting, and automated risk engines.',
        description_ar: 'بنية تحتية عالية الأداء للوساطة الكمية توفر وصولاً مباشراً عبر FIX API واستضافة الاستراتيجيات.',
        features: [
            'Quantitative model hosting & execution',
            'Direct FIX API & webhooks connectivity',
            'Automated risk management & drawdown limits',
            'Institutional grade liquidity pools'
        ],
        features_ar: [
            'استضافة وتنفيذ النماذج الكمية',
            'اتصال مباشر بـ FIX API والويب هوك',
            'إدارة مخاطر مؤتمتة وحدود التراجع',
            'مجمعات سيولة بمستوى مؤسسي'
        ],
        highlights: [
            { id: '1', type: 'link', title: '24/5 Automated Trading', title_ar: 'تداول مؤتمت 24/5', sub: 'Non-stop algo execution', sub_ar: 'تنفيذ خوارزمي غير متوقف' },
            { id: '2', type: 'server', title: 'Price Gap Arbitrage Engine', title_ar: 'محرك مراجحة الفجوات السعرية', sub: 'Real-time gap detection', sub_ar: 'كشف فوري للفجوات' },
            { id: '3', type: 'shield', title: 'Broker Agnostic', title_ar: 'مستقل عن الوسيط', sub: 'Universal MT4/MT5 compatibility', sub_ar: 'توافق شامل مع MT4/MT5' }
        ],
        websiteUrl: 'https://algomaticbot.com/'
    }
];

export function formatBroker(item) {
    if (!item) return null;
    return {
        id: item.id,
        name: item.name,
        name_ar: item.name_ar || item.name,
        name_ph: item.name_ph || item.name,
        subtitle: item.subtitle || '',
        subtitle_ar: item.subtitle_ar || item.subtitle || '',
        subtitle_ph: item.subtitle_ph || item.subtitle || '',
        logo: item.logo || '',
        category: item.category || 'Brokers',
        description: item.description || '',
        description_ar: item.description_ar || item.description || '',
        description_ph: item.description_ph || item.description || '',
        features: typeof item.features === 'string' ? JSON.parse(item.features) : (item.features || []),
        features_ar: typeof item.features_ar === 'string' ? JSON.parse(item.features_ar) : (item.features_ar || item.features || []),
        features_ph: typeof item.features_ph === 'string' ? JSON.parse(item.features_ph) : (item.features_ph || item.features || []),
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


