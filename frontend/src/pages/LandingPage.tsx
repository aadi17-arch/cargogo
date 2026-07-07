import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import PricingSection from '@/components/landing/PricingSection';
import { ShipperSection, DriverSection } from '@/components/landing/FullBleedSection';
import { ServicesSection, CapacitySection } from '@/components/landing/FeatureSections';
import { FaqSection, SupportSection } from '@/components/landing/SupportFaqSections';
import FooterSection from '@/components/landing/FooterSection';

function LandingPage() {
  // Smooth scroll to hash anchor on load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.getElementById(hash.replace('#', ''));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-background)' }}>
      <Navbar />
      <HeroSection />
      <PricingSection />
      <ShipperSection />
      <DriverSection />
      <ServicesSection />
      <CapacitySection />
      <FaqSection />
      <SupportSection />
      <FooterSection />
    </div>
  );
}

export default LandingPage;
