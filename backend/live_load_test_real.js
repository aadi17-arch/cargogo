const axios = require('axios');

const liveUrl = 'https://cargogo-api.onrender.com/api/auth/login';
const TOTAL_REQUESTS = 100;

async function runTest() {
  console.log(`====================================================`);
  console.log(` Starting Login Load Test: ${TOTAL_REQUESTS} Parallel Requests`);
  console.log(`====================================================`);

  const startTime = Date.now();
  const promises = Array.from({ length: TOTAL_REQUESTS }).map(async (_, idx) => {
    // Add small delay to prevent identical timestamp JWT collision
    await new Promise(resolve => setTimeout(resolve, idx * 5));
    const start = Date.now();
    try {
      await axios.post(liveUrl, {
        email: 'driver_aditya@cargogo.com',
        password: 'mypcpubg17@'
      });
      return { success: true, duration: Date.now() - start };
    } catch (e) {
      return { success: false, duration: Date.now() - start, status: e.response ? e.response.status : 'network' };
    }
  });

  const results = await Promise.allSettled(promises);
  const totalTime = Date.now() - startTime;

  const resolved = results.map(r => r.value || { success: false, duration: 0 });
  const successful = resolved.filter(r => r.success).length;
  const failed = resolved.length - successful;
  
  const successfulDurations = resolved.filter(r => r.success).map(r => r.duration);
  const sum = successfulDurations.reduce((a, b) => a + b, 0);
  const avg = successfulDurations.length > 0 ? sum / successfulDurations.length : 0;
  const min = successfulDurations.length > 0 ? Math.min(...successfulDurations) : 0;
  const max = successfulDurations.length > 0 ? Math.max(...successfulDurations) : 0;
  const throughput = (TOTAL_REQUESTS / (totalTime / 1000));

  console.log(`\n=================== RESULTS ===================`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful:     ${successful}`);
  console.log(`Failed:         ${failed}`);
  console.log(`Throughput:     ${throughput.toFixed(2)} req/sec`);
  console.log(`Avg Latency:    ${avg.toFixed(2)} ms (Successful requests only)`);
  console.log(`Min Latency:    ${min} ms`);
  console.log(`Max Latency:    ${max} ms`);
  console.log(`===============================================`);
}

runTest();
