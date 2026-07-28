import BrokerDetailPage from '@/rendering/broker/detail';

export const metadata = {
    title: 'Broker & Platform Details | Trader Master',
    description: 'Explore full features, liquidity specs, and official links for verified trading partners.',
};

export default async function Page({ params }) {
    const resolvedParams = await params;
    return <BrokerDetailPage brokerId={resolvedParams?.id} />;
}
