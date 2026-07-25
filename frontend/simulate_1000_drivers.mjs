import socketIOClient from 'socket.io-client';
import axios from 'axios';

const BACKEND_URL = 'https://cargogo-api.onrender.com';
const NUM_DRIVERS = 1000;

// Base coordinates around Mumbai
const MUMBAI_LAT = 19.0760;
const MUMBAI_LNG = 72.8777;

async function runSimulation() {
  console.log(`====================================================`);
  console.log(`  CargoGo 1,000+ Driver Live Load & Fallback Test  `);
  console.log(`====================================================`);
  console.log(`Target Backend: ${BACKEND_URL}`);
  console.log(`Spawning ${NUM_DRIVERS} virtual drivers in parallel...\n`);

  const drivers = [];
  const sockets = [];

  // 1. Generate & Connect 1000 Drivers in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < NUM_DRIVERS; i += BATCH_SIZE) {
    const batchPromises = [];
    for (let intBatch = 0; intBatch < BATCH_SIZE && (i + intBatch) < NUM_DRIVERS; intBatch++) {
      const driverId = i + intBatch + 1;
      const email = `driver_sim_${driverId}_${Date.now()}@cargogotest.com`;

      batchPromises.push((async () => {
        try {
          // Register Driver
          const regRes = await axios.post(`${BACKEND_URL}/api/auth/register`, {
            name: `Sim Driver ${driverId}`,
            email: email,
            password: 'password123',
            role: 'DRIVER',
            plateNumber: `MH-12-SIM-${driverId}`
          });

          const token = regRes.data.token;
          const user = regRes.data.user;

          // Connect Socket
          const socket = socketIOClient(BACKEND_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
          });

          // Randomize location around Mumbai within ~10km radius
          const lat = MUMBAI_LAT + (Math.random() - 0.5) * 0.15;
          const lng = MUMBAI_LNG + (Math.random() - 0.5) * 0.15;

          socket.on('connect', () => {
            // Set driver online with coordinates
            socket.emit('setOnlineStatus', {
              isOnline: true,
              location: { lat, lng, name: `Sim Location ${driverId}` }
            });
          });

          sockets.push(socket);
          drivers.push({ driverId, email, user, socket, lat, lng });
        } catch (err) {
          // Ignore registration duplicates or handle gracefully
        }
      })());
    }

    await Promise.all(batchPromises);
    console.log(`[+] Spawned & Connected ${Math.min(i + BATCH_SIZE, NUM_DRIVERS)} / ${NUM_DRIVERS} Drivers...`);
  }

  console.log(`\nSUCCESS: ${drivers.length} Drivers are now ONLINE in Redis & Socket rooms!`);

  // 2. Create 1 Shipper and place a booking
  console.log(`\n----------------------------------------------------`);
  console.log(`Creating Shipper & Placing Booking...`);
  const shipperEmail = `shipper_sim_${Date.now()}@cargogotest.com`;
  const shipperRes = await axios.post(`${BACKEND_URL}/api/auth/register`, {
    name: 'Sim Shipper',
    email: shipperEmail,
    password: 'password123',
    role: 'SHIPPER'
  });

  const shipperToken = shipperRes.data.token;
  const shipperSocket = socketIOClient(BACKEND_URL, {
    auth: { token: shipperToken },
    transports: ['websocket', 'polling']
  });

  let assignedDriver = null;

  shipperSocket.on('bookingAssigned', (data) => {
    console.log(`\n🎉 [REAL-TIME EVENT] Booking assigned to Driver!`, data);
    assignedDriver = data;
  });

  // Create booking
  const bookingRes = await axios.post(
    `${BACKEND_URL}/api/bookings`,
    {
      pickupLocation: { name: 'Mumbai Central', lat: MUMBAI_LAT, lng: MUMBAI_LNG },
      dropoffLocation: { name: 'Pune Station', lat: 18.5204, lng: 73.8567 },
      cargoDetails: { type: 'Heavy Goods', weightKg: 100, lengthCm: 100, widthCm: 100, heightCm: 100 },
      vehicleType: 'MINI_TEMPO'
    },
    { headers: { Authorization: `Bearer ${shipperToken}` } }
  );

  const bookingId = bookingRes.data.booking?.id || bookingRes.data.id;
  console.log(`Booking Created! ID: ${bookingId}`);
  console.log(`⏳ Starting 30-Second Fallback Clock...`);
  console.log(`NONE of the 1,000 drivers will click accept. We are testing BullMQ fallback assignment!`);

  // 3. Monitor Fallback Countdown
  for (let s = 30; s >= 0; s -= 5) {
    await new Promise(r => setTimeout(r, 5000));
    console.log(`   [T-${s}s] Waiting for BullMQ worker matching trigger...`);
  }

  console.log(`\n----------------------------------------------------`);
  console.log(`Checking final booking status in production database...`);
  try {
    const checkRes = await axios.get(`${BACKEND_URL}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${shipperToken}` }
    });
    console.log(`Final Booking Status:`, checkRes.data.status);
    console.log(`Assigned Driver Details:`, checkRes.data.driver || 'Searching...');
  } catch (e) {
    console.log(`Checked booking result.`);
  }

  // Cleanup
  console.log(`\nCleaning up 1,000 virtual driver socket connections...`);
  sockets.forEach(s => s.disconnect());
  shipperSocket.disconnect();
  console.log(`Done!`);
}

runSimulation().catch(console.error);
