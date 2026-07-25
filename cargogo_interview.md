# CargoGo — 50 Interview Questions & Answers

---

## Section 1: Socket.io & Real-Time Architecture (Q1–12)

### Q1: How does the Socket.io Redis adapter enable horizontal scaling across multiple server instances?
**Answer:**
By default Socket.io stores all socket connections in-memory on a single server. If Client A is on Server 1 and Client B is on Server 2, broadcasting to a room on Server 1 never reaches Server 2 — they are completely isolated.

The **Redis adapter** (`@socket.io/redis-adapter`) solves this using Redis pub/sub:
1. Server 1 receives a driver location update and needs to broadcast to the passenger's room.
2. Server 1 publishes the event payload to a Redis pub/sub channel.
3. All other server instances (2, 3, ...) are subscribed to that channel.
4. Each receives the event from Redis and broadcasts it to locally connected clients in that room.

This makes Socket.io stateless across servers — any instance can receive a driver update and the passenger on any other instance still gets it. We can horizontally scale behind a load balancer without breaking real-time tracking.

---

### Q2: How does the location tracking handle driver disconnection mid-ride?
**Answer:**
We handle this with a layered state recovery strategy:

1. **Heartbeats:** Socket.io sends regular ping packets. If missed, the socket is marked disconnected.
2. **Redis Location Cache:** Every driver coordinate update is simultaneously written to Redis (`SET driver:location:<id> <coords>`). Even after disconnection, the last known position is preserved.
3. **Client-Side Reconnection:** The Socket.io client is configured with `reconnection: true` and exponential backoff. It automatically retries.
4. **Room Rejoin:** On reconnection, the driver client emits a `joinRoom` event with the active booking ID, rejoining the tracking room.
5. **State Reconciliation:** The passenger frontend, on detecting reconnection, queries `GET /api/bookings/:id/location` which reads the cached Redis coordinates, re-syncing the Leaflet map marker to the last known position.

---

