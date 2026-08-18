import { Server } from "socket.io";
import { getBookingOrThrow } from "@/services/booking.service";

// Central Map to track active GPS simulations per booking and prevent timer leaks
const activeSimulations = new Map<string, NodeJS.Timeout>();

export const stopGpsSimulation = (bookingId: string) => {
  const existingTimer = activeSimulations.get(bookingId);
  if (existingTimer) {
    clearInterval(existingTimer);
    activeSimulations.delete(bookingId);
  }
};

export const fetchRouteFromOSRM = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
) => {
  const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('Failed to fetch route from OSRM');
    const data = (await response.json()) as any;
    return data.routes[0].geometry.coordinates.map(
      (coord: [number, number]) => ([coord[1], coord[0]])
    );
  } catch {
    const steps = 10;
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      points.push([
        startLat + (endLat - startLat) * (i / steps),
        startLng + (endLng - startLng) * (i / steps),
      ]);
    }
    return points;
  }
};

export const startGpsSimulation = async (
  bookingId: string,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  io: Server
) => {
  // Clear any existing simulation timer for this booking before starting
  stopGpsSimulation(bookingId);

  const route = await fetchRouteFromOSRM(startLat, startLng, endLat, endLng);
  const booking = await getBookingOrThrow(bookingId);
  if (!booking.driverId) return;
  let idx = 0;

  const timer = setInterval(() => {
    try {
      if (idx < route.length) {
        const [lat, lng] = route[idx];
        io.to(`shipper:${booking.shipperId}`).emit('driver:location:update', { bookingId, lat, lng });
        io.to(`driver:${booking.driverId}`).emit('driver:location:update', { bookingId, lat, lng });
        io.to(`booking:${bookingId}`).emit('driver:location:update', { bookingId, lat, lng });
        idx++;
      } else {
        stopGpsSimulation(bookingId);
        io.to(`shipper:${booking.shipperId}`).emit('driver:arrived', { bookingId });
        io.to(`driver:${booking.driverId}`).emit('driver:arrived', { bookingId });
        io.to(`booking:${bookingId}`).emit('driver:arrived', { bookingId });
      }
    } catch (err) {
      console.error(`Error during GPS simulation for booking ${bookingId}:`, err);
      stopGpsSimulation(bookingId);
    }
  }, 3000);

  activeSimulations.set(bookingId, timer);
};
