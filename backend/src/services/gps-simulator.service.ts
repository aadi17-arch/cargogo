import { Server } from "socket.io";
import { getBookingOrThrow } from "@/services/booking.service";

export const fetchRouteFormOSRM = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
) => {
  const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
  try {
    const response = await fetch(url);
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
  const route = await fetchRouteFormOSRM(startLat, startLng, endLat, endLng);
  const booking = await getBookingOrThrow(bookingId);
  if (!booking.driverId) return;
  let idx = 0;

  const timer = setInterval(() => {
    if (idx < route.length) {
      const [lat, lng] = route[idx];
      io.to(`shipper:${booking.shipperId}`).emit('driver:location:update', { bookingId, lat, lng });
      io.to(`driver:${booking.driverId}`).emit('driver:location:update', { bookingId, lat, lng });
      idx++;
    } else {
      clearInterval(timer);
      io.to(`shipper:${booking.shipperId}`).emit('driver:arrived', { bookingId });
      io.to(`driver:${booking.driverId}`).emit('driver:arrived', { bookingId });
    }
  }, 3000);
};
