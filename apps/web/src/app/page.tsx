import { Hero } from '@/components/landing/hero';
import { Capabilities } from '@/components/landing/capabilities';
import { Workflow } from '@/components/landing/workflow';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { Comparison } from '@/components/landing/comparison';
import { AiModels } from '@/components/landing/ai-models';
import { Industries } from '@/components/landing/industries';
import { Testimonials } from '@/components/landing/testimonials';
import { Stats } from '@/components/landing/stats';
import { Faq } from '@/components/landing/faq';
import { FinalCta } from '@/components/landing/cta';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Capabilities />
      <Workflow />
      <DashboardPreview />
      <Comparison />
      <AiModels />
      <Industries />
      <Testimonials />
      <Stats />
      <Faq />
      <FinalCta />
    </>
  );
}
