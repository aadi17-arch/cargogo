import prisma from "@/config/database";
import { haversineDistance } from "@/utils/haversine";

export const OptimizedRoute = async (
  driverId: string,
  lat?: number,
  lng?: number
) => {
  // 1. Fetch driver profile & vehicle to find capacity
  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    include: {
      vehicle: true,
      driverProfile: true,
    }
  });
  if (!driver) throw new Error("Driver not found");

  const startLat = lat !== undefined ? lat : (driver.driverProfile?.latitude || 19.0760);
  const startLng = lng !== undefined ? lng : (driver.driverProfile?.longitude || 72.8777);
  const capacity = driver.vehicle?.capacityKg || 500;

  // 2. Fetch all active bookings assigned to this driver
  const bookings = await prisma.booking.findMany({
    where: {
      driverId: driverId,
      status: {
        in: ['ACCEPTED', 'IN_TRANSIT']
      }
    }
  });

  const route: any[] = [];
  const visitedPickups = new Set<string>();
  const visitedDropoffs = new Set<string>();

  // Start weight: sum weights of bookings already in transit
  let currentWeight = bookings
    .filter(b => b.status === 'IN_TRANSIT')
    .reduce((sum, b) => sum + b.weightKg, 0);

  let currentLat = startLat;
  let currentLng = startLng;
  let totalDistanceKm = 0;

  const totalStopsNeeded = bookings.reduce((sum, b) => {
    return sum + (b.status === 'ACCEPTED' ? 2 : 1);
  }, 0);

  // 3. Greedy Nearest Neighbor Search Loop
  while (route.length < totalStopsNeeded) {
    let bestCandidate: any = null;

    for (const b of bookings) {
      // Option A: Pickup (if status is ACCEPTED, not picked up yet, and fits in vehicle capacity)
      if (b.status === 'ACCEPTED' && !visitedPickups.has(b.id)) {
        if (currentWeight + b.weightKg <= capacity) {
          const dist = haversineDistance(currentLat, currentLng, b.pickupLat, b.pickupLng);
          if (!bestCandidate || dist < bestCandidate.distance) {
            bestCandidate = { type: 'PICKUP', booking: b, distance: dist };
          }
        }
      }

      // Option B: Dropoff (if already inside vehicle/transit and not dropped off yet)
      const isAlreadyPickedUp = b.status === 'IN_TRANSIT' || visitedPickups.has(b.id);
      const isNotDroppedOffYet = !visitedDropoffs.has(b.id);
      if (isAlreadyPickedUp && isNotDroppedOffYet) {
        const dist = haversineDistance(currentLat, currentLng, b.dropoffLat, b.dropoffLng);
        if (!bestCandidate || dist < bestCandidate.distance) {
          bestCandidate = { type: 'DROPOFF', booking: b, distance: dist };
        }
      }
    }

    if (!bestCandidate) {
      break; // No valid moves possible (e.g., overloaded capacity with no dropoffs)
    }

    const { type, booking, distance } = bestCandidate;
    totalDistanceKm += distance;

    if (type === 'PICKUP') {
      visitedPickups.add(booking.id);
      currentWeight += booking.weightKg;
      currentLat = booking.pickupLat;
      currentLng = booking.pickupLng;
    } else {
      visitedDropoffs.add(booking.id);
      currentWeight -= booking.weightKg;
      currentLat = booking.dropoffLat;
      currentLng = booking.dropoffLng;
    }

    route.push({
      type,
      bookingId: booking.id,
      location: { lat: currentLat, lng: currentLng },
      cargoType: booking.cargoType,
      weightKg: booking.weightKg,
      expectedAccumulatedWeight: currentWeight,
      // Add scheduling details to route metadata
      bookingType: (booking as any).bookingType ?? 'INSTANT',
      scheduledAt: (booking as any).scheduledAt ?? null,
    });
  }

  return {
    startLocation: { lat: startLat, lng: startLng },
    vehicleCapacityKg: capacity,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    route
  };
};