### Q3: Explain the WebSocket upgrade process from HTTP.
**Answer:**
WebSocket connections begin as a standard HTTP request. The client sends:
```
GET /socket.io/?transport=websocket HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: <base64-encoded-random-key>
```
The server responds with:
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: <server-computed-hash>
```
`101 Switching Protocols` signals the connection is now a persistent bi-directional TCP socket. Subsequent communication uses the WebSocket framing protocol — not HTTP. Each data frame has just 2–14 bytes of overhead vs 1KB+ HTTP headers, enabling efficient high-frequency streaming.

---

### Q4: Why WebSockets over HTTP long polling for location tracking?
**Answer:**
GPS coordinates update every 2–3 seconds. With HTTP long polling, each update requires:
1. Client opens an HTTP connection.
2. Server holds the connection open until new data.
3. Server responds. Connection closes.
4. Client immediately opens a new connection.

This is 1 full HTTP round trip with ~1KB of headers per location update. At 100 active rides that's 100 connections being created and destroyed every 2 seconds — massive overhead.

WebSockets open **one** persistent connection per client. Subsequent location frames are ~10 bytes each. This is orders of magnitude more efficient and has near-zero latency since there's no connection overhead.

---

### Q5: How do you prevent Socket.io memory leaks?
**Answer:**
Memory leaks occur when references to disconnected socket objects remain in-memory and the garbage collector cannot reclaim them.

Prevention strategies:
1. **Room Cleanup:** On booking completion or cancellation:
   ```javascript
   io.in(`booking_${bookingId}`).socketsLeave(`booking_${bookingId}`);
   ```
2. **Event Listener Cleanup:** Inside `socket.on('disconnect', ...)` we remove any global event emitter listeners registered for that socket's session.
3. **No Global Socket Arrays:** We never store socket references in global variables. We query live connections dynamically via `io.sockets.sockets.get(socketId)`.
4. **Redis Cleanup:** On disconnect, we delete the driver's Redis location cache key with a TTL or explicit `DEL` command.

---

### Q6: How does Socket.io handle room-based broadcasting in CargoGo?
**Answer:**
Socket.io rooms are named groups of socket connections. A socket can join multiple rooms.

In CargoGo:
- When a driver accepts a booking, both the driver's socket and the passenger's socket join the room `booking_<bookingId>`.
- The driver's GPS update handler emits to this room:
  ```javascript
  socket.to(`booking_${bookingId}`).emit('locationUpdate', { lat, lng, timestamp });
  ```
- Only sockets in that specific booking room receive the event — other passengers are not affected.
- On booking completion, both sockets leave the room and it is destroyed.

---

### Q7: How do you authenticate WebSocket connections in CargoGo?
**Answer:**
HTTP-level auth headers are not sent with WebSocket frames after the initial handshake. We authenticate during the handshake itself using Socket.io middleware:

```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});
```
The client passes the JWT during connection: `io({ auth: { token: accessToken } })`. Unauthenticated connections are rejected before any event handlers run.

---

### Q8: What is Socket.io's fallback mechanism and when does it activate?
**Answer:**
Socket.io uses a **transport negotiation** system. It first attempts a WebSocket connection. If the WebSocket handshake fails (e.g., due to corporate firewalls or proxies blocking the `Upgrade` header), Socket.io automatically falls back to **HTTP long polling**.

In CargoGo, we explicitly prefer WebSocket and only enable the polling fallback for maximum compatibility:
```javascript
const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
});
```
This ensures real-time tracking works even on restrictive networks, though with slightly higher latency on the polling fallback.

---

### Q9: How does the Leaflet.js GPS simulator work in CargoGo?
**Answer:**
The Leaflet tracking feature includes a **GPS simulator** for demonstration — real driver GPS isn't available in a demo environment.

The simulator:
1. Fetches the actual OSRM route polyline between pickup and dropoff coordinates as an array of `[lat, lng]` points.
2. On a `setInterval` (every 2 seconds), it advances the current position index along the polyline array.
3. The current coordinate is emitted to the backend via WebSocket as a `locationUpdate` event.
4. The backend re-broadcasts it to the passenger's socket.
5. The Leaflet map on the passenger's screen receives the update and smoothly animates the driver marker along the actual road route using `marker.setLatLng([lat, lng])`.

---

### Q10: How do you handle multiple concurrent booking rooms efficiently?
**Answer:**
Each active booking has its own Socket.io room named `booking_<bookingId>`. Socket.io rooms are extremely lightweight — they are just Sets of socket IDs stored in memory. There is no per-room overhead beyond the Set data structure.

For 1000 concurrent bookings, we have 1000 rooms — each containing just 2 socket IDs (driver + passenger). The Redis adapter ensures these rooms are synchronized across all server instances. BullMQ handles the background job for each booking's 30-second fallback timer independently, so rooms and queue jobs scale linearly with active bookings.

---

### Q11: Why did you use Socket.io instead of raw WebSocket API?
**Answer:**
Raw WebSocket is a low-level browser API. Socket.io builds on top of it with:
1. **Automatic Reconnection:** Handles disconnects, retries, and backoff without manual implementation.
2. **Rooms and Namespaces:** Built-in room broadcasting without maintaining manual socket-to-room mappings.
3. **Fallback Transport:** Automatic HTTP polling fallback for environments blocking WebSocket.
4. **Event Emitter Interface:** Clean `.emit('eventName', data)` and `.on('eventName', handler)` API vs raw binary WebSocket frames.
5. **Redis Adapter:** First-class support for horizontal scaling.

For a production booking platform, all of these are necessary and would require significant custom implementation with raw WebSocket.

---

### Q12: How does the passenger know which room to join after booking?
**Answer:**
When a booking is confirmed (driver accepted), the REST API response includes the `bookingId`. The passenger frontend:
1. Receives the `bookingId` from `POST /api/bookings` response.
2. Establishes a Socket.io connection to the server.
3. Emits `joinRoom` with the booking ID: `socket.emit('joinRoom', { bookingId })`.
4. The server middleware looks up the booking in PostgreSQL, verifies the requesting user is the passenger for that booking, and adds their socket to `booking_<bookingId>` room.

---

## Section 2: BullMQ & Background Job Architecture (Q13–22)

### Q13: Why use BullMQ instead of just handling everything synchronously in the REST API?
**Answer:**
The driver-matching process is not instant — it involves:
- Broadcasting to nearby drivers via WebSocket.
- Waiting up to 30 seconds for a voluntary acceptance.
- Running a fallback algorithm if no acceptance arrives.

If we handled this synchronously, the `POST /api/bookings` request would have to hold the HTTP connection open for up to 30 seconds. This ties up a server thread, exhausts connection pools under high load, and causes frontend timeouts (browsers typically timeout after 30–60 seconds).

BullMQ offloads this entirely to a background worker. The API responds immediately with `202 Accepted` and a booking ID. The 30-second matching process runs in the background without blocking any server thread.

---

### Q14: How does BullMQ store job state in Redis?
**Answer:**
BullMQ uses several Redis data structures internally:
- **`waiting` (List):** Job IDs waiting to be processed.
- **`active` (Set):** Jobs currently being processed by a worker.
- **`completed` (Sorted Set):** Successfully finished jobs, keyed by completion timestamp.
- **`failed` (Sorted Set):** Failed jobs with error details and retry count.
- **Job Data (Hash):** Each job's payload, options, and metadata stored as a Redis Hash.

BullMQ uses **Lua scripts** for atomic state transitions — moving a job from `waiting` to `active` is a single atomic Redis operation, guaranteeing no two workers ever claim the same job even under concurrent access.

---

### Q15: What happens if the server crashes while a BullMQ job is active?
**Answer:**
BullMQ implements **job locks**. When a worker picks up a job, it acquires a lock in Redis with a TTL (e.g., 30 seconds). The worker must renew this lock while processing. If the server crashes, the lock expires. BullMQ's stalled job detection interval identifies the job as stalled (lock expired, job still in active set) and moves it back to the `waiting` queue for another worker to pick up.

We configure this via:
```javascript
new Worker('bookingQueue', processor, {
  stalledInterval: 30000,
  maxStalledCount: 2,
});
```
This ensures no booking is permanently lost in a crashed state.

---

### Q16: How does the 30-second fallback timer work precisely?
**Answer:**
When a booking is created:
```javascript
await bookingQueue.add('matchDriver', { bookingId }, { delay: 30000 });
```
The `delay: 30000` option tells BullMQ to not process this job until 30 seconds have elapsed. BullMQ stores the job in a **delayed jobs** sorted set in Redis, keyed by the target execution timestamp. Every few seconds, BullMQ checks this sorted set for jobs whose target time has passed and moves them to the `waiting` queue.

At the 30-second mark, if the booking status in PostgreSQL is still `PENDING` (no driver accepted), the worker executes the fallback assignment. If a driver accepted in those 30 seconds and updated the status to `ACCEPTED`, the worker reads `ACCEPTED` and exits without action.

---

### Q17: How do you handle BullMQ job retries on failure?
**Answer:**
We configure retry behavior per queue:
```javascript
bookingQueue.add('matchDriver', payload, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});
```
If the job processor throws an error:
- Attempt 1 fails → wait 5 seconds → retry.
- Attempt 2 fails → wait 10 seconds → retry.
- Attempt 3 fails → job moves to `failed` set.

For the fallback matching job, a failure usually means no driver was found in the service area. After all retries exhaust, the booking status is set to `NO_DRIVERS_AVAILABLE` and the passenger is notified.

---

### Q18: How do you monitor BullMQ job health in production?
**Answer:**
BullMQ exposes queue metrics we can query:
```javascript
const waiting = await bookingQueue.getWaitingCount();
const active = await bookingQueue.getActiveCount();
const failed = await bookingQueue.getFailedCount();
```
We log these metrics periodically to the Render log stream. Spikes in `failed` count trigger investigation. In a production setup, these would feed into a monitoring dashboard (like Grafana) connected to Prometheus metrics for alerting.

---

### Q19: What is the difference between a Queue and a Worker in BullMQ?
**Answer:**
- **Queue:** The producer-side object used to add jobs. It writes job data and options to Redis. The API server uses the Queue to enqueue jobs.
- **Worker:** The consumer-side object that polls Redis for jobs and processes them. It runs in a separate process or module. Workers execute the actual business logic (driver matching, fallback assignment).

In CargoGo, the Express API is the Queue producer. A separate Worker module (started alongside the API) consumes jobs. This separation allows scaling workers independently — if matching becomes the bottleneck, we run more worker processes without scaling the API.

---

### Q20: How does BullMQ prevent two workers from processing the same booking job?
**Answer:**
BullMQ uses a **Lua script** to atomically transition a job from the `waiting` list to the `active` set in Redis. Lua scripts run atomically on the Redis server — they are executed as a single uninterruptible operation. No other Redis command can run between the Lua script's read and write steps.

This means even if 10 workers simultaneously poll for the next job, only one will succeed in atomically moving the job to `active`. The other 9 will find the `waiting` list empty and wait for the next polling interval. This is fundamentally different from application-level locking which has race conditions.

---

### Q21: How is the fallback driver selection algorithm implemented?
**Answer:**
When no driver accepts within 30 seconds:
1. Query all drivers with `status: AVAILABLE` and matching `vehicleType` from the database.
2. Fetch each driver's last known location from Redis (`GET driver:location:<driverId>`).
3. Calculate the straight-line Haversine distance between each driver's last known position and the pickup coordinates.
4. Sort drivers by distance (closest first).
5. Assign the booking to the closest available driver by updating `bookingId` in the `Driver` table and setting booking status to `ASSIGNED`.
6. Emit a `bookingAssigned` Socket.io event to the assigned driver's socket so they receive a notification.

---

### Q22: How do you gracefully shut down BullMQ workers on server restart?
**Answer:**
When Render restarts the container, Node receives a `SIGTERM` signal. We handle this:
```javascript
process.on('SIGTERM', async () => {
  await worker.close();
  await bookingQueue.close();
  await redis.quit();
  process.exit(0);
});
```
`worker.close()` waits for the currently active job (if any) to complete before shutting down, ensuring no active booking assignment is abandoned mid-execution. Only after the job completes and the worker drains does the process exit cleanly.

---

## Section 3: Redis Architecture & OTP Security (Q23–32)

### Q23: Explain all the different ways Redis is used in CargoGo.
**Answer:**
Redis serves four distinct roles simultaneously:
1. **BullMQ Job Store:** All booking matching job queues, delay timers, and retry state live in Redis.
2. **Socket.io Pub/Sub Adapter:** Real-time location update events are published/subscribed across server instances via Redis pub/sub channels.
3. **Rate Limiting Store:** `express-rate-limit` uses Redis to track request counts per IP across all server instances (not just the receiving server).
4. **OTP Storage:** Pickup and dropoff OTPs are stored in Redis with a 15-minute TTL and brute-force attempt counters per booking.

---

### Q24: Why does the Socket.io Redis adapter require a separate subscriber client?
**Answer:**
Once a Redis connection enters `SUBSCRIBE` mode, it can only listen for pub/sub messages — it cannot execute standard Redis commands like `GET`, `SET`, or `LPUSH`.

If we used a single Redis client for both BullMQ operations and pub/sub subscription, a `SET otp:booking:123 456789` command would throw an error because the connection is locked in subscribe mode.

We create two separate `ioredis` instances:
- `redisClient` → for BullMQ, rate limiting, OTP storage.
- `redisSubscriberClient` → exclusively for Socket.io pub/sub.

---

### Q25: How does the OTP verification flow work step by step?
**Answer:**
**Pickup OTP:**
1. On booking confirmation, `crypto.randomInt(100000, 999999)` generates a 6-digit CSPRNG integer.
2. Stored in Redis: `SET otp:pickup:booking:<id> <otp> EX 900` (15-minute TTL).
3. The OTP is sent to the passenger (they show it to the driver at pickup).
4. Driver enters OTP via the app. Backend retrieves it from Redis, compares.
5. Match → booking status moves to `IN_TRANSIT`. OTP key deleted from Redis.
6. No match → `INCR otp_attempts:pickup:<id>`. If `>= 3`, booking is `LOCKED`.

**Dropoff OTP:** Identical flow at the destination, confirming successful delivery.

---

### Q26: Why is `crypto.randomInt()` more secure than `Math.random()` for OTP generation?
**Answer:**
`Math.random()` is a **deterministic PRNG** (pseudo-random number generator). It uses a mathematical algorithm seeded once at startup. If an attacker can observe several sequential outputs from `Math.random()`, they can reverse-engineer the internal seed state and predict all future values — making OTPs trivially guessable.

`crypto.randomInt()` is a **CSPRNG** (cryptographically secure pseudo-random number generator). It draws entropy from the operating system's entropy pool (`/dev/urandom` on Linux, `CryptGenRandom` on Windows) — physical events like hardware interrupts, disk I/O timing, and network packet arrival times. These are impossible to observe or predict externally, making the output mathematically unpredictable even to an attacker who sees previous values.

---

### Q27: How does the Redis-based rate limiter work across multiple server instances?
**Answer:**
`express-rate-limit` with a standard memory store counts requests per IP in the memory of each server instance independently. Instance 1 counts 10 requests from IP X. Instance 2 also counts 10 requests from IP X. Together, that IP made 20 requests — but neither instance blocked it.

We solve this using the **Redis store adapter** for `express-rate-limit`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
});
```
Now all instances read and write the same rate limit counter in Redis. A counter for IP X in Redis reflects the true total across all instances — the limit is enforced globally.

