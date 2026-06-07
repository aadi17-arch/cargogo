const autocannon = require('autocannon');

const instance = autocannon({
  url: 'http://localhost:5000/api/health',
  connections: 500, // higher concurrency to saturate connection pool
  amount: 10000000,   // 10 Million requests
  pipelining: 10,    // pipeline multiple requests per connection to maximize speed
  duration: 60       // 60-second cap in case of slow execution
}, (err, result) => {
  if (err) {
    console.error('Error running autocannon:', err);
    process.exit(1);
  }
  console.log('--- Performance Metrics ---');
  console.log(`Duration (sec): ${result.duration}`);
  console.log(`Total Requests: ${result.requests.total}`);
  console.log(`Requests/sec (Average): ${result.requests.average}`);
  console.log(`Latency (Average ms): ${result.latency.average}`);
  console.log(`Latency (Max ms): ${result.latency.max}`);
  console.log(`Latency (P99 ms): ${result.latency.p99}`);
  console.log(`Errors: ${result.errors}`);
  console.log(`2xx Responses: ${result['2xx']}`);
  console.log(`Non-2xx Responses: ${result.non2xx}`);
});

autocannon.track(instance, { renderProgressBar: true });
