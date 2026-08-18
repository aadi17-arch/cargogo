import { useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import HeroSection from '@/components/Landing/HeroSection';
import PricingSection from '@/components/Landing/PricingSection';
import { ServicesSection } from '@/components/Landing/FeatureSections';
import { ShipperSection, DriverSection } from '@/components/Landing/FullBleedSection';
import { FaqSection, SupportSection } from '@/components/Landing/SupportFaqSections';
import FooterSection from '@/components/Landing/FooterSection';

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