---

### Q28: What TTL strategy do you use for different Redis keys?
**Answer:**
Different data has different lifetimes:

| Key Pattern | TTL | Reason |
|---|---|---|
| `otp:pickup:booking:<id>` | 900s (15 min) | OTPs expire to prevent stale tokens |
| `otp_attempts:<id>` | 900s | Clears after the OTP expires |
| `driver:location:<id>` | 30s | Refreshed every location update; auto-clears for offline drivers |
| `VEHICLE_RATES` cache | 3600s (1 hour) | Static config; rarely changes |
| Rate limit counters | Window duration | Automatically manages sliding window |

---

### Q29: What happens if Redis goes down in CargoGo?
**Answer:**
Redis is a critical dependency. If Redis goes down:
- **BullMQ jobs:** Cannot be added or processed — new bookings would fail silently unless we handle the error.
- **Socket.io adapter:** Real-time events would only reach clients connected to the same instance.
- **Rate limiting:** Falls back to in-memory counters (per-instance).
- **OTP storage:** OTP generation and verification would fail.

For resilience, we wrap Redis-dependent operations in try/catch blocks with graceful degradation. For OTPs, we could fall back to database storage with a timestamp-based TTL. For BullMQ, we could expose a health check endpoint that returns `503 Service Unavailable` if Redis is unreachable.

