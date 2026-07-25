import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
const CONCURRENCY = 100;

async function run() {
  const email = `shipper_${Date.now()}@cargogo.com`;

  try {
    // 1. Register
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'John Shipper',
      email,
      password: 'password123',
      phone: '9876543210',
      role: 'SHIPPER'
    });

    // 2. Login
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password: 'password123'
    });
    
    const token = loginRes.data.token;

    // 3. Parallel requests
    const startTime = Date.now();
    const requests = Array.from({ length: CONCURRENCY }).map(async (_, idx) => {
      const start = Date.now();
      try {
        await axios.post(`${BASE_URL}/api/bookings/createBooking`, {
          pickupLat: 19.076,
          pickupLng: 72.877,
          pickupAddress: 'Mumbai',
          dropoffLat: 19.218,
          dropoffLng: 72.978,
          dropoffAddress: 'Thane',
          cargoType: `Boxes ${idx}`,
          weightKg: 100,
          lengthCm: 50,
          widthCm: 50,
          heightCm: 50,
          vehicleType: 'MINI_TEMPO'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const duration = Date.now() - start;
        return { success: true, duration };
      } catch (err) {
        const duration = Date.now() - start;
        return { success: false, duration };
      }
    });

    const results = await Promise.all(requests);
    const totalTime = Date.now() - startTime;

    // 4. Metrics
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const durations = results.map(r => r.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const throughput = (CONCURRENCY / (totalTime / 1000));

    console.log(`Total Requests: ${results.length}`);
    console.log(`Successful:     ${successful}`);
    console.log(`Failed:         ${failed}`);
    console.log(`Avg Latency:    ${avg.toFixed(2)} ms`);
    console.log(`Min Latency:    ${min} ms`);
    console.log(`Max Latency:    ${max} ms`);
    console.log(`Throughput:     ${throughput.toFixed(2)} req/sec`);
  } catch (error) {
    console.error('Test startup failed:', error.message);
  }
}

run();
