import { Server } from "socket.io";
import prisma from "@/config/database";

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
    const routePoints = data.routes[0].geometry.coordinates.map(
      (coord: [number, number]) => ([coord[1], coord[0]])
    );
    return routePoints;

  } catch (e: any) {
    const steps = 10;
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const lat = startLat + (endLat - startLat) * (i / steps);
      const lng = startLng + (endLng - startLng) * (i / steps);
      points.push([lat, lng]);
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
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking || !booking.driverId) return;
  let idx = 0;

  const timer = setInterval(() => {
    if (idx < route.length) {
      const [lat, lng] = route[idx];
      io.to(`shipper:${booking.shipperId}`).emit('driver:location:update', { bookingId,lat,lng });
      io.to(`driver:${booking.driverId}`).emit('driver:location:update', { bookingId,lat,lng });
      idx++;
    } else {
      clearInterval(timer);
      io.to(`shipper:${booking.shipperId}`).emit('driver:arrived', { bookingId });
      io.to(`driver:${booking.driverId}`).emit('driver:arrived', { bookingId });
    }
  }, 3000);
};