---

### Q30: How do you configure the Upstash Redis connection for production?
**Answer:**
Upstash provides a managed Redis with a TLS connection URL. We connect using `ioredis`:
```javascript
const redis = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});
```
The `REDIS_URL` (`rediss://...`) is stored as a Render environment variable — never hardcoded. `retryStrategy` ensures transient connection drops (common with serverless Redis cold starts) are retried with exponential backoff rather than immediately failing.

---

### Q31: How does the brute-force OTP lockout work technically?
**Answer:**
```javascript
const attemptsKey = `otp_attempts:booking:${bookingId}`;
const attempts = await redis.incr(attemptsKey);
await redis.expire(attemptsKey, 900); // TTL matches OTP TTL

if (attempts >= 3) {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'LOCKED' }
  });
  await redis.del(`otp:pickup:booking:${bookingId}`); // invalidate OTP
  return res.status(403).json({ message: 'Booking locked after 3 failed attempts.' });
}
```
`INCR` is atomic in Redis (single-threaded), so no two concurrent requests can simultaneously read the same count and both pass the check. After 3 failures, the OTP key is deleted from Redis (preventing any future attempts even with the correct code) and the booking is permanently locked in the database.

---

### Q32: How do you prevent the same driver from being double-assigned to two bookings?
**Answer:**
When a driver accepts a booking:
1. We perform a Prisma transaction that:
   - Checks that the driver's current status is `AVAILABLE`.
   - Updates the driver's status to `BUSY`.
   - Links the `driverId` to the booking.
   - Updates booking status to `ACCEPTED`.
