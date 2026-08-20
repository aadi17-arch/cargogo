import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import PricingSection from '@/components/landing/PricingSection';
import { ServicesSection } from '@/components/landing/FeatureSections';
import { ShipperSection, DriverSection } from '@/components/landing/FullBleedSection';
import { FaqSection, SupportSection } from '@/components/landing/SupportFaqSections';
import FooterSection from '@/components/landing/FooterSection';

function LandingPage() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.getElementById(hash.replace('#', ''));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-slate-50 font-body text-slate-900 selection:bg-slate-900 selection:text-white">
      <Navbar />
      <HeroSection />
      <PricingSection />
      <ServicesSection />
      <ShipperSection />
      <DriverSection />
      <FaqSection />
      <SupportSection />
      <FooterSection />
    </div>
  );
}

export default LandingPage;
