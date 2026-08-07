import SubscriptionPlansView from '@/rendering/plans';

export const metadata = {
    title: 'Subscription Plans | Trader Master',
    description: 'Choose from flexible credit packages to power your AI trading analyses, strategy backtests, and real-time market queries.',
};

export default function PlansPage() {
    return <SubscriptionPlansView />;
}