2. All three operations are inside a single `prisma.$transaction`. If another concurrent request tries to assign the same driver, the status check (`AVAILABLE`) fails because the first transaction has already set it to `BUSY`.

PostgreSQL's row-level locking inside the transaction prevents the race condition. The second request gets a transaction conflict and is rejected cleanly.

---

## Section 4: Pricing, Routing & OSRM (Q33–40)

### Q33: Explain the complete pricing calculation flow for a booking.
**Answer:**
1. **Coordinates received:** Pickup and dropoff lat/lng from the user.
2. **OSRM query:** We call the OSRM routing API: `GET http://router.project-osrm.org/route/v1/driving/<lng1>,<lat1>;<lng2>,<lat2>`.
3. **Distance extraction:** OSRM returns `routes[0].distance` in meters. We convert to kilometers.
4. **Fallback:** If OSRM fails, we calculate Haversine distance and multiply by 1.3.
5. **Weight determination:** We compare actual weight vs volumetric weight `(L×W×H)/5000` and use the larger value.
6. **Vehicle mapping:** The chargeable weight maps to a vehicle tier in `VEHICLE_RATES`.
7. **Base fare:** `distance_km × rate_per_km`.
8. **Surge multiplier:** If current time falls within peak hours (7–10 AM, 5–9 PM), we multiply by a surge factor (e.g., 1.3×).
9. **Final price:** Rounded to the nearest rupee and returned to the user.

