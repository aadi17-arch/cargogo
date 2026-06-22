import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Check, ExternalLink, Lock, Receipt, PhoneCall, Mail, Truck } from 'lucide-react';
import ApiDocsModal from '@/components/landing/ApiDocsModal';
import StatusModal from '@/components/landing/StatusModal';
import SlaModal from '@/components/landing/SlaModal';
import { useAuth } from '@/hooks/useAuth';

const FLEET_DATA = [
  {
    title: 'Mini Tempo',
    sub: 'Up to 500 kg',
    description: 'Perfect for swift local deliveries of household items, boxes, and small shipments. Highly maneuverable in tight city streets.',
    basePrice: '₹50',
    rate: '₹12 / km',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    alt: 'Mini Tempo utility local truck'
  },
  {
    title: 'Pickup Truck',
    sub: 'Up to 1.5 Tons',
    description: 'Ideal for commercial cargo, medium-sized furniture, and construction materials. Offers an open deck layout for easy loading.',
    basePrice: '₹80',
    rate: '₹15 / km',
    img: 'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=600&q=80',
    alt: 'Pickup Truck cargo delivery'
  },
  {
    title: '3-Ton Container',
    sub: 'Up to 3.0 Tons',
    description: 'Fully enclosed metal container truck. Ideal for high-value logistics, sensitive industrial freight, and heavy distributions.',
    basePrice: '₹150',
    rate: '₹20 / km',
    img: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=600&q=80',
    alt: '3-Ton enclosed container truck'
  }
];

const SERVICES_DATA = [
  {
    title: 'Fair Pricing',
    description: 'No surprise fees. We calculate rates automatically based on your cargo dimensions and shipping weight to ensure honest rates.',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    alt: 'Volumetric Pricing math cargo palettes'
  },
  {
    title: 'Secure Handshakes',
    description: 'Protect your goods. Drivers must enter a security code sent directly to you at both pickup and drop-off to confirm loading and delivery.',
    img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    alt: 'OTP Security passcode screen verification'
  },
  {
    title: 'Fast & Direct Routes',
    description: 'Avoid unnecessary delays. Routes are plotted instantly to find the quickest path, avoiding heavy traffic zones and low-clearance bridges.',
    img: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
    alt: 'Intelligent fleet trucks logistics center warehouse'
  }
];

const CAPACITY_DATA = [
  {
    title: 'Smart Vehicle Matching',
    description: 'Our booking system automatically recommends the most cost-effective vehicle class based on your cargo dimensions.',
    img: 'https://images.unsplash.com/photo-1606185540834-d6e7483ee1a4?auto=format&fit=crop&w=600&q=80',
    alt: 'Smart vehicle matching'
  },
  {
    title: 'On-Demand Booking',
    description: 'Book mini tempos, utility pickups, or large container trucks instantly whenever you need them—no long-term contracts.',
    img: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=600&q=80',
    alt: 'Verified box container truck network'
  },
  {
    title: 'Space Optimization',
    description: 'Never pay for empty cargo space. We organize load layouts to ensure you only pay for the exact volume your boxes require.',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    alt: 'Payload capacity optimization cargo loader'
  }
];

const SUPPORT_DATA = [
  {
    title: '24/7 Dispatch Hotline',
    sub: '+1-800-CARGOGO',
    description: 'Direct line to active dispatch agents standing by to secure your cargo lanes.',
    img: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80',
    alt: 'Support helpline headset desk',
    icon: PhoneCall
  },
  {
    title: 'Billing & Rates Help',
    sub: 'billing@cargogo.com',
    description: 'Inquiries regarding invoices, payment receipts, and volumetric quote estimates.',
    img: 'https://images.unsplash.com/photo-1521791136368-1a8519007b51?auto=format&fit=crop&w=800&q=80',
    alt: 'Billing help desk',
    icon: Receipt
  },
  {
    title: 'Driver Assistance',
    sub: 'drivers@cargogo.com',
    description: 'Dedicated support for active drivers regarding match notifications and quick payouts.',
    img: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80',
    alt: 'Driver help desk',
    icon: Truck
  },
  {
    title: 'General Support',
    sub: 'help@cargogo.com',
    description: 'General platform questions (15-min response).',
    img: 'https://images.unsplash.com/photo-1521791136368-1a8519007b51?auto=format&fit=crop&w=800&q=80',
    alt: 'Support help desk',
    icon: Mail
  }
];

