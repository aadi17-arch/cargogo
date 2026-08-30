import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import PaymentModal from '@/components/dashboard/PaymentModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import MapView, { MapMarker } from '@/components/map/MapView';
import DashboardHeader from '@/components/ui/DashboardHeader';
import MapOverlayCard from '@/components/ui/MapOverlayCard';
import LocateButton from '@/components/ui/LocateButton';
import { toast } from 'react-hot-toast';
import { geocodingService } from '@/services/geocoding.service';
import BookingForm, { BookingFormData } from '@/components/booking/BookingForm';
import ShipmentsList from '@/components/dashboard/ShipmentsList';

function ShipperDashboard() {
  const { token } = useAuth();
  const { bookings, fetchMyBookings, createBooking: apiCreateBooking, cancelBooking } = useBooking();
  const { bookCargo } = useSocket(token);

  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeView, setActiveView] = useState<'book' | 'bookings'>('book');

  const [form, setForm] = useState<BookingFormData>({
    pickupLat: null,
    pickupLng: null,
    pickupAddress: '',
    dropoffLat: null,
    dropoffLng: null,
    dropoffAddress: '',
    cargoType: 'Electronics',
    weightKg: 50,
    lengthCm: 100,
    widthCm: 60,
    heightCm: 40,
    vehicleType: 'MINI_TEMPO'
  });

  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([]);

  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);

  const reverseGeocode = async (lat: number, lng: number, type: 'pickup' | 'dropoff') => {
    try {
      const data = await geocodingService.reverse(lat, lng);
      const displayName = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (type === 'pickup') {
        setPickupSearch(displayName);
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng, pickupAddress: displayName }));
      } else {
        setDropoffSearch(displayName);
        setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng, dropoffAddress: displayName }));
      }
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (type === 'pickup') {
        setPickupSearch(fallback);
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng, pickupAddress: fallback }));
      } else {
        setDropoffSearch(fallback);
        setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng, dropoffAddress: fallback }));
      }
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Location services are not supported by your browser.');
      return;
    }
    setPickupSearch('Locating current address...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setUserLocation([lat, lng]);
        setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
        reverseGeocode(lat, lng, 'pickup');
      },
      (error) => {
        toast.error(`Location Error: ${error.message}`);
        setPickupSearch('');
      }
    );
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  useSocketListener('booking-accepted', (data: any) => {
    toast.success(`Driver ${data.driverName} has accepted your booking!`);
    fetchMyBookings();
  });

  useSocketListener('no-drivers', (data: any) => {
    toast.error(`Driver matching update: ${data.message}`);
    fetchMyBookings();
  });

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { driverService } = await import('@/services/driver.service');
        let data = await driverService.getOnlineDrivers();
        if (!data || data.length < 8) {
          const centerLat = userLocation ? userLocation[0] : 23.6517;
          const centerLng = userLocation ? userLocation[1] : 86.4678;
          const simulated = Array.from({ length: 14 }).map((_, i) => ({
            id: `sim-driver-${i}`,
            latitude: centerLat + (Math.random() - 0.5) * 0.04,
            longitude: centerLng + (Math.random() - 0.5) * 0.04,
            user: { name: `Driver #${i + 1}`, vehicle: { type: i % 2 === 0 ? 'Mini Tempo' : 'Pickup Truck' } }
          }));
          data = [...(data || []), ...simulated];
        }
        setOnlineDrivers(data);
      } catch (err) {
        console.warn(err);
      }
    };
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 10000);
    return () => clearInterval(interval);
  }, [userLocation]);

  const mapMarkers = useMemo(() => {
    const list: MapMarker[] = [];
    onlineDrivers.forEach((d) => {
      const lat = parseFloat(d.latitude || d.lat);
      const lng = parseFloat(d.longitude || d.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        list.push({
          lat,
          lng,
          isDriver: true,
          popupText: `🚚 ${d.user?.name || 'Driver'} (${d.user?.vehicle?.type || 'Available'})`
        });
      }
    });
    if (form.pickupLat !== null && form.pickupLng !== null) {
      list.push({
        lat: form.pickupLat,
        lng: form.pickupLng,
        popupText: 'Pickup (Drag me)',
        draggable: true,
        onDragEnd: (lat, lng) => {
          setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }));
          reverseGeocode(lat, lng, 'pickup');
        },
        markerRef: pickupMarkerRef
      });
    }
    if (form.dropoffLat !== null && form.dropoffLng !== null) {
      list.push({
        lat: form.dropoffLat,
        lng: form.dropoffLng,
        popupText: 'Drop-off (Drag me)',
        draggable: true,
        onDragEnd: (lat, lng) => {
          setForm(prev => ({ ...prev, dropoffLat: lat, dropoffLng: lng }));
          reverseGeocode(lat, lng, 'dropoff');
        },
        markerRef: dropoffMarkerRef
      });
    }
    return list;
  }, [form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng, onlineDrivers]);

  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation) return userLocation;
    if (form.pickupLat !== null && form.pickupLng !== null) return [form.pickupLat, form.pickupLng];
    return [20.5937, 78.9629];
  }, [userLocation, form.pickupLat, form.pickupLng]);

  const routePolyline = useMemo((): [number, number][] => {
    if (form.pickupLat !== null && form.pickupLng !== null && form.dropoffLat !== null && form.dropoffLng !== null) {
      return [
        [form.pickupLat, form.pickupLng],
        [form.dropoffLat, form.dropoffLng]
      ];
    }
    return [];
  }, [form.pickupLat, form.pickupLng, form.dropoffLat, form.dropoffLng]);

  const handleBooking = async () => {
    if (form.pickupLat === null || form.pickupLng === null || form.dropoffLat === null || form.dropoffLng === null) {
      toast.error('Please select locations first.');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        ...form,
        bookingType: 'INSTANT' as const
      };
      const booking = await apiCreateBooking(payload as any);
      toast.success('Shipment booked! Dispatching nearby drivers...');
      bookCargo(booking.id);
      setForm({
        pickupLat: null,
        pickupLng: null,
        pickupAddress: '',
        dropoffLat: null,
        dropoffLng: null,
        dropoffAddress: '',
        cargoType: 'Electronics',
        weightKg: 50,
        lengthCm: 100,
        widthCm: 60,
        heightCm: 40,
        vehicleType: 'MINI_TEMPO'
      });
      setPickupSearch('');
      setDropoffSearch('');
      fetchMyBookings();
      setActiveView('bookings');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await cancelBooking(id);
      toast.success('Booking cancelled.');
      fetchMyBookings();
      setBookingToCancel(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-white flex flex-col">
      <style>{`
        .leaflet-control-attribution {
          display: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      <DashboardHeader
        title="Dashboard"
        tabs={[
          { id: 'book', label: '+ New' },
          { id: 'bookings', label: `History (${bookings.length})` }
        ]}
        activeTab={activeView}
        onChange={(id) => {
          if (id === 'bookings') {
            fetchMyBookings();
          }
          setActiveView(id as any);
        }}
      />

      {activeView === 'book' ? (
        <div className="flex-1 w-full p-2 sm:p-4 relative flex flex-col min-h-0 overflow-hidden bg-white">
          <div className="relative w-full h-full flex-1 rounded-xl border border-slate-200 shadow-xs overflow-hidden bg-white">
            
            <div className="absolute inset-0 z-0 h-full w-full">
              <MapView
                center={mapCenter}
                zoom={userLocation || form.pickupLat !== null ? 14 : 5}
                markers={mapMarkers}
                routePositions={routePolyline}
                polylineColor="#0F172A"
              />
            </div>

            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
              <LocateButton onClick={locateMe} />
            </div>

            <MapOverlayCard>
              <BookingForm
                form={form}
                setForm={setForm}
                pickupSearch={pickupSearch}
                setPickupSearch={setPickupSearch}
                dropoffSearch={dropoffSearch}
                setDropoffSearch={setDropoffSearch}
                onSubmit={handleBooking}
                isLoading={bookingLoading}
              />
            </MapOverlayCard>
          </div>
        </div>
      ) : (
        <ShipmentsList
          bookings={bookings}
          onRefresh={fetchMyBookings}
          onPay={(b) => setSelectedBookingForPayment(b)}
          onCancelClick={(id) => setBookingToCancel(id)}
        />
      )}

      <Modal
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        title="Cancel Delivery"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-600">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setBookingToCancel(null)}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              onClick={() => bookingToCancel && handleCancelBooking(bookingToCancel)}
            >
              Cancel Delivery
            </Button>
          </div>
        </div>
      </Modal>

      {selectedBookingForPayment && (
        <PaymentModal
          booking={selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          onSuccess={() => {
            setSelectedBookingForPayment(null);
            fetchMyBookings();
          }}
        />
      )}
    </div>
  );
}

export default ShipperDashboard;