---

### Q34: How does the Haversine formula work mathematically?
**Answer:**
Haversine calculates the great-circle distance between two points on a sphere given their latitudes and longitudes:

```javascript
const R = 6371; // Earth's radius in km
const dLat = toRad(lat2 - lat1);
const dLng = toRad(lng2 - lng1);
const a = Math.sin(dLat/2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) ** 2;
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c; // distance in km
```

The result is straight-line distance. We multiply by `1.3` to approximate road distance (accounting for road curves and detours). This is less accurate than OSRM's actual route calculation but provides a reliable fallback.

---

### Q35: Why did you choose OSRM over Google Maps API for routing?
**Answer:**
- **Google Maps API:** Accurate, but charges per API call. At scale (thousands of bookings/day), costs become prohibitive. Also, terms of service restrict offline use and require attribution.
- **OSRM:** Open-source and free. Based on OpenStreetMap data. We can self-host an OSRM instance for zero marginal cost at scale. The public OSRM demo server (`router.project-osrm.org`) is free for development.

For production at scale, we would deploy our own OSRM instance on a server close to our users (e.g., India region), eliminating the dependency on the public demo server and significantly reducing latency.

---

### Q36: How do you handle surge pricing logic?
**Answer:**
```javascript
const now = new Date();
const hour = now.getHours();
const isPeakHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21);
const surgeMultiplier = isPeakHour ? 1.3 : 1.0;
const finalPrice = Math.round(basePrice * surgeMultiplier);
```
The surge multiplier is applied to the base fare calculated from distance and vehicle rate. We display the surge multiplier prominently in the booking UI so users can see why the price is elevated. In a production system, surge would also factor in real-time supply/demand ratios (driver availability vs active booking requests in the area).

---

### Q37: How does volumetric weight prevent undercharging for bulky light cargo?
**Answer:**
Standard weight-based pricing would charge a box of foam pillows (weighing 5kg but taking up 2 cubic meters) the same as a 5kg metal block. The foam occupies far more truck space and constrains capacity.

Volumetric weight formula: `(L × W × H) / 5000`. For pillows in a 100cm × 100cm × 100cm box: `1,000,000 / 5000 = 200kg volumetric weight`. We charge based on 200kg, not 5kg actual weight. This matches how courier companies and logistics firms worldwide price shipments — ensuring the pricing reflects actual resource utilization.

---

### Q38: How is the VEHICLE_RATES configuration structured?
**Answer:**
```javascript
const VEHICLE_RATES = [
  { maxWeight: 100, type: 'BIKE', pricePerKm: 12 },
  { maxWeight: 500, type: 'AUTO', pricePerKm: 18 },
  { maxWeight: 2000, type: 'MINI_TEMPO', pricePerKm: 28 },
  { maxWeight: 10000, type: 'LARGE_TEMPO', pricePerKm: 45 },
  { maxWeight: Infinity, type: 'HEAVY_TRUCK', pricePerKm: 80 },
];

const rate = VEHICLE_RATES.find(r => chargeableWeight <= r.maxWeight);
```
The first tier where `chargeableWeight <= maxWeight` is selected. This ensures linear vehicle upgrade as weight increases and makes adding new vehicle tiers trivial.

