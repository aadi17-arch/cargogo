import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import { driverService } from '@/services/driver.service';
import { bookingService } from '@/services/booking.service';
import { VrpRouteResponse } from '@/types/driver.types';
import { ScheduledJob } from '@/types/booking.types';
import { toast } from 'react-hot-toast';
import { LocateFixed } from 'lucide-react';
import MapView, { MapMarker } from '@/components/map/MapView';
import DashboardHeader from '@/components/ui/DashboardHeader';
import MapOverlayCard from '@/components/ui/MapOverlayCard';
import LocateButton from '@/components/ui/LocateButton';
import { useAddressResolver } from '@/hooks/useAddressResolver';
import { formatDate } from '@/utils/formatters';
import L from 'leaflet';
import BidModal from '@/components/driver/BidModal';
import ScheduledJobs from '@/components/driver/ScheduledJobs';
import JobsBoard from '@/components/driver/JobsBoard';
import ActiveTrips from '@/components/driver/ActiveTrips';

function DriverDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, fetchPendingBookings, acceptBooking: apiAcceptBooking } = useBooking();
  const { isOnline, updateStatus } = useDriverStatus();
  const { acceptBid: socketAcceptBid, rejectBid: socketRejectBid, commitScheduledJob: socketCommitScheduledJob } = useSocket(token);

  const [bid, setBid] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'jobs_board' | 'schedule' | 'past_jobs'>('my_jobs');
  const [routeData, setRouteData] = useState<VrpRouteResponse | null>(null);
  const [, setLoadingRoute] = useState(false);
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [driverLocationName, setDriverLocationName] = useState<string>('Detecting...');
  const lastGeocodedCoords = useRef<[number, number] | null>(null);

  const { resolveSingleAddress } = useAddressResolver();

  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [availableScheduledJobs, setAvailableScheduledJobs] = useState<ScheduledJob[]>([]);
  const [committingJobId, setCommittingJobId] = useState<string | null>(null);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const { updateLocation: socketUpdateLocation } = useSocket(token);

  const resolveDriverAddress = async (lat: number, lng: number) => {
    const name = await resolveSingleAddress(lat, lng);
    setDriverLocationName(name);
  };

  useEffect(() => {
    if (!driverCoords) return;
    const [lat, lng] = driverCoords;
    if (!lastGeocodedCoords.current ||
        Math.abs(lastGeocodedCoords.current[0] - lat) > 0.001 ||
        Math.abs(lastGeocodedCoords.current[1] - lng) > 0.001) {
      lastGeocodedCoords.current = [lat, lng];
      resolveDriverAddress(lat, lng);
    }
  }, [driverCoords]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDriverCoords([pos.coords.latitude, pos.coords.longitude]),
        () => setDriverCoords([19.0760, 72.8777])
      );
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      await fetchMyBookings();
      const p = await fetchPendingBookings();
      setPendingBookings(p || []);
    } catch (err: any) {
      toast.error('Failed to load jobs: ' + (err.message || 'Unknown error'));
    }
  }, []);

  const loadScheduledJobs = useCallback(async () => {
    setLoadingScheduled(true);
    try {
      const [mine, available] = await Promise.all([
        bookingService.getScheduledJobs(),
        bookingService.getAvailableScheduledJobs()
      ]);
      setScheduledJobs(mine);
      setAvailableScheduledJobs(available);
    } catch (err: any) {
      toast.error('Failed to load scheduled jobs: ' + (err.message || 'Unknown error'));
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  const fetchRoute = useCallback(async () => {
    setLoadingRoute(true);
    try {
      const res = await driverService.getOptimizedRoute(driverCoords?.[0], driverCoords?.[1]);
      setRouteData(res);
      toast.success('Route optimized successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to optimize route');
    } finally {
      setLoadingRoute(false);
    }
  }, [driverCoords]);

  useEffect(() => {
    loadData();
  }, []);

  const handleCommitScheduledJob = async (bookingId: string) => {
    setCommittingJobId(bookingId);
    try {
      socketCommitScheduledJob(bookingId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to commit to job');
      setCommittingJobId(null);
    }
  };

  useSocketListener('bid:new', (newBid: any) => {
    setBid(newBid);
    setCountdown(30);
    toast('New Delivery Request received!', { icon: '🔔' });
  });

  useSocketListener('booking:status', () => {
    loadData();
  });

  useSocketListener('scheduled:committed', (data: any) => {
    toast.success(`✅ Committed! Job scheduled for ${formatDate(data.scheduledAt)}`);
    setCommittingJobId(null);
    loadScheduledJobs();
  });

  useEffect(() => {
    if (!bid) return;
    const timer = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { setBid(null); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [bid]);

  const toggleOnline = async () => {
    try {
      if (!isOnline) {
        navigator.geolocation.getCurrentPosition(
          async (position) => { const { latitude, longitude } = position.coords; await updateStatus('ONLINE', latitude, longitude); },
          (e) => toast.error('Location access is required to go online: ' + e.message)
        );
      } else {
        await updateStatus('OFFLINE', 0, 0);
      }
    } catch (err: any) { toast.error(err.message || 'Failed to update status'); }
  };
  useEffect(() => {
    const sendRequestTimeToTime = () => {
      if (!isOnline) return;

      navigator.geolocation.getCurrentPosition(
        (currentPositon) => {
          const { latitude, longitude } = currentPositon.coords;
          socketUpdateLocation(latitude, longitude);
        },
        ()=>{},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
    sendRequestTimeToTime();
    const timer = setInterval(sendRequestTimeToTime, 20000);
    return () => clearInterval(timer);

  },[isOnline]);

  const handleAcceptBid = () => {
    try { socketAcceptBid(bid.bookingId); setBid(null); }
    catch (err: any) { toast.error('Error accepting bid: ' + err.message); }
  };

  const handleRejectBid = () => {
    try { socketRejectBid(bid.bookingId); setBid(null); }
    catch (err: any) { toast.error('Error rejecting bid: ' + err.message); }
  };

  const handleAcceptPending = async (bookingId: string) => {
    try { await apiAcceptBooking(bookingId); setActiveTab('my_jobs'); await loadData(); }
    catch (err: any) { toast.error(err.message || 'Failed to accept shipment'); }
  };

  const activeBookings = bookings.filter((b: any) => !['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(b.status));
  const pastBookings = bookings.filter((b: any) => ['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(b.status));

  const mapCenter: [number, number] = driverCoords
    ? driverCoords
    : (routeData?.route && routeData.route.length > 0)
      ? [routeData.route[0].location.lat, routeData.route[0].location.lng]
      : [19.0760, 72.8777];

  const mapMarkers = useMemo(() => {
    const list: MapMarker[] = [];
    if (driverCoords) {
      list.push({ lat: driverCoords[0], lng: driverCoords[1], popupText: 'Your Location (Driver)', isDriver: true });
    }
    if (routeData?.route) {
      routeData.route.forEach((stop: any, idx: number) => {
        list.push({
          lat: stop.location.lat,
          lng: stop.location.lng,
          popupText: `Stop ${idx + 1}: ${stop.type === 'PICKUP' ? 'Pickup' : 'Dropoff'} (${stop.cargoType})`
        });
      });
    }
    return list;
  }, [driverCoords, routeData]);

  const routePolyline = useMemo(() => {
    const positions: [number, number][] = [];
    if (driverCoords) positions.push(driverCoords);
    if (routeData?.route) {
      routeData.route.forEach((stop: any) => {
        positions.push([stop.location.lat, stop.location.lng]);
      });
    }
    return positions;
  }, [driverCoords, routeData]);

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-white flex flex-col">
      <style>{`
        .leaflet-control-attribution { display: none !important; }
        ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>


      <DashboardHeader
        title="Driver Dashboard"
        tabs={[
          { id: 'my_jobs', label: `Jobs (${activeBookings.length})` },
          { id: 'jobs_board', label: `Available (${pendingBookings.length})` },
          { id: 'schedule', label: `Schedule (${scheduledJobs.length})` },
          { id: 'past_jobs', label: `History (${pastBookings.length})` },
        ]}
        activeTab={activeTab}
        onChange={(id) => {
          setActiveTab(id as any);
          if (id === 'jobs_board') loadData();
          if (id === 'schedule') loadScheduledJobs();
        }}
      />

      {activeTab === 'my_jobs' ? (
        <div className="flex-1 w-full p-2 sm:p-4 relative flex flex-col min-h-0 overflow-hidden bg-white">
          <div className="relative w-full h-full flex-1 rounded-xl border border-slate-200 shadow-xs overflow-hidden bg-white">

            <div className="absolute inset-0 z-0 h-full w-full">
              <MapView
                center={mapCenter}
                zoom={driverCoords ? 13 : 5}
                markers={mapMarkers}
                routePositions={routePolyline}
                polylineColor="#0F172A"
                setMap={setMap}
              />
            </div>


            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md">
                <div className={`w-2 h-2 rounded-sm shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold text-slate-900 font-heading">{isOnline ? 'Online' : 'Offline'}</span>
                <button
                  type="button"
                  onClick={toggleOnline}
                  disabled={isOnline && activeBookings.length > 0}
                  className="text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-md px-2.5 py-1 transition-all cursor-pointer font-heading disabled:opacity-50"
                >
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <LocateFixed size={11} className="text-slate-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 truncate font-body max-w-[140px]" title={driverLocationName}>
                  {driverLocationName}
                </span>
              </div>
              <LocateButton
                onClick={() => { if (driverCoords && map) map.setView(driverCoords, 14, { animate: true }); }}
              />
            </div>


            {bid && (
              <BidModal
                bid={bid}
                countdown={countdown}
                onAccept={handleAcceptBid}
                onReject={handleRejectBid}
              />
            )}


            <MapOverlayCard>
              <ActiveTrips
                activeBookings={activeBookings}
                isOnline={isOnline}
                onRefresh={loadData}
                onBrowseJobs={() => { setActiveTab('jobs_board'); loadData(); }}
              />
            </MapOverlayCard>


            <ActiveTrips
              activeBookings={activeBookings}
              isOnline={isOnline}
              onRefresh={loadData}
              onBrowseJobs={() => { setActiveTab('jobs_board'); loadData(); }}
              onToggleOnline={toggleOnline}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full bg-white flex flex-col overflow-y-auto px-4 py-4 space-y-3 text-left">
          {activeTab === 'jobs_board' && (
            <JobsBoard
              type="available"
              bookings={pendingBookings}
              onRefresh={loadData}
              onAccept={handleAcceptPending}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduledJobs
              scheduledJobs={scheduledJobs}
              availableScheduledJobs={availableScheduledJobs}
              loading={loadingScheduled}
              committingJobId={committingJobId}
              onRefresh={loadScheduledJobs}
              onCommit={handleCommitScheduledJob}
              onOptimizeRoute={fetchRoute}
            />
          )}

          {activeTab === 'past_jobs' && (
            <JobsBoard
              type="history"
              bookings={pastBookings}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