function SwipeableCardStack({
  cards,
  activeIndex,
  onChangeIndex,
  isFleet = false,
  isSupport = false
}: {
  cards: any[];
  activeIndex: number;
  onChangeIndex: (idx: number) => void;
  isFleet?: boolean;
  isSupport?: boolean;
}) {
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      onChangeIndex(Math.min(cards.length - 1, activeIndex + 1));
    } else if (diff < -50) {
      onChangeIndex(Math.max(0, activeIndex - 1));
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center py-4">
      <div 
        className="relative w-full h-[400px] flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {cards.map((card, idx) => {
          const isActive = idx === activeIndex;
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onChangeIndex(idx)}
              className="absolute w-[92%] h-[370px] rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer text-left"
              style={{
                borderColor: 'var(--color-border)',
                borderWidth: 'var(--border-width)',
                zIndex: 10 - Math.abs(idx - activeIndex),
                transform: `translateX(${isActive ? 0 : (idx - activeIndex) * 105}%) scale(${isActive ? 1 : 0.9})`,
                opacity: isActive ? 1 : 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)] relative">
                <img
                  src={card.img}
                  alt={card.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                {card.sub && !isSupport && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 text-[9px] font-black uppercase bg-white text-[#09121F] rounded">
                    {card.sub}
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isSupport && Icon && (
                      <div className="p-1 text-slate-400">
                        <Icon size={16} />
                      </div>
                    )}
                    <h4 className="text-base font-bold tracking-tight text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-heading)' }}>
                      {card.title}
                    </h4>
                  </div>
                  {isSupport && card.sub && (
                    <span className="text-xs font-bold text-indigo-400 block">{card.sub}</span>
                  )}
                  <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {card.description}
                  </p>
                </div>

                {isFleet && card.basePrice && (
                  <div className="pt-2.5 border-t border-[var(--color-border)] flex justify-between items-center text-[10px]">
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-400">Base Price</span>
                      <span className="text-xs font-extrabold text-[var(--color-text-main)]">{card.basePrice}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] uppercase font-bold text-slate-400">Distance Rate</span>
                      <span className="text-xs font-extrabold text-[var(--color-text-main)]">{card.rate}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center items-center gap-2 mt-2">
        {cards.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onChangeIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === activeIndex ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-650'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [trackingIdInput, setTrackingIdInput] = useState('');
  
  // Interactive Modals & Footer Newsletter States
  const [apiDocsOpen, setApiDocsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [slaOpen, setSlaOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitting(true);
    setTimeout(() => {
      setNewsletterSubmitting(false);
      setNewsletterSubscribed(true);
    }, 800);
  };

  // Stack card active index states for phone screens
  const [fleetActive, setFleetActive] = useState(0);
  const [servicesActive, setServicesActive] = useState(0);
  const [capacityActive, setCapacityActive] = useState(0);
  const [supportActive, setSupportActive] = useState(0);

  // Smooth scroll to hash anchor on load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, []);

  // Quote Calculator State
  const [form, setForm] = useState({
    weightKg: 50,
    lengthCm: 100,
    widthCm: 60,
    heightCm: 40,
    vehicleType: 'MINI_TEMPO' as 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON',
    distanceKm: 15,
  });

  const [quote, setQuote] = useState<any>(null);

  const calculateQuote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const volumetric = (form.lengthCm * form.widthCm * form.heightCm) / 5000;
    const chargeable = Math.max(form.weightKg, volumetric);

    const rates: Record<string, { basePrice: number; pricePerKm: number; costPerUnit: number }> = {
      MINI_TEMPO: { basePrice: 50, pricePerKm: 12, costPerUnit: 4 },
      PICKUP_TRUCK: { basePrice: 80, pricePerKm: 15, costPerUnit: 5 },
      CONTAINER_3TON: { basePrice: 150, pricePerKm: 20, costPerUnit: 7 },
    };

    const rate = rates[form.vehicleType] || rates.MINI_TEMPO;
    const price = rate.basePrice + (rate.pricePerKm * form.distanceKm) + (rate.costPerUnit * chargeable);

    setQuote({
      distanceKm: form.distanceKm,
      volumetric: Math.round(volumetric * 100) / 100,
      chargeable: Math.round(chargeable * 100) / 100,
      basePrice: rate.basePrice,
      pricePerKm: rate.pricePerKm,
      costPerUnit: rate.costPerUnit,
      estimated: Math.round(price * 100) / 100
    });
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-background)' }}>
      <Navbar />

      {/* Hero Section with Full Flipped Background Image for Perfect Blending */}
      <header className="relative px-4 sm:px-16 border-b border-[var(--color-border)] flex items-center overflow-hidden py-16 sm:py-0 h-auto sm:h-[calc(100vh-64px)] min-h-[650px] sm:min-h-[750px]">
        {/* Background Image (Twilight shipping harbor container cargo loading dock) */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        {/* Brand steel blue gradient overlay to blend into the navbar and page */}
        <div 
          className="absolute inset-0 z-10"
          style={{ 
            background: 'linear-gradient(to right, rgba(15, 27, 46, 0.96) 30%, rgba(15, 27, 46, 0.6) 70%, rgba(15, 27, 46, 0.35) 100%)',
          }}
        />
        
        {/* Content Container aligned to the left */}
        <div className="w-full relative z-20">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Book Trucks & Track Cargo Instantly
            </h1>
            <p className="text-lg sm:text-xl font-medium text-slate-200">
              Get instant pricing, live tracking, and secure deliveries. No phone calls required—just fast, direct cargo booking for your business.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => navigate(isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register')}
                className="bg-white text-[var(--color-primary)] hover:bg-slate-100 px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all shadow-lg hover:shadow-cyan-400/20 hover:scale-[1.02] active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '15px' }}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start Shipping'}
              </button>
              <a 
                href="#calculator"
                className="px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all border border-white text-white bg-transparent hover:bg-white/10 text-center"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '15px' }}
              >
                Calculate Quote
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Track Shipment Section */}
      <section id="track" className="py-12 px-6" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-primary)] p-8 rounded-[var(--radius-card)] flex flex-col md:flex-row items-center justify-between gap-8 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="max-w-md text-left space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Track Your Cargo Instantly
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Enter your Booking ID below to check live status. No registration required.
              </p>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (trackingIdInput.trim()) {
                  navigate(`/track/${trackingIdInput.trim()}`);
                }
              }}
              className="w-full md:w-auto flex flex-col sm:flex-row gap-3 flex-1 max-w-lg"
            >
              <input 
                type="text"
                placeholder="Enter Booking ID (e.g. 550e8400...)"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="input-field flex-1 px-4 py-3 bg-[var(--color-background)]"
                required
              />
              <button 
                type="submit"
                className="text-white px-8 py-3 rounded-[var(--radius-button)] font-bold transition-all hover:bg-[var(--color-primary-hover)] shrink-0"
                style={{ backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-heading)', fontSize: '14px' }}
              >
                Track Shipment
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Pricing Estimator Section */}
      <section id="pricing" className="py-20 px-6 border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              Instant Delivery Price Estimator
            </h2>
            <p className="text-md font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Get transparent pricing instantly. Adjust details below to see changes in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Calculator Input Panel Form */}
            <form 
              onSubmit={calculateQuote}
              className="lg:col-span-7 p-8 rounded-[var(--radius-card)] border bg-[var(--color-card)] space-y-6 shadow-sm flex flex-col justify-between" 
              style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}
            >
              <div className="space-y-6">
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                      Weight (kg)
                    </label>
                    <input 
                      type="number" 
                      value={form.weightKg} 
                      onChange={(e) => setForm({...form, weightKg: Math.max(1, +e.target.value)})}
                      className="input-field px-4 py-3 bg-[var(--color-background)] w-full border rounded-[var(--radius-card)]"
                      style={{ borderColor: 'var(--color-border)' }}
                      required 
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                      Distance (km)
                    </label>
                    <input 
                      type="number" 
                      value={form.distanceKm} 
                      onChange={(e) => setForm({...form, distanceKm: Math.max(1, +e.target.value)})}
                      className="input-field px-4 py-3 bg-[var(--color-background)] w-full border rounded-[var(--radius-card)]"
                      style={{ borderColor: 'var(--color-border)' }}
                      required 
                      min={1}
                    />
                  </div>
                </div>

                {/* Dimensions Section */}
                <div className="text-left space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                    Dimensions (Length / Width / Height)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        placeholder="L"
                        value={form.lengthCm} 
                        onChange={(e) => setForm({...form, lengthCm: Math.max(1, +e.target.value)})}
                        className="input-field pr-8 px-3.5 py-3 bg-[var(--color-background)] text-center w-full border rounded-[var(--radius-card)]"
                        style={{ borderColor: 'var(--color-border)' }}
                        required 
                        min={1}
                      />
                      <span className="absolute right-2.5 text-[10px] font-bold text-slate-400">cm</span>
                    </div>
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        placeholder="W"
                        value={form.widthCm} 
                        onChange={(e) => setForm({...form, widthCm: Math.max(1, +e.target.value)})}
                        className="input-field pr-8 px-3.5 py-3 bg-[var(--color-background)] text-center w-full border rounded-[var(--radius-card)]"
                        style={{ borderColor: 'var(--color-border)' }}
                        required 
                        min={1}
                      />
                      <span className="absolute right-2.5 text-[10px] font-bold text-slate-400">cm</span>
                    </div>
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        placeholder="H"
                        value={form.heightCm} 
                        onChange={(e) => setForm({...form, heightCm: Math.max(1, +e.target.value)})}
                        className="input-field pr-8 px-3.5 py-3 bg-[var(--color-background)] text-center w-full border rounded-[var(--radius-card)]"
                        style={{ borderColor: 'var(--color-border)' }}
                        required 
                        min={1}
                      />
                      <span className="absolute right-2.5 text-[10px] font-bold text-slate-400">cm</span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Menu for Vehicle selection */}
                <div className="text-left space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({...form, vehicleType: e.target.value as any})}
                    className="input-field px-4 py-3 bg-[var(--color-background)] w-full border rounded-[var(--radius-card)] focus:outline-none"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <option value="MINI_TEMPO">Mini Tempo (Up to 500 kg)</option>
                    <option value="PICKUP_TRUCK">Pickup Truck (Up to 1.5 Tons)</option>
                    <option value="CONTAINER_3TON">3-Ton Container (Up to 3.0 Tons)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full text-white py-3.5 rounded-[var(--radius-button)] font-bold transition-all hover:bg-[var(--color-primary-hover)] text-center text-sm shadow-md mt-6"
                style={{ backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}
              >
                Calculate Estimate Price
              </button>
            </form>

            {/* Price Result Panel */}
            <div className="lg:col-span-5 h-full">
              <div className="p-8 rounded-[var(--radius-card)] border bg-[var(--color-card)] space-y-6 shadow-sm h-full flex flex-col justify-between" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
                {!quote ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 my-auto h-full">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400">
                      <Receipt size={32} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-base text-[var(--color-text-main)]">No Quote Calculated</h4>
                      <p className="text-xs max-w-[280px]" style={{ color: 'var(--color-text-muted)' }}>
                        Fill out the details on the left and click <strong>"Calculate Estimate Price"</strong> to see your detailed breakdown.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold pb-2 border-b border-[var(--color-border)] text-left" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
                        Price Breakdown Details
                      </h3>
                      <div className="space-y-3.5 text-sm text-left" style={{ color: 'var(--color-text-muted)' }}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-500">Base Fare:</span>
                          <span className="font-bold text-[var(--color-text-main)]">₹{quote.basePrice}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-500">Distance Cost ({quote.distanceKm} km):</span>
                          <span className="font-bold text-[var(--color-text-main)]">₹{quote.pricePerKm * quote.distanceKm}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-500">Billed Weight Charge ({quote.chargeable} kg):</span>
                          <span className="font-bold text-[var(--color-text-main)]">₹{Math.round(quote.costPerUnit * quote.chargeable)}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed pt-1 border-t border-dashed border-[var(--color-border)]" style={{ color: 'var(--color-text-muted)' }}>
                          * Billed weight is calculated as the larger of actual weight ({form.weightKg}kg) and package volume weight ({quote.volumetric}kg).
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                      <div className="flex justify-between items-center text-left">
                        <span className="text-sm font-bold text-[var(--color-text-main)]">Estimated Total:</span>
                        <span className="text-3xl font-extrabold text-[var(--color-text-main)]">₹{quote.estimated}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => navigate(isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register')}
                        className="w-full text-white py-3.5 rounded-[var(--radius-button)] font-bold transition-all hover:bg-[var(--color-primary-hover)] text-center text-sm shadow-md"
                        style={{ backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}
                      >
                        {isAuthenticated ? (user?.role === 'DRIVER' ? 'Go to Dashboard' : 'Proceed to Book Delivery') : 'Proceed to Book Delivery'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fleet Catalog Section */}
          <div className="mt-16 space-y-6 text-left">
            <h3 className="text-xl font-bold border-b border-[var(--color-border)] pb-3" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              Our Cargo Fleet & Rates
            </h3>
            {/* Desktop Grid Layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {/* Mini Tempo Details */}
              <div className="p-6 rounded-[var(--radius-card)] border bg-[var(--color-card)] flex flex-col justify-between space-y-4" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      <Truck size={22} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base" style={{ color: 'var(--color-text-main)' }}>Mini Tempo</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Up to 500 kg</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    Perfect for swift local deliveries of household items, boxes, and small shipments. Highly maneuverable in tight city streets.
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Base Price</span>
                    <span className="text-base font-extrabold" style={{ color: 'var(--color-text-main)' }}>₹50</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Distance Rate</span>
                    <span className="text-base font-extrabold" style={{ color: 'var(--color-text-main)' }}>₹12 / km</span>
                  </div>
                </div>
              </div>

              {/* Pickup Truck Details */}
              <div className="p-6 rounded-[var(--radius-card)] border bg-[var(--color-card)] flex flex-col justify-between space-y-4" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      <Truck size={22} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base" style={{ color: 'var(--color-text-main)' }}>Pickup Truck</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Up to 1.5 Tons</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    Ideal for commercial cargo, medium-sized furniture, and construction materials. Offers an open deck layout for easy loading.
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Base Price</span>
                    <span className="text-base font-extrabold" style={{ color: 'var(--color-text-main)' }}>₹80</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Distance Rate</span>
                    <span className="text-base font-extrabold" style={{ color: 'var(--color-text-main)' }}>₹15 / km</span>
                  </div>
                </div>
              </div>

              {/* 3-Ton Container Details */}
              <div className="p-6 rounded-[var(--radius-card)] border bg-[var(--color-card)] flex flex-col justify-between space-y-4" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      <Truck size={22} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base" style={{ color: 'var(--color-text-main)' }}>3-Ton Container</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Up to 3.0 Tons</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    Fully enclosed metal container truck. Ideal for high-value logistics, sensitive industrial freight, and heavy distributions.
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Base Price</span>
                    <span className="text-base font-extrabold" style={{ color: 'var(--color-text-main)' }}>₹150</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Distance Rate</span>
                    <span className="text-base font-extrabold" style={{ color: 'var(--color-text-main)' }}>₹20 / km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Stacked Slider */}
            <div className="md:hidden">
              <SwipeableCardStack
                cards={FLEET_DATA}
                activeIndex={fleetActive}
                onChangeIndex={setFleetActive}
                isFleet={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Shippers Detail Section */}
      <section id="shippers" className="relative py-36 px-6 overflow-hidden animate-fade-in flex items-center min-h-[450px]">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        {/* Blending overlay to ensure readability */}
        <div 
          className="absolute inset-0 z-10"
          style={{ 
            background: 'linear-gradient(to right, rgba(9, 18, 31, 0.96) 35%, rgba(9, 18, 31, 0.8) 70%, rgba(9, 18, 31, 0.45) 100%)',
          }}
        />
        
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8 w-full relative z-20 flex justify-start text-left">
          <div className="max-w-2xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              For Shippers
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Designed to keep cargo moving
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-slate-300">
              Book verified local trucks instantly to ship anything from office supplies to heavy freight. No brokers, no hidden margins, and complete delivery security from start to finish.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => navigate(isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register')}
                className="bg-white text-[var(--color-primary)] px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all hover:bg-slate-100 shadow-lg inline-block text-sm"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Create Shipper Account'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* For Drivers Detail Section */}
      <section id="drivers" className="relative py-36 px-6 overflow-hidden flex items-center min-h-[450px]">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        {/* Blending overlay (aligned from right for alternate layout pattern) */}
        <div 
          className="absolute inset-0 z-10"
          style={{ 
            background: 'linear-gradient(to left, rgba(9, 18, 31, 0.96) 35%, rgba(9, 18, 31, 0.8) 70%, rgba(9, 18, 31, 0.45) 100%)',
          }}
        />
        
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8 w-full relative z-20 flex justify-end text-left">
          <div className="max-w-2xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              For Drivers
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Keep 100% of your earnings
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-slate-300">
              Get matched directly with local shippers needing vehicle capacity. We take zero commission cuts from your matched base fares, keeping more money in your pocket.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => navigate(isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register')}
                className="bg-white text-[var(--color-primary)] px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all hover:bg-slate-100 shadow-lg inline-block text-sm"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Sign Up as a Driver'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 border-t border-b border-[var(--color-border)] animate-fade-in" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8 text-left">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              How We Help You Ship
            </h2>
            <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Simple, reliable shipping tools designed to make moving cargo stress-free.
            </p>
          </div>

          {/* Desktop Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-400" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)] relative">
                <img 
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" 
                  alt="Volumetric Pricing math cargo palettes" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Fair Pricing</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  No surprise fees. We calculate rates automatically based on your cargo dimensions and shipping weight to ensure honest rates.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-400" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)] relative">
                <img 
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80" 
                  alt="OTP Security passcode screen verification" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Secure Handshakes</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Protect your goods. Drivers must enter a security code sent directly to you at both pickup and drop-off to confirm loading and delivery.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-400" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)] relative">
                <img 
                  src="https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80" 
                  alt="Intelligent fleet trucks logistics center warehouse" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Fast & Direct Routes</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Avoid unnecessary delays. Routes are plotted instantly to find the quickest path, avoiding heavy traffic zones and low-clearance bridges.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Stacked Slider */}
          <div className="md:hidden">
            <SwipeableCardStack
              cards={SERVICES_DATA}
              activeIndex={servicesActive}
              onChangeIndex={setServicesActive}
            />
          </div>
        </div>
      </section>
      {/* Capacity Network Section */}
      <section className="py-24 px-6 border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8 text-left">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Our Vehicles
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              A Fleet for Any Cargo Size
            </h2>
            <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Choose from a wide variety of verified local delivery vehicles to match your load.
            </p>
          </div>

          {/* Desktop Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-400" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)] relative">
                <img 
                  src="https://images.unsplash.com/photo-1606185540834-d6e7483ee1a4?auto=format&fit=crop&w=600&q=80" 
                  alt="Smart vehicle matching" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Smart Vehicle Matching</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Our booking system automatically recommends the most cost-effective vehicle class based on your cargo dimensions.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-400" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)] relative">
                <img 
                  src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=600&q=80" 
                  alt="Verified box container truck network" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>On-Demand Booking</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Book mini tempos, utility pickups, or large container trucks instantly whenever you need them—no long-term contracts.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-400" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)] relative">
                <img 
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" 
                  alt="Payload capacity optimization cargo loader" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Space Optimization</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Never pay for empty cargo space. We organize load layouts to ensure you only pay for the exact volume your boxes require.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Stacked Slider */}
          <div className="md:hidden">
            <SwipeableCardStack
              cards={CAPACITY_DATA}
              activeIndex={capacityActive}
              onChangeIndex={setCapacityActive}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
            
            {/* Left Column: Heading and Info Image */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
                Frequently Asked Questions
              </h2>
              <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Everything you need to know about booking, volumetric pricing calculation, and OTP safety verification.
              </p>
              <div className="h-64 rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1521791136368-1a8519007b51?auto=format&fit=crop&w=800&q=80" 
                  alt="Customer support handshake helpdesk" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Column: Accordion Questions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-background)]">
                <h4 className="font-bold text-md mb-2" style={{ color: 'var(--color-text-main)' }}>How is shipment pricing calculated?</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Our volumetric engine takes your cargo dimensions (Length × Width × Height) and computes volumetric weight. The quote uses the larger value between actual weight and volumetric weight, multiplied by the distance.
                </p>
              </div>
              <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-background)]">
                <h4 className="font-bold text-md mb-2" style={{ color: 'var(--color-text-main)' }}>What is the OTP verification system?</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  To ensure cargo safety, the shipper receives a secure Pickup OTP and a Drop-off OTP. The matched driver must input these keys at both points to confirm shipment transfers in the ledger.
                </p>
              </div>
              <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-background)]">
                <h4 className="font-bold text-md mb-2" style={{ color: 'var(--color-text-main)' }}>Can I cancel a booking?</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Yes. You can cancel any cargo request directly from your shipper dashboard as long as a driver has not accepted/claimed it.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-24 px-6" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
            
            {/* Left Column: Heading and Cards */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Support
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
                  Here to Help 24/7
                </h2>
                <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Our dedicated dispatch support team is always standing by to secure your cargo lanes.
                </p>
              </div>
              {/* Desktop grid for Support Cards */}
              <div className="hidden md:grid md:grid-cols-2 gap-6">
                {/* Dispatch Support */}
                <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-card)] space-y-3 shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 mt-1">
                    <PhoneCall size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>24/7 Dispatch Hotline</h4>
                    <p className="text-md font-bold" style={{ color: 'var(--color-text-main)' }}>+1-800-CARGOGO</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Direct line to active dispatch agents.</p>
                  </div>
                </div>

                {/* Billing Support */}
                <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-card)] space-y-3 shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 mt-1">
                    <Receipt size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>Billing & Rates</h4>
                    <p className="text-md font-bold" style={{ color: 'var(--color-text-main)' }}>billing@cargogo.com</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Invoice & volumetric quote inquiries.</p>
                  </div>
                </div>

                {/* Driver Helpdesk */}
                <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-card)] space-y-3 shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 mt-1">
                    <Truck size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>Driver Assistance</h4>
                    <p className="text-md font-bold" style={{ color: 'var(--color-text-main)' }}>drivers@cargogo.com</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Dedicated support for payout & match issues.</p>
                  </div>
                </div>

                {/* General Inquiry */}
                <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-card)] space-y-3 shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 mt-1">
                    <Mail size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>General Support</h4>
                    <p className="text-md font-bold" style={{ color: 'var(--color-text-main)' }}>help@cargogo.com</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>General platform questions (15-min response).</p>
                  </div>
                </div>
              </div>

              {/* Mobile Stacked Slider */}
              <div className="md:hidden">
                <SwipeableCardStack
                  cards={SUPPORT_DATA}
                  activeIndex={supportActive}
                  onChangeIndex={setSupportActive}
                  isSupport={true}
                />
              </div>
            </div>

            {/* Right Column: Dispatch Image */}
            <div className="hidden lg:block lg:col-span-5 h-[340px] rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] shadow-sm">
              <img 
                src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80" 
                alt="Support helpline headset desk" 
                className="w-full h-full object-cover"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-16 px-6 border-t border-slate-800 text-sm transition-all duration-300 animate-fade-in" style={{ background: 'linear-gradient(to right, #050b14, #101c2c)', color: '#94A3B8' }}>
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-slate-800 text-left">
            
            {/* Column 1: Brand & Socials */}
            <div className="space-y-5">
              <div className="flex items-center">
                <span className="px-2 py-0.5 text-xs font-black tracking-tighter text-[#09121F] bg-white rounded" style={{ fontFamily: 'Space Grotesk' }}>
                  Cargo
                </span>
                <span className="text-lg font-black tracking-tight text-white ml-1.5" style={{ fontFamily: 'Space Grotesk' }}>
                  Go
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-350 max-w-xs">
                Next-generation freight coordination, volumetric transit calculation, and secure OTP-verified dispatch networks.
              </p>
              
              {/* Social Channels */}
              <div className="flex gap-4 pt-1">
                <a href="#linkedin" aria-label="LinkedIn" className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded">
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="#twitter" aria-label="Twitter/X" className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded">
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#github" aria-label="GitHub" className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded">
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
              </div>
            </div>
 
            {/* Column 2: Navigation */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Platform</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Volumetric Quote Calculator</a></li>
                <li><a href="#services" className="text-slate-300 hover:text-white transition-colors">Our Services</a></li>
                <li><a href="#faq" className="text-slate-300 hover:text-white transition-colors">FAQ Support</a></li>
                <li><a href="#support" className="text-slate-300 hover:text-white transition-colors">Dispatch Helpline</a></li>
              </ul>
            </div>
 
            {/* Column 3: Interactive Developer & Info Hub */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Developer Hub</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={() => setApiDocsOpen(true)} 
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
                  >
                    API Documentation <ExternalLink size={12} className="text-indigo-400" />
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setStatusOpen(true)} 
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
                  >
                    System Status <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setSlaOpen(true)} 
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Enterprise SLA Terms <Lock size={12} className="text-slate-400" />
                  </button>
                </li>
              </ul>
            </div>
 
            {/* Column 4: Newsletter / Updates */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Insights Newsletter</h4>
              <p className="text-xs leading-relaxed text-slate-300">
                Get quarterly updates on transit metrics, fuel rates, and direct APIs.
              </p>
              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 p-3 bg-slate-900/80 border border-green-800 text-green-400 text-xs rounded font-medium animate-fade-in">
                  <Check size={16} /> Subscribed to insights!
                </div>
              ) : (
                <form className="space-y-2" onSubmit={handleNewsletterSubmit}>
                  <input 
                    type="email" 
                    placeholder="corp@address.com" 
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={newsletterSubmitting}
                    className="w-full px-4 py-2 text-xs font-bold text-[#09121F] bg-white hover:bg-slate-100 rounded transition-colors shadow-sm disabled:opacity-50"
                  >
                    {newsletterSubmitting ? 'Subscribing...' : 'Join Insights List'}
                  </button>
                </form>
              )}
            </div>
 
          </div>
 
          {/* Bottom Footer Section */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="text-slate-400">
              &copy; {new Date().getFullYear()} CargoGo Technologies Inc. All rights reserved. &bull; Registered DOT No. 3940822
            </div>
            <div className="flex gap-6 text-slate-400">
              <button type="button" onClick={() => setSlaOpen(true)} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer">Security SLA</button>
              <button type="button" onClick={() => setStatusOpen(true)} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer">Platform Status</button>
            </div>
          </div>
        </div>
      </footer>

      {/* API Explorer Modal */}
      {apiDocsOpen && <ApiDocsModal onClose={() => setApiDocsOpen(false)} />}

      {/* Platform Status Modal */}
      {statusOpen && <StatusModal onClose={() => setStatusOpen(false)} />}

      {/* Security SLA Modal */}
      {slaOpen && <SlaModal onClose={() => setSlaOpen(false)} />}
    </div>
  );
}

export default LandingPage;