---

### Q39: How do you validate the booking coordinates input from users?
**Answer:**
Using Zod schema validation on the booking request:
```javascript
const bookingSchema = z.object({
  body: z.object({
    pickup: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    dropoff: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    actualWeight: z.number().positive(),
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
});
```
Invalid coordinates (lat > 90, NaN values, missing fields) are rejected with a `400 Bad Request` before the controller even executes, preventing downstream OSRM API calls with garbage data.

---

### Q40: How do you handle pricing discrepancies if OSRM changes its response between quote and booking?
**Answer:**
We calculate and lock the price at quote time:
1. User requests a price quote — we call OSRM, calculate price, and store it in a temporary Redis quote key: `SET quote:<quoteId> <price> EX 120` (2-minute TTL).
2. We return the `quoteId` and price to the user.
3. When the user confirms the booking (within 2 minutes), they send the `quoteId`.
4. The controller retrieves the locked price from Redis and uses it for the booking — it does not recalculate.

This prevents price changes due to surge fluctuation or OSRM fallback switching between quote and confirmation.

---

## Section 5: Database Schema & Project Architecture (Q41–50)

### Q41: Walk me through the CargoGo database schema and key relations.
**Answer:**
Core entities and their relationships:
- **User:** Base entity. Has a `role` (`CUSTOMER` or `DRIVER`).
- **Driver:** Extends User. Has `vehicleType`, `status` (`AVAILABLE`, `BUSY`, `OFFLINE`), and `currentLocation`.
- **Booking:** Core transaction. References `customerId`, `driverId` (nullable until assigned), `pickupAddress`, `dropoffAddress`, `status`, `price`, `vehicleType`.
- **OTP:** Separate table (or Redis) storing `pickupOTP`, `dropoffOTP`, `pickupVerified`, `dropoffVerified` per booking.
- **Review:** References `bookingId`, `reviewerId`, `rating`, `comment`.
- **Dispute:** References `bookingId`, `raisedById`, `status`, `description`.

Booking is the central pivot — every other entity relates back to it.

---

### Q42: How does the booking status state machine work?
**Answer:**
A booking transitions through a strict sequence:
```
PENDING → ACCEPTED → IN_TRANSIT → DELIVERED → COMPLETED
                ↓
           NO_DRIVER_FOUND
                ↓
              LOCKED (OTP brute force)
                ↓
             DISPUTED
```
- `PENDING`: Created, awaiting driver acceptance (BullMQ 30s fallback running).
- `ACCEPTED`: Driver accepted voluntarily.
- `IN_TRANSIT`: Pickup OTP verified successfully.
- `DELIVERED`: Dropoff OTP verified successfully.
- `COMPLETED`: Customer confirms delivery and no dispute. Payment released.

Server-side validation prevents invalid transitions (e.g., jumping from `PENDING` to `DELIVERED`).

---

### Q43: What is the deployment architecture of CargoGo?
**Answer:**
- **Frontend:** React + Vite + TypeScript, deployed to **Vercel**. Root directory: `frontend/`. Build command: `npm run build`. Output: `dist/`.
- **Backend:** Node.js + Express + TypeScript, deployed to **Render** as a Web Service. Start command: `npx tsx src/app.ts`.
- **Database:** **Neon** serverless PostgreSQL.
- **Cache/Queue:** **Upstash** managed Redis (serverless Redis with TLS, zero-ops management).

---

### Q44: Why was TypeScript used for the CargoGo backend (vs JavaScript in FreelanceGuard)?
**Answer:**
CargoGo's backend is more architecturally complex — it involves BullMQ job type definitions, Socket.io event payloads, OSRM API response types, and Prisma-generated types all interacting. TypeScript provides:
1. **Compile-time errors:** Catching mismatched socket event payload shapes or incorrect Prisma query return types before runtime.
2. **Path Aliases:** Using `@/services/pricing.service` instead of `../../../../services/pricing.service` — TypeScript's `tsconfig.json` path aliases make imports clean.
3. **Interface Contracts:** Socket event interfaces enforce that every `locationUpdate` emission includes both `lat` and `lng`, preventing silent runtime failures.

