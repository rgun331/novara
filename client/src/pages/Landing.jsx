import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { BrandMarquee } from '../components/landing/BrandMarquee';
import { FeatureBento } from '../components/landing/FeatureBento';
import { Workflow } from '../components/landing/Workflow';
import { Testimonials } from '../components/landing/Testimonials';
import { Faq } from '../components/landing/Faq';
import { CtaBlock } from '../components/landing/CtaBlock';
import { Footer } from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-canvas">
      <Navbar />
      <main>
        <Hero />
        <BrandMarquee />
        <FeatureBento />
        <Workflow />
        <Testimonials />
        <Faq />
        <CtaBlock />
      </main>
      <Footer />
    </div>
  );
}
