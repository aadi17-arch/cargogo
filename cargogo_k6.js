import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp-up
    { duration: '60s', target: 100 }, // steady
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:5000';

export function setup() {
  const email = `k6_shipper_${Date.now()}@cargogo.com`;
  
  // Register
  const regPayload = JSON.stringify({
    name: 'John Shipper',
    email,
    password: 'password123',
    phone: '9876543210',
    role: 'SHIPPER'
  });
  
  const headers = { 'Content-Type': 'application/json' };
  http.post(`${BASE_URL}/api/auth/register`, regPayload, { headers });

  // Login
  const loginPayload = JSON.stringify({
    email,
    password: 'password123'
  });
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers });
  
  const token = loginRes.json().data.token;
  return { token };
}

export default function (data) {
  const payload = JSON.stringify({
    pickupLat: 19.076,
    pickupLng: 72.877,
    pickupAddress: 'Mumbai',
    dropoffLat: 19.218,
    dropoffLng: 72.978,
    dropoffAddress: 'Thane',
    cargoType: 'Boxes',
    weightKg: 100,
    lengthCm: 50,
    widthCm: 50,
    heightCm: 50,
    vehicleType: 'MINI_TEMPO'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`
    }
  };

  const res = http.post(`${BASE_URL}/api/bookings/createBooking`, payload, params);

  check(res, {
    'status is 201': (r) => r.status === 201
  });

  sleep(0.1);
}
