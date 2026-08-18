import { supabase } from '@/lib/supabaseClient';

export const defaultSubscriptionPlans = [
    {
        id: 'basic',
        name: 'Free',
        name_ar: 'مجاني',
        description: 'For investors who are just getting started with stock research.',
        description_ar: 'المستثمرون الذين بدأوا للتو في أبحاث الأسهم.',
        price: 0,
        currency: '$',
        credits: 300,
        validity: 'Free For 1 Month',
        validity_ar: 'مجاناً لمدة شهر واحد',
        ctaText: 'Current Plan',
        ctaText_ar: 'الخطة الحالية',
        ctaText_ph: 'Kasalukuyang Plano',
        subCtaText: 'No credit card required',
        subCtaText_ar: 'لا تتطلب بطاقة ائتمان',
        featuresHeader: 'What You Will Get +',
        featuresHeader_ar: 'ما ستحصل عليه +',
        features: [
            'Fundamental & Technical Stock Analysis',
            '20 AI Chat queries per month',
            '30 Auto Chart & Indicator analyses',
            'Limited Access to Stock Screener',
            'Ask up to 10 Questions Daily to AI Guru',
            'Access to Latest News & Market Reports'
        ],
        features_ar: [
            'التحليل الأساسي والفني للأسهم',
            '20 استفسار في محادثة الذكاء الاصطناعي شهرياً',
            '30 تحليلاً تلقائياً للمخططات والمؤشرات',
            'وصول محدود لفاحص الأسهم',
            'طرح حتى 10 أسئلة يومياً لـ AI Guru',
            'الوصول إلى أحدث الأخبار وتقارير السوق'
        ],
        badge: null,
        badge_ar: null,
        is_best_value: false,
        is_featured: false,
        display_order: 1
    },
    {
        id: 'standard',
        name: 'Premium',
        name_ar: 'بريميوم',
        description: 'For investors who need deeper research tools and more data access.',
        description_ar: 'للمستثمرين الذين يحتاجون لأدوات بحث أعمق وصول أكبر للبيانات.',
        price: 149,
        originalPrice: 199,
        currency: '$',
        credits: 1000,
        validity: 'Valid 3 Months',
        validity_ar: 'صالح لمدة 3 أشهر',
        ctaText: 'Upgrade Now',
        ctaText_ar: 'ترقية الآن',
        ctaText_ph: 'Mag-upgrade Ngayon',
        subCtaText: 'No charges for 14 days • Cancel anytime',
        subCtaText_ar: 'بدون رسوم لمدة 14 يوماً • إلغاء في أي وقت',
        featuresHeader: 'Everything in Free Plan +',
        featuresHeader_ar: 'كل شيء في الخطة المجانية +',
        features: [
            'Fundamental & Technical Deep Analysis',
            '66 AI Chat queries per month',
            '100 Auto Chart & Indicator analyses',
            'Unlimited AI-Powered Deep Stock Insights',
            'Full Access to Stock Screener',
            'Ask up to 50 Questions Daily to AI Guru',
            'Access to Latest News & Reports'
        ],
        features_ar: [
            'التحليل الأساسي والفني العميق',
            '66 استفسار في محادثة الذكاء الاصطناعي شهرياً',
            '100 تحليل تلقائي للمخططات والمؤشرات',
            'رؤى عميقة غير محدودة بالذكاء الاصطناعي',
            'وصول كامل لفاحص الأسهم',
            'طرح حتى 50 سؤالاً يومياً لـ AI Guru',
            'الوصول إلى أحدث الأخبار والتقارير'
        ],
        badge: null,
        badge_ar: null,
        is_best_value: false,
        is_featured: false,
        display_order: 2
    },
    {
        id: 'premium',
        name: 'Professional',
        name_ar: 'احترافي',
        description: 'For analysts and researchers who need high-volume screening and priority access.',
        description_ar: 'للمحللين والباحثين الذين يحتاجون إلى فحص عالي الحجم وأولوية الوصول.',
        price: 500,
        originalPrice: 650,
        currency: '$',
        credits: 4000,
        validity: 'Valid 6 Months',
        validity_ar: 'صالح لمدة 6 أشهر',
        ctaText: 'Upgrade Now',
        ctaText_ar: 'ترقية الآن',
        ctaText_ph: 'Mag-upgrade Ngayon',
        subCtaText: 'Priority activation • Cancel anytime',
        subCtaText_ar: 'تفعيل ذو أولوية • إلغاء في أي وقت',
        featuresHeader: 'Everything in Premium Plan +',
        featuresHeader_ar: 'كل شيء في خطة بريميوم +',
        features: [
            'Includes Everything in Premium Plan',
            '266 AI Chat queries per month',
            '400 Auto Chart & Deep Scan Analyses',
            '10,000 Deep Scan Credits',
            'Priority AI Model Access',
            'Top-Up Credits Available',
            '24/7 Priority Dedicated VIP Support'
        ],
        features_ar: [
            'يشمل كل شيء في خطة بريميوم',
            '266 استفسار في محادثة الذكاء الاصطناعي شهرياً',
            '400 تحليل للمخططات والمسح العميق',
            '10,000 رصيد مسح عميق',
            'أولوية الوصول لنماذج الذكاء الاصطناعي',
            'شحن أرصدة إضافية متاح',
            'دعم الفائقة VIP على مدار 24/7'
        ],
        badge: 'BEST SELLER',
        badge_ar: 'الأكثر مبيعاً',
        is_best_value: true,
        is_featured: true,
        display_order: 3
    }
];

export async function fetchSubscriptionPlans() {
    if (!supabase) {
        return defaultSubscriptionPlans;
    }
    try {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error || !data || data.length === 0) {
            return defaultSubscriptionPlans;
        }

        return data.map((plan) => ({
            ...plan,
            features: Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features) : []),
            features_ar: Array.isArray(plan.features_ar) ? plan.features_ar : (typeof plan.features_ar === 'string' ? JSON.parse(plan.features_ar) : []),
            features_ph: Array.isArray(plan.features_ph) ? plan.features_ph : (typeof plan.features_ph === 'string' ? JSON.parse(plan.features_ph) : [])
        }));
    } catch (_) {
        return defaultSubscriptionPlans;
    }
}
