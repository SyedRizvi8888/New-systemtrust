import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { FeatureCards } from '@/components/home/FeatureCards';
import { StatsSection } from '@/components/home/StatsSection';
import { RecentItems } from '@/components/home/RecentItems';
import { QRMobileAccess } from '@/components/home/QRMobileAccess';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <FeatureCards />
      <RecentItems />
      <QRMobileAccess />
      <StatsSection />
    </Layout>
  );
};

export default Index;
