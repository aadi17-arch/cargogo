import { fetchRouteDistanceOSRM, verifyPickupOTP, verifyDropOffOTP } from '../booking.service';
import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';

// Mock the database client
jest.mock('@/config/database', () => ({
  __esModule: true,
  default: {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Booking Service - OSRM Distance & OTP Expiry', () => {
  let mockFindUnique: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    mockFindUnique = prisma.booking.findUnique as jest.Mock;
    mockUpdate = prisma.booking.update as jest.Mock;
    jest.clearAllMocks();
  });

  describe('fetchRouteDistanceOSRM', () => {
    it('should return actual road distance from OSRM on success', async () => {
      // Mock global fetch
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          routes: [{ distance: 15200 }], // 15.2 km
        }),
      });
      global.fetch = mockFetch as any;

      const dist = await fetchRouteDistanceOSRM(19.0760, 72.8777, 19.2183, 72.9781);
      expect(dist).toBe(15.2);
    });

    it('should fall back to Haversine * 1.3 when OSRM fails', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch as any;

      const dist = await fetchRouteDistanceOSRM(19.0760, 72.8777, 19.2183, 72.9781);
      expect(dist).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('OTP Expiry Validation', () => {
    it('should verify pickup OTP if within 15 minutes', async () => {
      const now = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'booking-id',
        status: 'ACCEPTED',
        driverId: 'driver-id',
        otpAttempts: 0,
        pickupOTP: '123456',
        otpGeneratedAt: now,
      });

      mockUpdate.mockResolvedValue({
        id: 'booking-id',
        status: 'IN_TRANSIT',
        pickupVerified: true,
      });

      const result = await verifyPickupOTP('booking-id', '123456', 'driver-id');
      expect(result.status).toBe('IN_TRANSIT');
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'booking-id' },
        data: { status: 'IN_TRANSIT', pickupVerified: true, otpAttempts: 0 },
      });
    });

    it('should throw an error if pickup OTP is more than 15 minutes old', async () => {
      const longAgo = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      mockFindUnique.mockResolvedValue({
        id: 'booking-id',
        status: 'ACCEPTED',
        driverId: 'driver-id',
        otpAttempts: 0,
        pickupOTP: '123456',
        otpGeneratedAt: longAgo,
      });

      await expect(
        verifyPickupOTP('booking-id', '123456', 'driver-id')
      ).rejects.toThrow(new AppError('OTP has expired (validity is 15 minutes).', 400));
    });

    it('should lock the booking and throw if attempts exceed 3', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'booking-id',
        status: 'ACCEPTED',
        driverId: 'driver-id',
        otpAttempts: 3,
        pickupOTP: '123456',
        otpGeneratedAt: new Date(),
      });

      await expect(
        verifyPickupOTP('booking-id', '123456', 'driver-id')
      ).rejects.toThrow(new AppError('Too many failed OTP verification attempts. This booking is locked.', 400));
    });
  });
});
