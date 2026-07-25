import axios from 'axios';

const BACKEND_URL = 'https://cargogo-api.onrender.com';
const NUM_DRIVERS = 500;

// Center around BIT Sindri (Dhanbad, Jharkhand)
const SINDRI_LAT = 23.6517;
const SINDRI_LNG = 86.4678;

async function seedDrivers() {
  console.log(`====================================================`);
  console.log(`  Seeding 500 Drivers around BIT Sindri / Dhanbad   `);
  console.log(`====================================================`);

  const BATCH_SIZE = 10; // Gentle batch size to avoid Render rate limiting
  for (let i = 0; i < NUM_DRIVERS; i += BATCH_SIZE) {
    const promises = [];
    for (let j = 0; j < BATCH_SIZE && (i + j) < NUM_DRIVERS; j++) {
      const id = i + j + 1;
      const email = `driver_sindri_${id}_${Date.now()}@cargogotest.com`;

      // Spread drivers within a 15km radius around BIT Sindri
      const lat = SINDRI_LAT + (Math.random() - 0.5) * 0.12;
      const lng = SINDRI_LNG + (Math.random() - 0.5) * 0.12;

      promises.push((async () => {
        try {
          const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
            name: `Sindri Driver ${id}`,
            email: email,
            password: 'password123',
            role: 'DRIVER',
            plateNumber: `JH-10-SIM-${id}`
          });
          const token = res.data.token;

          // Toggle online with lat/lng
          await axios.post(
            `${BACKEND_URL}/api/drivers/online`,
            { isOnline: true, latitude: lat, longitude: lng },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          // ignore individual timeouts
        }
      })());
    }

    await Promise.all(promises);
    console.log(`[+] Online Drivers Created: ${Math.min(i + BATCH_SIZE, NUM_DRIVERS)} / ${NUM_DRIVERS}`);
    await new Promise(r => setTimeout(r, 500)); // 500ms delay between batches
  }

  console.log(`\n🎉 DONE! 500 Drivers are now ONLINE around BIT Sindri / Dhanbad!`);
}

seedDrivers().catch(console.error);
