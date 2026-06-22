import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TrackSection() {
  const [trackingId, setTrackingId] = useState('');
  const navigate = useNavigate();

  return (
    <section id="track" className="py-12 px-6" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-primary)] p-8 rounded-[var(--radius-card)] flex flex-col md:flex-row items-center justify-between gap-8 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="max-w-md text-left space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-heading)' }}>Track Your Cargo Instantly</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Enter your Booking ID below to check live status. No registration required.</p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (trackingId.trim()) navigate(`/track/${trackingId.trim()}`); }}
            className="w-full md:w-auto flex flex-col sm:flex-row gap-3 flex-1 max-w-lg"
          >
            <input type="text" placeholder="Enter Booking ID (e.g. 550e8400...)" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} className="input-field flex-1 px-4 py-3 bg-[var(--color-background)]" required />
            <button type="submit" className="text-white px-8 py-3 rounded-[var(--radius-button)] font-bold transition-all hover:bg-[var(--color-primary-hover)] shrink-0" style={{ backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-heading)', fontSize: '14px' }}>
              Track Shipment
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
