import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

function LandingPage() {
  const navigate = useNavigate();
  const [trackingIdInput, setTrackingIdInput] = useState('');

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

  const calculateQuote = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]" style={{ fontFamily: 'var(--font-body)' }}>
      <Navbar />

      {/* Hero Section with Full Flipped Background Image for Perfect Blending */}
      <header className="relative px-8 sm:px-16 border-b border-[var(--color-border)] flex items-center overflow-hidden" style={{ height: 'calc(100vh - 64px)', minHeight: '500px' }}>
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
              Next-Gen Freight Booking & Intelligent Routing
            </h1>
            <p className="text-lg sm:text-xl font-medium text-slate-200">
              Experience the future of logistics with automatic pricing, live tracking, and OTP-verified dispatch. Streamline your supply chain with our intelligent routing technology.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => navigate('/register')}
                className="bg-white text-[var(--color-primary)] px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all hover:bg-slate-100 shadow-lg"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '15px' }}
              >
                Start Shipping
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
      <section id="track" className="py-16 px-6 border-b border-[var(--color-border)]">
        <div className="max-w-[1550px] mx-auto px-4 sm:px-8">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-[var(--radius-card)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-md text-left">
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
                Track your cargo instantly
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                No registration required. Enter your unique booking verification ID below to check live shipping status.
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
                placeholder="Enter Tracking ID (e.g. 550e8400...)"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="input-field flex-1"
                required
              />
              <button 
                type="submit"
                className="text-white px-6 py-3 rounded-[var(--radius-button)] font-bold transition-all hover:bg-[var(--color-primary-hover)] shrink-0"
                style={{ backgroundColor: 'var(--color-text-main)', fontFamily: 'var(--font-heading)', fontSize: '14px' }}
              >
                Track Shipment
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Pricing Estimator Section */}
      <section id="pricing" className="py-20 px-6 border-b border-[var(--color-border)]">
        <div className="max-w-[1550px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              Instant Delivery Price Estimator
            </h2>
            <p className="text-md font-medium" style={{ color: 'var(--color-text-muted)' }}>
              No hidden fees. Input your cargo dimensions and distance to see our transparent breakdown.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Calculator Input Form */}
            <form onSubmit={calculateQuote} className="lg:col-span-7 p-6 rounded-[var(--radius-card)] border bg-[var(--color-card)] space-y-4" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                    Weight (kg)
                  </label>
                  <input 
                    type="number" 
                    value={form.weightKg} 
                    onChange={(e) => setForm({...form, weightKg: +e.target.value})}
                    className="input-field"
                    required 
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                    Distance (km)
                  </label>
                  <input 
                    type="number" 
                    value={form.distanceKm} 
                    onChange={(e) => setForm({...form, distanceKm: +e.target.value})}
                    className="input-field"
                    required 
                    min={1}
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                  Dimensions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative flex items-center">
                    <input 
                      type="number" 
                      placeholder="L"
                      value={form.lengthCm} 
                      onChange={(e) => setForm({...form, lengthCm: +e.target.value})}
                      className="input-field pr-8"
                      required 
                      min={1}
                    />
                    <span className="absolute right-2.5 text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>cm</span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type="number" 
                      placeholder="W"
                      value={form.widthCm} 
                      onChange={(e) => setForm({...form, widthCm: +e.target.value})}
                      className="input-field pr-8"
                      required 
                      min={1}
                    />
                    <span className="absolute right-2.5 text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>cm</span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type="number" 
                      placeholder="H"
                      value={form.heightCm} 
                      onChange={(e) => setForm({...form, heightCm: +e.target.value})}
                      className="input-field pr-8"
                      required 
                      min={1}
                    />
                    <span className="absolute right-2.5 text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>cm</span>
                  </div>
                </div>
              </div>

              <div className="text-left">
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                  Vehicle Type
                </label>
                <select 
                  value={form.vehicleType} 
                  onChange={(e) => setForm({...form, vehicleType: e.target.value as any})}
                  className="input-field"
                >
                  <option value="MINI_TEMPO">Mini Tempo</option>
                  <option value="PICKUP_TRUCK">Pickup Truck</option>
                  <option value="CONTAINER_3TON">3-Ton Container</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full text-white p-3 rounded-[var(--radius-button)] font-bold transition-all hover:opacity-90 pt-4"
                style={{ backgroundColor: 'var(--color-primary-hover)', fontFamily: 'var(--font-heading)', fontSize: '14px' }}
              >
                Calculate Estimate Price
              </button>
            </form>

            {/* Price Result Box */}
            <div className="lg:col-span-5">
              {quote ? (
                <div className="p-6 rounded-[var(--radius-card)] border bg-[var(--color-card)] space-y-4" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
                  <h3 className="text-lg font-bold pb-2 border-b border-[var(--color-border)] text-left" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
                    Price Breakdown Details
                  </h3>
                  <div className="space-y-3 text-sm text-left" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex justify-between">
                      <span>Base Fare:</span>
                      <span className="font-semibold text-[var(--color-text-main)]">₹{quote.basePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance Cost ({quote.distanceKm} km):</span>
                      <span className="font-semibold text-[var(--color-text-main)]">₹{quote.pricePerKm * quote.distanceKm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billed Weight Charge ({quote.chargeable} kg):</span>
                      <span className="font-semibold text-[var(--color-text-main)]">₹{Math.round(quote.costPerUnit * quote.chargeable)}</span>
                    </div>
                    <p className="text-[10px] leading-relaxed pt-1" style={{ color: 'var(--color-text-muted)' }}>
                      * Billed weight is calculated as the larger of actual weight ({form.weightKg}kg) and volumetric weight ({quote.volumetric}kg).
                    </p>
                    <div className="border-t border-[var(--color-border)] pt-4 flex justify-between items-center">
                      <span className="text-sm font-bold text-[var(--color-text-main)]">Estimated Total:</span>
                      <span className="text-3xl font-extrabold text-[var(--color-text-main)]">₹{quote.estimated}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/register')}
                    className="w-full text-white py-3 rounded-[var(--radius-button)] font-bold transition-all hover:opacity-90 mt-2 text-center"
                    style={{ backgroundColor: '#0F1B2E', fontFamily: 'var(--font-heading)', fontSize: '13px' }}
                  >
                    Proceed to Book Delivery
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-[var(--radius-card)] border bg-[var(--color-card)] text-center py-20" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)', color: 'var(--color-text-muted)' }}>
                  <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Enter details and click calculate to view your quote breakdown.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* For Shippers Detail Section */}
      <section id="shippers" className="relative py-24 px-6 overflow-hidden animate-fade-in">
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
        
        <div className="max-w-[1550px] mx-auto px-4 sm:px-8 relative z-20 text-left">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 rounded-full">
              For Shippers
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Designed to keep cargo moving seamlessly
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Whether you are dispatching office supplies, heavy merchandise, or personal appliances, our platform bridges the gap to reliable freight transport without agency margins.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-white">Volumetric Math Estimator</h4>
                <p className="text-xs text-slate-400">Charges are computed using cargo shapes and actual weight, protecting you from arbitrary markups.</p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Secure Handshake Verification</h4>
                <p className="text-xs text-slate-400">High-value cargo matches are sealed using individual security keys generated only on your screen.</p>
              </div>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => navigate('/register')}
                className="bg-white text-[var(--color-primary)] px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all hover:bg-slate-100 shadow-lg inline-block text-sm"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Create Shipper Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* For Drivers Detail Section */}
      <section id="drivers" className="relative py-24 px-6 overflow-hidden">
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
        
        <div className="max-w-[1550px] mx-auto px-4 sm:px-8 relative z-20 flex justify-end text-left">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 rounded-full">
              For Drivers
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Run cargo, earn instantly, and optimize routes
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Connect directly with local businesses needing freight capacities. We take zero cuts of your matched base fares, keeping money in your pocket.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-white">Automatic Smart Route Plotting</h4>
                <p className="text-xs text-slate-400">Receive live maps and route guides to load points based on vehicle payload size limits.</p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Prompt Ledger Settlements</h4>
                <p className="text-xs text-slate-400">Your driver balance updates instantly as soon as drop-off key validations succeed.</p>
              </div>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => navigate('/register')}
                className="bg-white text-[var(--color-primary)] px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all hover:bg-slate-100 shadow-lg inline-block text-sm"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Join as a Dispatch Partner
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 bg-[var(--color-card)] border-t border-b border-[var(--color-border)] animate-fade-in">
        <div className="max-w-[1550px] mx-auto px-4 sm:px-8 text-left">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              Our Logistics Services
            </h2>
            <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>
              We've replaced the manual complexities of cargo shipping with automated, reliable systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-[var(--radius-card)] border bg-[var(--color-background)] overflow-hidden shadow-sm flex flex-col" style={{ borderColor: 'var(--color-border)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)]">
                <img 
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" 
                  alt="Volumetric Pricing math cargo palettes" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Volumetric Pricing</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Say goodbye to arbitrary pricing. We calculate shipping weights dynamically using cargo physical volume to ensure honest rates.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-[var(--radius-card)] border bg-[var(--color-background)] overflow-hidden shadow-sm flex flex-col" style={{ borderColor: 'var(--color-border)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)]">
                <img 
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80" 
                  alt="OTP Security passcode screen verification" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>OTP Security Verification</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Protect high-value shipments. Drivers must enter verification keys shared directly with the customer at both pickup and drop-off.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-[var(--radius-card)] border bg-[var(--color-background)] overflow-hidden shadow-sm flex flex-col" style={{ borderColor: 'var(--color-border)' }}>
              <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)]">
                <img 
                  src="https://images.unsplash.com/photo-1519003722824-192d992a7de6?auto=format&fit=crop&w=600&q=80" 
                  alt="Intelligent fleet trucks logistics center warehouse" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3 flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Intelligent Fleet Routing</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Maximize driver efficiency. Routes are plotted automatically by considering multiple pickup points and vehicle weight limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Overview Section */}
      <section className="py-20 px-6">
        <div className="max-w-[1550px] mx-auto px-4 sm:px-8 text-left">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              Our Fleet Selection
            </h2>
            <p className="text-md font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Choose the perfect vehicle size matching your cargo requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Vehicle Card 1 */}
            <div className="rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-48 w-full overflow-hidden border-b border-[var(--color-border)]">
                <img 
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=600&q=80" 
                  alt="Mini Tempo delivery van" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4 flex-1">
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Mini Tempo</h3>
                <div className="py-2 font-mono text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>₹50 Base</div>
                <ul className="text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
                  <li>Best for small package loads</li>
                  <li>Weight Limit: Up to 500 kg</li>
                  <li>Per-Km Cost: ₹12/km</li>
                </ul>
              </div>
            </div>

            {/* Vehicle Card 2 */}
            <div className="rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-48 w-full overflow-hidden border-b border-[var(--color-border)]">
                <img 
                  src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80" 
                  alt="Pickup Truck loaded with cargo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4 flex-1">
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Pickup Truck</h3>
                <div className="py-2 font-mono text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>₹80 Base</div>
                <ul className="text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
                  <li>Best for home furnishings</li>
                  <li>Weight Limit: Up to 1,200 kg</li>
                  <li>Per-Km Cost: ₹15/km</li>
                </ul>
              </div>
            </div>

            {/* Vehicle Card 3 */}
            <div className="rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
              <div className="h-48 w-full overflow-hidden border-b border-[var(--color-border)]">
                <img 
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80" 
                  alt="3-Ton Container commercial box truck" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4 flex-1">
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>3-Ton Container</h3>
                <div className="py-2 font-mono text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>₹150 Base</div>
                <ul className="text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
                  <li>Best for commercial freight</li>
                  <li>Weight Limit: Up to 3,000 kg</li>
                  <li>Per-Km Cost: ₹20/km</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 text-left">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-md font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Everything you need to know about booking, pricing, and driver verification.
            </p>
          </div>
          <div className="space-y-6">
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
      </section>

      {/* Support Section */}
      <section id="support" className="py-20 px-6">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
              Here to Help 24/7
            </h2>
            <p className="text-md font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Our dedicated dispatch support team is always standing by to secure your cargo lanes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-card)] space-y-2 text-left">
              <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>Email Assistance</h4>
              <p className="text-lg font-bold text-indigo-600">help@cargogo.com</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Expect response within 15 minutes.</p>
            </div>
            <div className="p-6 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-card)] space-y-2 text-left">
              <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>Support Hotline</h4>
              <p className="text-lg font-bold text-indigo-600">+1-800-CARGOGO</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Toll-free cargo assistance line.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 border-t border-[var(--color-border)] bg-[var(--color-card)] text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <div className="max-w-[1550px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-base font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>CargoGo Logistics Partners</span>
            <p className="text-xs">Secure commercial and personal cargo transportation dispatch.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <span>Support: help@cargogo.com</span>
            <span>Hotline: +1-800-CARGOGO</span>
          </div>
          <div className="text-xs">
            &copy; {new Date().getFullYear()} CargoGo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
