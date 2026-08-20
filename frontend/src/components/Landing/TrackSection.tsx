import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function TrackSection() {
  const [trackingId, setTrackingId] = useState('');
  const navigate = useNavigate();

  return (
    <section id="track" className="py-12 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Card size="lg" className="border-l-4 border-l-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md text-left space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">Track Your Cargo Instantly</h3>
            <p className="text-xs text-slate-500">Enter your Booking ID below to check live status. No registration required.</p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (trackingId.trim()) navigate(`/track/${trackingId.trim()}`); }}
            className="w-full md:w-auto flex flex-col sm:flex-row gap-3 flex-1 max-w-lg"
          >
            <input
              type="text"
              placeholder="Enter Booking ID (e.g. 550e8400...)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="flex-1 h-10 px-3.5 bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-mono"
              required
            />
            <Button
              type="submit"
              className="shrink-0"
            >
              Track Shipment
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