---

### Q45: How do path aliases work in the CargoGo TypeScript backend?
**Answer:**
`tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```
This lets us write `import { prisma } from '@/prisma/client'` instead of `import { prisma } from '../../../prisma/client'`.

TypeScript resolves these at compile time. In production (Render), we use `tsx` (TypeScript Execute) as the runtime, which respects `tsconfig.json` path aliases at runtime without needing a separate build step. This was a key fix — `tsc`-compiled JavaScript loses path alias resolution unless a separate post-build tool handles it.

---

### Q46: How is the review module implemented?
**Answer:**
After a booking reaches `COMPLETED` status, both the customer and driver can submit a review:
1. `POST /api/review` validates: the booking is `COMPLETED`, the reviewer is a participant (customer or driver), and they haven't already submitted a review for this booking.
2. A `Review` record is created with `rating` (1–5), `comment`, `reviewerId`, and `bookingId`.
3. Aggregate driver ratings are calculated on read: `SELECT AVG(rating) FROM Review WHERE targetId = driverId`.

We don't store a cached average to avoid stale data — the average is computed fresh on each driver profile fetch.

---

### Q47: How does the dispute module work in CargoGo?
**Answer:**
If the customer claims cargo wasn't delivered or was damaged:
1. `POST /api/disputes` — customer raises a dispute against a specific booking. Booking status moves to `DISPUTED`. The booking is frozen.
2. Both parties submit evidence (text descriptions, photos).
3. Admin reviews via the admin panel and makes a ruling: either releasing payment to the driver (`RESOLVED_DRIVER`) or refunding the customer (`RESOLVED_CUSTOMER`).
4. The resolution triggers a Prisma transaction updating the booking status and wallet balances accordingly.

---

### Q48: How do you handle Prisma + TypeScript path alias compilation on Render?
**Answer:**
`tsc` (TypeScript compiler) produces JavaScript output in `dist/` but strips path aliases — `@/services/pricing` becomes a bare specifier that Node.js cannot resolve, causing `MODULE_NOT_FOUND` errors.

Solutions:
1. **`tsx` runtime:** Instead of compiling, we run TypeScript directly with `npx tsx src/app.ts`. `tsx` uses `esbuild` under the hood, which respects `tsconfig.json` path aliases natively.
2. **`tsc-alias`:** A post-compilation tool that rewrites path aliases in the compiled `dist/` files.

We use `tsx` for CargoGo because it's simpler — no build step needed, just direct TypeScript execution.

---

### Q49: How did you verify that the BullMQ + Redis + Socket.io stack performed under load?
**Answer:**
Using k6, we simulated 100 concurrent virtual users each submitting a booking request simultaneously:
```javascript
const res = http.post(`${BASE_URL}/api/bookings`, JSON.stringify(payload), { headers });
```
We measured:
- **Booking creation throughput:** `160+ bookings/sec` at `532ms` average latency.
- **Socket.io room join:** All 100 clients successfully joined their respective booking rooms without collision.
- **Redis OTP storage:** 100 concurrent OTP stores completed with zero failures.

The 532ms latency is primarily from the OSRM API call (external network). Local processing (Prisma insert + Redis OTP store + BullMQ job add) was under 50ms.

---

### Q50: What would you improve in CargoGo if given more time?
**Answer:**
1. **Real GPS Integration:** Replace the Leaflet simulator with a real mobile GPS SDK (React Native + Expo Location API) for actual driver coordinates.
2. **Payment Gateway:** Integrate Razorpay or Stripe for real INR payment processing.
3. **Driver App:** Build a separate mobile-friendly driver interface optimized for small screens.
4. **Kafka Migration:** Replace BullMQ+Redis with Apache Kafka for persistent, replayable event streams as the platform scales globally.
5. **Monitoring:** Add Prometheus + Grafana dashboards for real-time BullMQ queue depth, Redis memory usage, and Socket.io connection counts.
