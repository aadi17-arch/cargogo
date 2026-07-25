# 100 Placement Interview Preparation Guide — Part 1 (Questions 1-20)

This guide contains granular, production-grade interview questions and detailed, descriptive answers for **FreelanceGuard** and **CargoGo**. Use these to study exact system mechanics and design decisions.

---

## 1. Database & Prisma Transaction Integrity (FreelanceGuard)

### Question 1: How do Prisma interactive transactions guarantee atomic escrow updates, and what happens at the SQL database layer under the hood?

**Answer:**
In FreelanceGuard, releasing milestone funds requires updating three distinct entities: decrementing the client’s held amount, incrementing the freelancer’s wallet balance, and creating a payment record log. If any of these updates fail (e.g., due to a database constraint violation, network timeout, or server crash), the database could be left in an inconsistent state (e.g., funds deducted from the client but never received by the freelancer).

To prevent this, we use **Prisma Interactive Transactions** (`prisma.$transaction(async (tx) => { ... })`).
Under the hood, when this block starts:

1. Prisma sends a `BEGIN` command to the PostgreSQL database to initiate a new database transaction.
2. Instead of executing queries immediately and committing them, the database executes each query within the transaction's isolated sandbox.
3. If all statements execute successfully, Prisma sends a `COMMIT` command, applying all updates permanently.
4. If any statement throws an error or fails, Prisma catches the exception and immediately sends a `ROLLBACK` command. The database discards all changes made since the `BEGIN` command, ensuring that the ledger remains atomic and consistent (either all updates succeed, or nothing changes).

---

### Question 2: Why is the `Decimal` data type critical for financial ledgers like our escrow, and why is `Float` considered a security/reliability hazard?

**Answer:**
Using `Float` or `Double` for financial data is a major anti-pattern in software engineering due to how computers store numbers. Floating-point numbers are represented in binary (base-2) format according to the IEEE 754 standard. Because base-2 cannot precisely represent common base-10 fractional values (like `0.1` or `0.2`), simple arithmetic operations introduce tiny rounding errors (e.g., `0.1 + 0.2` evaluates to `0.30000000000000004` in JavaScript). Over thousands of transactions, these fractional rounding errors accumulate, leading to discrepancies in financial balances.

To guarantee mathematical precision, FreelanceGuard uses the **`Decimal`** data type (mapped to the `Decimal` class in Prisma and `DECIMAL(10,2)` in PostgreSQL). Unlike floats, Decimals are stored as fixed-point numbers (usually represented internally as strings or integers with an implicit scale). This allows the database and application to perform base-10 arithmetic exactly as humans do, ensuring that calculations like platform fees and milestone distributions are accurate to the penny without any floating-point drift.

---

### Question 3: Walk me through your database schema relations. If a User is deleted, how did you configure the referential actions (cascades) for Contracts, Milestones, and Disputes?

**Answer:**
Our database schema is designed to enforce relational integrity and prevent "orphan" records.

- **User to Contracts/Projects:** A `Project` belongs to a client. If a client account is deleted, we do not want to delete the project records or contract histories because we need them for financial auditing. Therefore, we configure the relation with `onDelete: Restrict` or `onDelete: NoAction`. This prevents the deletion of a user if active contracts or projects exist, forcing administrators to resolve active contracts first.
- **Contracts to Milestones:** A `Milestone` is entirely dependent on its parent `Contract`. If a contract is deleted (for example, a draft contract that was never funded), we configure the relation as `onDelete: Cascade`. This tells PostgreSQL to automatically delete all associated milestone records when the parent contract is deleted, keeping the database clean.
- **Milestones to Disputes:** If a dispute is raised against a milestone, deleting the milestone must be blocked. We configure this relation with `onDelete: Restrict`, ensuring that a milestone cannot be deleted if a dispute record is attached to it, preserving the audit trail for dispute resolution.

---

### Question 4: How does using an Interactive Transaction prevent deadlocks when multiple users are transacting concurrently?

**Answer:**
A database deadlock occurs when two transactions hold locks on different resources, and each tries to acquire a lock on the resource held by the other (e.g., Transaction A locks Client 1 and wants to update Freelancer 2; Transaction B locks Freelancer 2 and wants to update Client 1). Both transactions block indefinitely, waiting for the other to release the lock.

We mitigate this in Prisma Interactive Transactions by:

1. **Consistent Locking Order:** We ensure that inside our transaction block, updates are always performed in a strict, predictable order (e.g., always update the Client record first, then update the Freelancer record, then create the Payment log). Since concurrent transactions will try to acquire locks in the exact same order, one transaction will wait for the first lock to be released rather than acquiring partial locks and blocking the other.
2. **Lock Timeouts:** We configure database transaction timeouts. If a lock cannot be acquired within a short window, the database aborts the transaction, releasing all currently held locks and allowing the other transaction to proceed.

---

## 2. Authentication, Middleware, and Security (FreelanceGuard)

### Question 5: Explain the mechanics of your Token Rotation Security. How does the server detect if a refresh token has been stolen?

**Answer:**
Refresh token rotation is a security mechanism that prevents hackers from indefinitely abusing a stolen refresh token to obtain new access tokens.

1. **Issuance:** When a user logs in, the server generates an Access Token (short-lived, e.g., 15 minutes) and a Refresh Token (longer-lived, e.g., 7 days). The Refresh Token is stored in a database table associated with the user session.
2. **Rotation:** When the client requests a new Access Token via `/api/auth/refresh`, the client sends the current Refresh Token. The server looks up this token in the database.
   - If found and valid, the server invalidates the old Refresh Token, generates a _new_ Refresh Token, saves the new one to the database, and returns both the new Access Token and new Refresh Token to the client.
3. **Breach Detection:** If a hacker steals a Refresh Token and tries to reuse it after the legitimate user has already rotated it, the server checks the database and finds that the token sent by the hacker is marked as "invalid" or "already used".
4. **Revocation:** Because a used token was sent, the server detects a breach. It immediately invalidates _all_ active refresh tokens and sessions for that user, forcing both the legitimate user and the hacker to be logged out immediately.

---

### Question 6: Walk through the exact request validation middleware stack when a user hits a protected endpoint.

**Answer:**
When a client hits a protected route like `POST /api/projects/create`, the request passes through a multi-stage Express middleware pipeline:

1. **Cookie/Header Extraction:** The `cookieParser` middleware extracts the cookies, and the auth middleware checks the `Authorization` header for the `Bearer <token>` format.
2. **JWT Signature Verification:** The auth middleware decodes the token using `jsonwebtoken` and verifies the cryptographic signature against the server's `JWT_SECRET`. If signature verification fails or the token has expired, it immediately returns a `401 Unauthorized` response.
3. **User Deserialization:** The verified token payload contains the user's ID and role. The middleware attaches this metadata directly to the request object (`req.user = decodedUserPayload`) so subsequent route handlers can access it.
4. **RBAC Middleware:** The request then moves to the Role-Based Access Control middleware (e.g., `roleMiddleware(["CLIENT"])`). This checks if `req.user.role` matches the permitted roles. If a Freelancer tries to access a client-only route, the middleware rejects the request with a `403 Forbidden` response.
5. **Zod Body Validation:** Finally, the request body passes through a validation middleware containing a Zod schema. If the parameters (like project description length or budget formats) are invalid, Zod throws a structured error, which the error-handling middleware catches and returns as a `400 Bad Request` with exact field errors.

---

### Question 7: Why did we use `Object.assign(req.query, parsed.query)` instead of `req.query = parsed.query` inside the validation middleware?

**Answer:**
In Express, properties on the request object such as `req.query`, `req.params`, and `req.cookies` are configured with read-only properties or use custom getter/setter bindings under the hood in newer Express versions.

If we try to reassign the root object directly:

```javascript
req.query = parsed.query;
```

It throws a silent error or fails to update because the root reference is protected by Express to prevent developer mistakes.

By using:

```javascript
Object.assign(req.query, parsed.query);
```

we do not modify the object reference itself. Instead, we mutate the existing `req.query` object by copying the properties from the validated Zod output directly into it. This keeps the references intact, respects Express's design, and successfully updates the query values with their typed Zod equivalents.

---

### Question 8: How do you prevent horizontal privilege escalation in the dispute uploads endpoint?

**Answer:**
Horizontal privilege escalation occurs when an authenticated user modifies parameters to access or manipulate data belonging to another user of the same role (e.g., Freelancer A uploading evidence for Freelancer B’s dispute case).

We prevent this by implementing a strict **resource ownership check** inside our controllers:

1. When a request hits `POST /api/dispute/evidence/:id`, the controller extracts `req.user.id` (set securely by the JWT middleware) and the dispute `id` from `req.params`.
2. Before modifying anything, we query the database to fetch the dispute record:
   ```javascript
   const dispute = await prisma.dispute.findUnique({ where: { id } });
   ```
3. We then retrieve the associated contract to find the IDs of the authorized participants: the project `clientId` and the contract `freelancerId`.
4. We evaluate the ownership constraint:
   ```javascript
   if (
     req.user.role !== "ADMIN" &&
     req.user.id !== clientId &&
     req.user.id !== freelancerId
   ) {
     return res
       .status(403)
       .json({ message: "Access denied. Cannot upload evidence." });
   }
   ```
5. Only if this condition evaluates to true do we allow the upload to proceed, ensuring that users can only upload evidence to disputes they are directly involved in.

---

## 3. Real-Time Systems & Socket.io Architecture (CargoGo)

### Question 9: How does the Socket.io Redis adapter enable horizontal scaling across multiple backend instances?

**Answer:**
By default, Socket.io manages connections in memory. When Client A connects to Server Instance 1, and Client B connects to Server Instance 2, they cannot communicate because they are connected to different physical machines. If Server Instance 1 broadcasts an event to a shared "room", Server Instance 2 has no awareness of it.

To solve this, we integrated the **Socket.io Redis adapter** (`@socket.io/redis-adapter` utilizing Redis pub/sub).

- When Server Instance 1 emits a message to a room:
  1. The local Socket.io server interceptor publishes the event payload to a dedicated Redis channel.
  2. All other server instances (Server Instance 2, 3, etc.) are subscribed to this Redis channel.
  3. Upon receiving the message from Redis, Server Instance 2 broadcasts the event to all of its locally connected clients who are members of that room.
     This decouples client connections from individual servers, allowing us to spin up as many backend instances as needed behind a load balancer without breaking real-time communications.

---

### Question 10: How does the location tracking WebSocket handle client disconnection/reconnection without losing state?

**Answer:**
Mobile devices frequently lose connection due to poor cell service. If a driver drops connection for 15 seconds, we handle this using a multi-layered fallback state machine:

1. **Heartbeats & Ping Interval:** Socket.io regularly sends small heartbeats. If a packet is missed, the socket is disconnected.
2. **Reconnection Buffering:** The client-side Socket.io configuration is set to automatically attempt reconnection with exponential backoff.
3. **Redis Location Caching:** Instead of relying entirely on the ephemeral socket session to keep track of driver state, we continuously cache the driver's last known GPS coordinates in Redis under their driver ID (`driver:location:<id>`).
4. **Room Re-joining:** Upon successful reconnection, the client automatically triggers a custom `joinRoom` event to re-cluster the driver into their active booking tracking room.
5. **State Recovery:** The passenger's client automatically queries the REST API or Redis cache for the latest driver location to reconcile any missing coordinates that were sent during the disconnect window, keeping the UI tracking smooth.

---

### Question 11: Explain the architectural difference between WebSockets (WS) and HTTP Long Polling. Why did you choose WS for ride tracking?

**Answer:**

- **HTTP Long Polling:** The client opens an HTTP request, and the server keeps it open until new data is available. Once the server responds, the connection closes, and the client must immediately open a new HTTP request. This incurs massive overhead because every single request requires sending verbose HTTP headers (often 1KB+ of cookies, user-agents, etc.) and executing TCP handshakes, causing high latency and battery drain on mobile devices.
- **WebSockets (WS):** The client initiates a single HTTP request with an `Upgrade: websocket` header. Once accepted, the connection upgrades to a persistent, bi-directional TCP socket. Data frames are sent with minimal overhead (often just 2 to 14 bytes of framing headers), allowing for near-zero latency updates.

We chose **WebSockets** for ride tracking because driver locations are updated every few seconds. HTTP long polling would overwhelm the server with thousands of redundant requests and waste mobile bandwidth, whereas WebSockets stream location frames continuously and efficiently.

---

### Question 12: How do you prevent Socket.io memory leaks on your server?

**Answer:**
Socket.io memory leaks occur when references to disconnected socket objects are retained in memory. We prevent this through:

1. **Explicit Event Listener Cleanup:** When a socket disconnects, we ensure that any custom event listeners registered on global objects (like event emitters or database streams) are removed inside the `disconnect` event handler.
2. **Room Cleanup:** When a booking completes or is cancelled, we make sure all sockets are forced to leave the associated booking room:
   ```javascript
   io.in(`booking_${bookingId}`).socketsLeave(`booking_${bookingId}`);
   ```
3. **Avoiding Closure Scope Leaks:** We do not store socket references inside global array variables or long-lived closures. Instead, we query active connections dynamically using Socket.io APIs (`io.sockets.sockets.get(id)`).

---

## 4. Background Queues & Redis Architecture (CargoGo)

### Question 13: What is BullMQ, and how does it manage job states (waiting, active, failed) in Redis?

**Answer:**
**BullMQ** is a NodeJS message queue and batch job processing library backed by Redis. It allows us to offload long-running tasks (like searching for drivers or updating bookings) to background worker threads, keeping our main Express API responsive.

BullMQ manages job states inside Redis using data structures like Sorted Sets and Hashes:

- **`waiting` (List/Set):** When a job is added (e.g., search driver), BullMQ adds the job ID and details to a Redis List.
- **`active` (Set):** When a worker thread claims a job, BullMQ moves the job ID from the `waiting` list to the `active` set using atomic Redis commands (like Lua scripts) to guarantee that no two workers process the same job.
- **`completed` / `failed` (Sorted Sets):** Once processed, the job is moved here. In case of failure, BullMQ tracks the error log and evaluates the configured **retry strategy** (e.g., wait 5 seconds and try again up to 3 times).

---

### Question 14: Explain the BullMQ driver-matching fallback flow. How does it transition states if no driver accepts?

**Answer:**

1. When a user requests a ride, the Express route creates a booking in the database (status `PENDING`) and adds a matching job to the BullMQ queue with a `delay` of 30 seconds.
2. The server broadcasts the booking request to nearby drivers via WebSockets.
3. If a driver accepts:
   - The REST API updates the booking status to `ACCEPTED` and removes the pending job from BullMQ.
4. If the 30-second window expires and no driver accepts:
   - The BullMQ worker wakes up and executes the job.
   - It checks the database status of the booking. If it is still `PENDING`, the worker triggers the fallback algorithm: it searches the database/Redis cache for the nearest active driver who matches the vehicle type, assigns the booking to them directly, and updates the status to `ASSIGNED`.

---

### Question 15: Why is Redis single-threaded, and how does that prevent race conditions during driver matching?

**Answer:**
Redis executes commands sequentially in a single thread, meaning only one database operation is processed at any given moment. This prevents standard concurrency race conditions (like two drivers accepting the same ride request simultaneously) without requiring expensive lock managers.

When Driver A and Driver B click "Accept" at the same instant:

1. Both requests hit the Express server, which sends update commands to Redis.
2. Redis processes Driver A's command first, marking the booking state as `ASSIGNED` to Driver A.
3. When Redis processes Driver B's command a millisecond later, the state check command fails because the booking is already marked as `ASSIGNED`, and the server returns a "Booking already accepted" response to Driver B.
   This sequence is guaranteed to be linear and atomic because of Redis's single-threaded event loop.

---

### Question 16: How do you configure Redis connection pooling, and why is it necessary?

**Answer:**
Opening and closing database connections for every request is highly expensive due to network handshake overhead. Connection pooling maintains a cache of active, open connections that can be reused across requests.

For Redis, we use the `ioredis` library, which automatically manages connection pooling. We configure two separate Redis clients:

1. **Standard Client:** Used for general read/write operations (like rate limiting and state checks).
2. **Subscriber Client:** Dedicated solely to listening to Redis Pub/Sub events.
   _Why two?_ Because once a Redis connection enters subscription mode, it cannot process standard commands, so we must isolate it from the main connection pool.

---

## 5. Security & Cryptographic Flows (CargoGo)

### Question 17: How does your double-OTP chain-of-custody system work, and how did you implement brute-force protection?

**Answer:**
To guarantee security, we implement a double-OTP system (one for pickup verification, one for dropoff verification).

1. **Generation:** When a booking is confirmed, the server generates two cryptographically secure 6-digit OTPs using Node's `crypto.randomInt` (a CSPRNG, which is mathematically unpredictable, unlike `Math.random()`).
2. **Storage:** The OTPs are stored in Redis under the key `otp:booking:<id>` with a TTL of 15 minutes.
3. **Verification & Lockout:** When the driver inputs the OTP, the server checks the value. If it is incorrect, the server increments a fail counter in Redis:
   ```javascript
   const attempts = await redis.incr(`otp_attempts:booking:${id}`);
   if (attempts >= 3) {
     await prisma.booking.update({ where: { id }, data: { status: "LOCKED" } });
     return res
       .status(403)
       .json({ message: "Too many failed attempts. Booking locked." });
   }
   ```
   This immediately locks the booking state, preventing hackers from brute-forcing the OTPs.

---

### Question 18: Why is `Math.random()` insecure for OTP generation?

**Answer:**
`Math.random()` is a pseudo-random number generator (PRNG) that utilizes a deterministic mathematical formula (like the xorshift algorithm). If an attacker observes a sequence of outputs from `Math.random()`, they can reconstruct the internal state of the generator and predict all future outputs, allowing them to guess the OTPs easily.

We use **`crypto.randomInt()`** which draws entropy from the operating system's cryptographic pool (like `/dev/urandom` on Unix or CryptGenRandom on Windows). This is a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG), making it mathematically impossible to predict future values even if previous ones are known.

---

## 6. System Integration & Fallback Logic (CargoGo)

### Question 19: Explain the OSRM route resolver. What happens if the OSRM service is down?

**Answer:**
The pricing engine relies on road distance to calculate fares. We query the Open Source Routing Machine (OSRM) API to get the exact driving distance and time.

If OSRM is down, we implement a fallback pipeline:

1. The axios request to OSRM times out or returns a non-200 status code.
2. Our code catches the exception inside a `try/catch` block.
3. It immediately switches to the **Haversine formula**, calculating the great-circle (crow-flies) distance between the pickup and dropoff coordinates using earth's radius and trigonometry:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
4. To account for roads, we multiply the straight-line distance by a routing factor (typically `1.3`) and use that value to calculate the price, ensuring the application remains functional even during API outages.

---

### Question 20: How does your volumetric weight calculation work, and how does it dynamically map to vehicle selection?

**Answer:**
In logistics, pricing depends not just on actual weight, but on the volume the cargo occupies (large, light boxes take up truck space).

We implement **volumetric weight** calculations using standard cargo dimensions:
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$

1. The pricing service compares actual weight and volumetric weight, choosing the larger of the two values.
2. Based on this weight and the distance, it maps to the appropriate class in `VEHICLE_RATES` (e.g., if weight $> 500$kg, select Mini Tempo; if $> 2000$kg, select Heavy Duty Truck) and calculates the correct dynamic fare.

---

## 7. Performance Benchmarks, Bottlenecks & Optimization (FreelanceGuard & CargoGo)

### Question 21: How do you identify database query bottlenecks in Prisma, and how do database indexes resolve slow query times?
**Answer:**
Database query bottlenecks occur when Prisma has to scan every single row in a table to find matching records (a full table scan). As the database grows to hundreds of thousands of records, this operation slows down exponentially. We identify these bottlenecks by enabling Prisma's query logging in development:
```javascript
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
```
This prints the exact SQL statements and execution times to the console.

To resolve slow queries, we implement **Database Indexes**. In PostgreSQL, an index is a separate data structure (typically a B-Tree) that stores pointer references to the actual rows sorted by a specific column (like `email` in the `User` table, or `userId` in the `KYC` table). Instead of scanning the entire table ($O(N)$ complexity), the database performs a binary-like search on the B-Tree index ($O(\log N)$ complexity) to find matching rows instantly. In Prisma, we define these using the `@@index` or `@unique` annotations in the schema file.

---

### Question 22: What is database connection starvation, and how do you configure connection pooling limits on Render and Neon?
**Answer:**
Database connection starvation occurs when the server's pool of open database connections is exhausted because too many concurrent requests are trying to communicate with the database simultaneously. When this happens, new incoming requests are forced to wait for an available connection, leading to extreme latency spikes or database connection timeouts.

To prevent this, we configure the **connection pool size** in our database URL:
* **Direct Connection:** When running migrations or background scripts, we use the direct connection string to execute queries without pooling overhead.
* **Pooler Connection:** For the production web server, we append the connection pool size to the connection string (e.g., `postgresql://...&connection_limit=10`). 
On Render's free tier (which has limited memory), we set the connection limit relatively low (typically `10` or `15` connections per instance) to ensure the server doesn't exhaust Neon's maximum concurrent connection limit (which is shared across active branches).

---

### Question 23: Explain the caching strategy using Redis in CargoGo. What is the difference between Write-Through and Cache-Aside (Lazy Loading)?
**Answer:**
Caching stores frequently read, slowly changing data in memory (Redis) to avoid making expensive, slow queries to the disk-bound primary database (PostgreSQL). We evaluate two main caching strategies:
1. **Cache-Aside (Lazy Loading):** When a request comes in, the application checks Redis first. If the data is found (cache hit), it is returned. If not found (cache miss), the application queries PostgreSQL, writes the result to Redis for future requests, and returns it. This is highly memory-efficient because only requested data is cached.
2. **Write-Through:** Every time a write operation occurs (e.g., updating driver coordinates), the application writes the update to both the database and the Redis cache simultaneously. This ensures the cache is never stale, but increases write latency because every write requires hitting two databases.
In CargoGo, we use **Cache-Aside** for static properties (like vehicle rates) and **Write-Through** for highly dynamic real-time states (like active driver location streams) where zero latency is required.

---

### Question 24: What is cache eviction, and why are TTLs (Time-To-Live) critical when using Redis?
**Answer:**
Cache eviction occurs when Redis runs out of memory and has to remove older keys to make room for new ones according to its configured eviction policy (e.g., Least Recently Used - LRU).

TTLs (Time-To-Live) specify an expiration timer (in seconds) on cached keys. Once the timer expires, Redis automatically deletes the key. TTLs are critical because:
* They prevent **stale data** (e.g., if a driver changes status, a cache with a 10-minute TTL ensures the old status won't be shown forever if the write-update code fails).
* They prevent **memory bloat** by automatically purging temporary session tokens, OTP codes, or transient location logs that are no longer active, keeping the memory footprint clean.

---

### Question 25: Walk me through the exact k6 load testing configuration you used. What metrics did you monitor, and what did they reveal?
**Answer:**
We configured **k6** to run a multi-stage load test simulating realistic traffic ramp-up:
```javascript
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 concurrent users
    { duration: '1m', target: 100 },  // Sustain 100 users
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
    http_req_duration: ['p(95)<200'],  // 95% of requests must complete under 200ms
  },
};
```
During the test, we monitored:
* `http_req_duration`: Average, median, and 95th-percentile (p95) response times.
* `http_req_failed`: The percentage of error responses (e.g. 500, 502, 504).
* `iterations`: Total successful execution loops completed.

The tests revealed that the Express Zod parsing stage was CPU-bound, but database queries were the main bottleneck. Adding B-Tree indexes on foreign keys (`userId` and `contractId`) reduced the p95 latency under concurrent load from 340ms to 61ms.

---

### Question 26: Explain the difference between Average, p95, and p99 Latency. Why is relying only on Average latency misleading?
**Answer:**
* **Average Latency:** The sum of all response times divided by the total number of requests.
* **p95 Latency:** The 95th percentile, meaning 95% of all requests completed faster than this value, and only 5% were slower.
* **p99 Latency:** The 99th percentile, meaning 99% of requests completed faster, and 1% experienced the slowest response times.

Relying only on the average is misleading because of the **"outlier effect"**. If 99 users experience a fast response of 10ms, but 1 user experiences a database lock timeout of 10,000ms, the average is ~110ms. This hides the fact that 1% of your users are experiencing a completely broken, slow interface. Inspecting p95 and p99 latencies exposes these worst-case scenarios, which are usually caused by resource contention, garbage collection pauses, or database lock queues.

---

## 8. Network Protocols, CORS & API Design (FreelanceGuard & CargoGo)

### Question 27: What is CORS (Cross-Origin Resource Sharing), and how does it secure web applications?
**Answer:**
CORS is a browser-enforced security mechanism that prevents malicious websites from reading data from your backend API without authorization. 
* By default, browsers block web pages from making requests to a different domain than the one that served the page (e.g., a page served from `malicious.com` cannot fetch data from `yourbank.com` using the user's cookies).
* To permit legitimate cross-origin requests, the backend server must include specific headers in its response (e.g., `Access-Control-Allow-Origin: https://freelance-guard-mu.vercel.app` and `Access-Control-Allow-Credentials: true`).
If the browser makes a request and the backend response headers do not match the origin, the browser blocks the response data from being read by the JavaScript client.

---

### Question 28: What is a CORS preflight request (OPTIONS method), and when does the browser trigger it?
**Answer:**
A preflight request is an initial check the browser makes before sending the actual request, to confirm if the server supports cross-origin requests.
* The browser sends an HTTP request using the **`OPTIONS`** method to the target endpoint.
* It includes headers describing the planned request (e.g., `Access-Control-Request-Method: POST` and `Access-Control-Request-Headers: content-type`).
* The server responds with allowed methods and headers. If allowed, the browser proceeds to send the actual request.

**Trigger Conditions:** The browser triggers a preflight request for any request that is not a "simple request". This includes:
* Any request using methods other than `GET`, `HEAD`, or `POST`.
* Any request containing custom headers (like `Authorization` token headers).
* Any request where the `Content-Type` header is set to `application/json`.

---

### Question 29: Explain the difference between HTTP Status Codes: 400, 401, 403, 404, 422, and 500.
**Answer:**
* **`400 Bad Request`:** The request format is malformed or invalid (e.g. invalid JSON syntax).
* **`401 Unauthorized`:** The request lacks valid authentication credentials (e.g. missing or expired JWT).
* **`403 Forbidden`:** The user is authenticated but does not have permission to access the resource (e.g., a freelancer attempting to view admin panel data).
* **`404 Not Found`:** The requested endpoint or resource does not exist in the database.
* **`422 Unprocessable Entity`:** The request format is correct, but the semantic data is invalid (e.g., Zod validation failed because a password was too short).
* **`500 Internal Server Error`:** An unhandled error occurred on the server (e.g., the database crashed or a variable was undefined).

---

### Question 30: What is Idempotency in API design, and how do you ensure an API endpoint is idempotent?
**Answer:**
An API endpoint is **idempotent** if making multiple identical requests has the exact same effect on the server state as making a single request (e.g. clicking a "Submit Payment" button three times should only charge the user once).
* **Naturally Idempotent:** `GET`, `PUT`, and `DELETE` requests are naturally idempotent (deleting an item twice leaves it deleted).
* **Non-Idempotent:** `POST` is not naturally idempotent (submitting a form twice creates two records).

We ensure idempotency on non-idempotent endpoints by using an **Idempotency Key**:
1. The client generates a unique UUID (the idempotency key) and sends it in the request header.
2. The server checks Redis to see if the key exists.
3. If it exists, the server returns the cached response from the first request without running the business logic again.
4. If not, the server processes the request, saves the response in Redis associated with the key, and returns it.

---

## 9. Advanced Coding Practices & Software Architecture

### Question 31: What are SOLID principles, and how did you apply them in your projects?
**Answer:**
SOLID is an acronym representing five design principles for writing clean, maintainable code:
1. **Single Responsibility (SRP):** A class/module should have only one reason to change. *Application:* In CargoGo, the pricing calculations are isolated inside `pricing.service.ts` rather than cluttering the routing controllers.
2. **Open/Closed (OCP):** Software entities should be open for extension but closed for modification. *Application:* We design pricing models using classes that inherit from a base class, allowing us to add new vehicle rules without modifying the main routing loops.
3. **Liskov Substitution (LSP):** Subtypes must be substitutable for their base types. *Application:* Any custom database adapter must implement a common interface.
4. **Interface Segregation (ISP):** Clients should not be forced to depend on interfaces they do not use.
5. **Dependency Inversion (DIP):** Depend on abstractions, not concretions. *Application:* Using Prisma client abstractions instead of hardcoded raw SQL queries allows switching database dialects with zero controller changes.

---

### Question 32: What is the difference between Unit Tests, Integration Tests, and End-to-End (E2E) Tests?
**Answer:**
* **Unit Tests:** Test individual functions or classes in isolation. All external dependencies (like database connections or API requests) are replaced with mocks. *Complexity:* Low. *Speed:* Extremely fast.
* **Integration Tests:** Test how multiple components or services interact (e.g., testing if an Express route successfully queries the database and returns a correct response). *Complexity:* Medium. *Speed:* Slower.
* **E2E Tests:** Test the entire application flow from the user's perspective, simulating browser clicks and tracking requests all the way to the backend database. *Complexity:* High. *Speed:* Slowest.

In FreelanceGuard and CargoGo, we focused on **Integration Tests** using Jest and Supertest to verify that our authentication routers and escrow interactive transactions operated correctly with real database queries.

---

### Question 33: Explain the concept of Database Normalization. What are 1NF, 2NF, and 3NF?
**Answer:**
Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.
* **1NF (First Normal Form):** Every column must contain atomic (indivisible) values, and there must be no repeating groups.
* **2NF (Second Normal Form):** Must be in 1NF, and all non-key columns must be fully functionally dependent on the primary key (no partial dependencies on composite keys).
* **3NF (Third Normal Form):** Must be in 2NF, and there must be no transitive dependencies (non-key columns cannot depend on other non-key columns).

In both projects, we designed our schemas to satisfy **3NF** to prevent update anomalies. For instance, instead of storing the freelancer's name directly in the `Contract` table (which would duplicate data and cause inconsistencies if the freelancer renamed themselves), we store a reference `freelancerId` pointing to the `User` table.

---

### Question 34: What is the event-driven loop in Node.js, and how does it handle asynchronous I/O?
**Answer:**
Node.js is single-threaded, meaning it executes JavaScript code sequentially. To handle thousands of concurrent operations (like database reads or API requests) without blocking the thread, Node uses an **Event Loop** powered by the **libuv** C++ library.

When an asynchronous operation (like querying PostgreSQL) is executed:
1. JavaScript registers the callback and offloads the operation to the operating system or libuv thread pool.
2. The main thread continues executing other code immediately.
3. Once the OS completes the database query, it places the callback into the event loop task queue.
4. When the call stack is empty, the Event Loop pulls the callback from the queue and executes it on the main thread.
This allows Node to handle highly concurrent I/O-bound applications with minimal system overhead.

---

## 10. Behavioral & System Troubleshooting

### Question 35: Tell me about a time you encountered a silent bug or runtime crash in production. How did you diagnose and solve it?
**Answer:**
During the setup of FreelanceGuard's request validation pipeline, the application would silently crash with a Zod parsing exception under concurrent traffic. 
* **Diagnosis:** I inspected the Render container log stream. The traceback showed that our validation middleware was attempting to reassign the query parameters object directly on `req.query`. Because newer versions of Express set `req.query` with read-only descriptors, the reassignment was throwing a TypeError.
* **Solution:** I resolved this by mutating the query object in-place using `Object.assign(req.query, parsed.query)` instead of reassigning the reference. This resolved the crash and preserved typed query variables across all middleware.

---

### Question 36: What is a memory leak, and how do you profile and debug memory issues in Node.js?
**Answer:**
A memory leak occurs when a program retains references to allocated memory that is no longer needed, preventing the garbage collector from reclaiming it. In Node.js, this is often caused by global variables, uncleared intervals, or active event listeners on closed sockets.

We profile memory leaks by:
1. Running Node with the `--inspect` flag to connect the Chrome DevTools profiler.
2. Taking consecutive **Heap Snapshots** under load.
3. Comparing snapshots to locate objects that grow continuously in size without being collected.

---

### Question 37: If you were to rebuild CargoGo from scratch, what architectural decision would you change and why?
**Answer:**
If rebuilding CargoGo, I would shift from standard REST APIs for booking updates to a fully **Event-Driven Architecture** utilizing a message broker like **Apache Kafka** or **RabbitMQ** instead of Redis/BullMQ.
* **Why:** Redis-backed queues are fast and lightweight, but they keep job logs in-memory. As traffic grows, memory usage escalates quickly. A persistent message broker like Kafka writes message streams to disk, providing durable event sourcing, consumer groups, and replayable message logs, which is much more robust for global dispatching systems.

---

### Question 38: How do you handle secrets and environmental configurations safely in a team project?
**Answer:**
To protect secret credentials (like database URLs, JWT keys, and API tokens):
* We never commit `.env` files to git. We ensure they are added to `.gitignore`.
* We provide a `.env.example` file containing the variable keys with empty values as a template for other developers.
* In production, we inject these variables securely using the platform's native dashboard settings (Render environment variables, Vercel secrets), ensuring they are never exposed in source code.

---

### Question 39: Explain the difference between encryption, hashing, and encoding.
**Answer:**
* **Encoding:** Transforming data into a different format for safe transmission (e.g. Base64 encoding binary images to strings). It is easily reversible and provides zero security.
* **Hashing:** A one-way cryptographic function that maps input data to a fixed-size string (e.g., hashing user passwords using bcrypt). It cannot be reversed to reveal the original input.
* **Encryption:** A two-way function that transforms data using an encryption key (e.g., AES). It can be decrypted back to its original format using the correct decryption key.

---

### Question 40: What are database migrations, and why are they necessary when changing database schemas?
**Answer:**
Database migrations are version-controlled scripts that track changes made to the database schema over time. 
* Without migrations, making changes (like adding a column to the `User` table) requires manual SQL execution on production databases, which is prone to human error and breaks synchronization across development teams.
* Prisma tracks schema changes by generating migration files (`prisma migrate dev`). Running these scripts applies the changes consistently across local development, staging, and production environments, keeping the database schemas in sync.

---

## 11. Database Management Systems (DBMS) & SQL Deep Dive

### Question 41: Explain the difference between Clustered and Non-Clustered Indexes in a database.
**Answer:**
* **Clustered Index:** Defines the physical order in which rows are stored on the disk. Because data rows can only be sorted in one physical order, a table can have only **one** clustered index (usually automatically created on the Primary Key). Searching a clustered index yields the actual row directly.
* **Non-Clustered Index:** A separate physical structure from the data rows. It contains the indexed columns and pointers (row locators) pointing to the actual data rows. A table can have **multiple** non-clustered indexes. Searching a non-clustered index yields a pointer, which the database then uses to fetch the row from disk (an operation called a "Key Lookup").

---

### Question 42: What are database anomalies, and how does normalization resolve them?
**Answer:**
Database anomalies are inconsistencies in data caused by poor database design and data redundancy. There are three types:
1. **Insertion Anomaly:** Being unable to insert certain data without the presence of other unrelated data (e.g., cannot record a new course until a student enrolls in it).
2. **Update Anomaly:** Having to update multiple redundant rows to change a single piece of information (e.g., if a student's address is stored in 5 different enrollment rows, failing to update all 5 leads to inconsistent data).
3. **Deletion Anomaly:** Unintentionally losing vital information when deleting unrelated data (e.g., deleting a student record also deletes the only record of a course detail).

Normalization structures tables to ensure each fact is stored in exactly **one** place, eliminating redundancy and preventing these anomalies.

---

### Question 43: Explain the difference between SQL JOINs: INNER, LEFT, RIGHT, FULL, and CROSS.
**Answer:**
* **INNER JOIN:** Returns records that have matching values in both tables.
* **LEFT JOIN (or LEFT OUTER JOIN):** Returns all records from the left table, and the matched records from the right table. If no match is found, NULL is returned for the right table columns.
* **RIGHT JOIN (or RIGHT OUTER JOIN):** Returns all records from the right table, and the matched records from the left table. If no match, NULL is returned for the left table.
* **FULL JOIN (or FULL OUTER JOIN):** Returns all records when there is a match in either left or right table.
* **CROSS JOIN:** Returns the Cartesian product of the two tables (combines every row of the first table with every row of the second table).

---

### Question 44: What is the CAP Theorem, and how does it apply to distributed databases?
**Answer:**
The CAP Theorem states that a distributed data store can simultaneously provide at most two of the following three guarantees:
1. **Consistency (C):** Every read receives the most recent write or an error.
2. **Availability (A):** Every non-failing node returns a non-error response (without guarantee that it contains the most recent write).
3. **Partition Tolerance (P):** The system continues to operate despite arbitrary message loss or node failures.

Because physical networks are guaranteed to experience partitions (network cuts), a distributed system **must** be partition-tolerant (P). Therefore, it must choose between:
* **CP (Consistency / Partition Tolerance):** Reject requests if nodes cannot sync (prioritizes accuracy, e.g., financial systems).
* **AP (Availability / Partition Tolerance):** Return stale data if nodes cannot sync (prioritizes uptime, e.g., social networks).

---

### Question 45: What is the difference between a SQL View and a Materialized View?
**Answer:**
* **Standard View:** A virtual table containing a saved SQL query. It does not store data on the disk. When you query a standard view, the database runs the underlying query on the fly. *Pros:* Takes up no disk space. *Cons:* Can be slow for complex joins.
* **Materialized View:** A physical table that stores the query results on the disk. When you query a materialized view, it reads the pre-computed data instantly. *Pros:* Extremely fast. *Cons:* Data becomes stale when underlying tables change, requiring manual or scheduled refreshes (`REFRESH MATERIALIZED VIEW`).

---

### Question 46: Explain ACID properties in databases.
**Answer:**
ACID is a set of properties that guarantee database transactions are processed reliably:
* **Atomicity:** All operations within the transaction succeed, or the entire transaction is rolled back (All-or-Nothing).
* **Consistency:** A transaction must transition the database from one valid state to another, maintaining all schema constraints and rules.
* **Isolation:** Concurrent execution of transactions leaves the database in the same state as if they were run sequentially.
* **Durability:** Once a transaction is committed, its changes are permanently written to non-volatile disk storage and will survive system crashes.

---

## 12. Operating Systems (OS) & Concurrency Fundamentals

### Question 47: What is the difference between a Process and a Thread?
**Answer:**
* **Process:** An executing instance of a program that is run in its own isolated memory address space. Processes do not share memory with each other and require Inter-Process Communication (IPC) (like sockets or pipes) to share data. Creating a process is resource-heavy.
* **Thread:** A lightweight unit of execution belonging to a parent process. All threads of a process share the same memory space (heap, global variables) but have their own individual stack and program counter. Creating threads is fast, but sharing memory requires careful locking to prevent race conditions.

---

### Question 48: What is a Deadlock in OS, and what are the four necessary conditions for it to occur?
**Answer:**
A deadlock is a state where a set of processes are blocked because each process holds a resource and waits for another resource held by some other process in the set.

For a deadlock to occur, **Coffman’s four conditions** must hold simultaneously:
1. **Mutual Exclusion:** At least one resource must be held in a non-shareable mode (only one process can use it at a time).
2. **Hold and Wait:** A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. **No Preemption:** Resources cannot be forcibly taken from a process; they must be released voluntarily.
4. **Circular Wait:** Process A waits for a resource held by B, B waits for C, and C waits for A, forming a closed loop.

---

### Question 49: Explain the difference between a Mutex and a Semaphore.
**Answer:**
* **Mutex (Mutual Exclusion):** A locking mechanism used to synchronize access to a resource. It is a binary flag owned by exactly **one** thread. Only the thread that acquired the mutex lock can release it.
* **Semaphore:** A signaling mechanism that controls access to a resource using a counter.
  * **Binary Semaphore:** Similar to a mutex, but has no ownership concept (any thread can signal/release it).
  * **Counting Semaphore:** Initialized with a value $N$. Up to $N$ threads can acquire it simultaneously. Useful for managing a pool of identical resources (like database connection pools).

---

### Question 50: What is Paging, and what is a Page Fault?
**Answer:**
* **Paging:** A memory management scheme that eliminates the need for contiguous allocation of physical memory. The OS divides virtual memory into fixed-size blocks called **Pages**, and physical memory into blocks of the same size called **Frames**. A Page Table maps pages to frames.
* **Page Fault:** An interrupt raised by the hardware MMU (Memory Management Unit) when a process tries to access a page that is mapped in its virtual address space but is not currently loaded in physical RAM. The OS intercepts this, loads the page from disk swap space into RAM, and resumes execution.

---

### Question 51: What is Context Switching, and why does it introduce latency?
**Answer:**
Context Switching is the process of storing the state of a CPU core (registers, program counter, stack pointer) for an active process/thread so that it can be paused and another process/thread can resume execution. 

It introduces latency because:
* The CPU has to perform register saves and restores, which takes execution cycles.
* It invalidates CPU cache tables (L1/L2 caches, TLB), forcing the new process to fetch instructions from slower main RAM until the cache warm-up completes.

---

### Question 52: Explain the difference between Monolithic and Microkernel OS architectures.
**Answer:**
* **Monolithic Kernel:** All operating system services (file system, drivers, virtual memory, scheduling) run in the same privileged kernel space. *Pros:* Extremely fast due to direct function calls. *Cons:* A single driver crash can crash the entire system.
* **Microkernel:** Only core services (scheduling, IPC, basic memory management) run in kernel space. All other services (drivers, file systems) run in user space. *Pros:* Highly stable and modular. *Cons:* Slow performance due to heavy message-passing overhead.

---

## 13. Computer Networks (CN) & Web Protocols

### Question 53: Walk through the TCP Three-Way Handshake.
**Answer:**
The TCP three-way handshake establishes a reliable connection between a client and a server:
1. **SYN (Synchronize):** The client sends a packet with the SYN flag set and a random sequence number $x$ to the server, requesting a connection.
2. **SYN-ACK (Synchronize-Acknowledge):** The server receives the SYN. It responds with a packet where both SYN and ACK flags are set. It sets the acknowledgment number to $x+1$ and generates its own random sequence number $y$.
3. **ACK (Acknowledge):** The client receives the SYN-ACK. It sends a final packet with the ACK flag set, setting the sequence number to $x+1$ and the acknowledgment number to $y+1$.
The connection is now established, and data transmission can begin.

---

### Question 54: Explain the difference between HTTP/1.1, HTTP/2, and HTTP/3.
**Answer:**
* **HTTP/1.1:** Sends requests sequentially over a single TCP connection. Introduces **Head-of-Line (HOL) Blocking**—if a request is delayed, all subsequent requests behind it are blocked.
* **HTTP/2:** Introduces **Multiplexing** over a single TCP connection, sending multiple requests/responses concurrently in binary streams. Resolves application-level HOL, but still suffers from TCP-level HOL (if a single packet is lost, TCP stalls all streams).
* **HTTP/3:** Replaces TCP with **QUIC** (built on top of UDP). QUIC handles packet loss independently per stream, completely eliminating TCP Head-of-Line blocking.

---

### Question 55: What is the difference between asymmetric and symmetric encryption in HTTPS?
**Answer:**
* **Symmetric Encryption:** Uses the **same key** to both encrypt and decrypt data (e.g. AES). It is extremely fast but requires both parties to share the key securely.
* **Asymmetric Encryption:** Uses a **key pair**: a public key (for encryption) and a private key (for decryption) (e.g. RSA). It is slow but secure.

**In HTTPS:** The client and server use **asymmetric encryption** during the SSL/TLS handshake to authenticate each other and securely exchange a temporary symmetric key. Once the symmetric key is exchanged, they switch to **symmetric encryption** for encrypting the actual session traffic to ensure fast performance.

---

### Question 56: What happens when you type a URL like `https://google.com` into your browser? Walk through the network steps.
**Answer:**
1. **DNS Lookup:** The browser checks local cache. If missing, it queries recursive DNS servers, root name servers, TLD servers, and authoritative name servers to resolve the domain `google.com` to an IP address.
2. **TCP Handshake:** The browser initiates a TCP 3-way handshake with the server's IP address on port 443.
3. **TLS/SSL Handshake:** The browser and server negotiate TLS versions, exchange certificates, verify identity, and generate symmetric session keys.
4. **HTTP Request:** The browser sends an encrypted HTTP `GET` request.
5. **Server Processing & Response:** The server processes the request and sends back the HTML response.
6. **Browser Rendering:** The browser parses the HTML, fetches CSS/JS resources, constructs the DOM tree, and renders the page.

---

### Question 57: What is the difference between a Cookie, LocalStorage, and SessionStorage?
**Answer:**
* **Cookie:** Stored in the browser and automatically sent to the server with *every* HTTP request. Max size is 4KB. Can be secured with `HttpOnly` and `Secure` flags.
* **LocalStorage:** Persistent key-value storage inside the browser. Data remains indefinitely until cleared by code or user. Max size is 5-10MB. Accessible only via JavaScript.
* **SessionStorage:** Key-value storage inside the browser. Data is cleared automatically when the tab is closed. Max size is 5MB.

---

### Question 58: Explain the difference between TCP and UDP.
**Answer:**
* **TCP (Transmission Control Protocol):** Connection-oriented. Guarantees packet delivery, packet order, and implements flow control. Slow due to handshake and ACK overhead. Used for HTTP, FTP, and email.
* **UDP (User Datagram Protocol):** Connectionless. Does not guarantee delivery, order, or flow control. Fast and lightweight. Used for video streaming, gaming, and real-time WebSockets (QUIC).

---

### Question 59: What is DNS, and how does it resolve queries recursively?
**Answer:**
Domain Name System (DNS) translates human-readable domain names (google.com) into machine-readable IP addresses.
* **Recursive Resolution:**
  1. The client requests the IP from the **Recursive Resolver** (ISP/Cloudflare).
  2. The resolver queries the **Root Server** (which points to TLD servers).
  3. The resolver queries the **TLD Server** (like `.com` servers).
  4. The resolver queries the **Authoritative Name Server** (the DNS host of the domain).
  5. The resolver caches the IP and returns it to the client.

---

### Question 60: What is a Reverse Proxy, and how does it differ from a forward proxy?
**Answer:**
* **Forward Proxy:** Sits in front of clients. It intercepts outgoing client requests and forwards them to servers, shielding the client's identity (e.g. VPNs).
* **Reverse Proxy:** Sits in front of servers. It intercepts incoming requests from the internet and routes them to appropriate backend instances, handling load balancing, SSL termination, and caching (e.g. Nginx, Cloudflare).

---

## 14. Data Structures & Algorithms (DSA) Interview Patterns

### Question 61: Explain the Sliding Window Pattern. When should we use it, and what is its time complexity?
**Answer:**
The **Sliding Window** pattern is a technique used to perform operations on a contiguous sub-array or sub-string of a given list/string. Instead of recalculating the results from scratch for every index (which leads to $O(N \cdot K)$ or $O(N^2)$ brute-force complexity), we maintain a running window using two pointers (start and end). As the end pointer expands the window, we add the new element's contribution. When certain criteria are met, we contract the window by incrementing the start pointer, subtracting the discarded element's contribution.

* **When to use:** When the problem asks for the longest/shortest/optimal contiguous subarray or substring satisfying a specific condition (e.g. "Longest substring without repeating characters" or "Maximum sum subarray of size K").
* **Complexity:** $O(N)$ time complexity because each element is visited at most twice (once by the end pointer, and once by the start pointer). Space complexity is typically $O(1)$ or $O(K)$ depending on the auxiliary hash map/set used to store window states.

---

### Question 62: Walk through Floyd’s Cycle Detection Algorithm (Hare and Tortoise). How does it detect loops in a Linked List?
**Answer:**
Floyd’s Cycle Detection Algorithm uses two pointers moving at different speeds to detect cycles in a Linked List:
1. **Pointers Initialization:** Start both `slow` and `fast` pointers at the head of the list.
2. **Execution:** Move `slow` forward by one node, and `fast` forward by two nodes in each step.
   * If there is no cycle, `fast` (or `fast.next`) will reach the end (`null`), proving the list is linear.
   * If there is a cycle, the `fast` pointer will loop around and eventually catch up to the `slow` pointer, meaning `slow === fast` at some node.

**Mathematical Proof of Intersection:**
Let the distance from the head to the start of the cycle be $X$, and the length of the cycle be $Y$. When `slow` enters the cycle, it has traveled $X$ steps. `fast` has traveled $2X$ steps and is already inside the cycle at some position. The relative speed between them is 1 step per loop. Thus, `fast` is guaranteed to catch up to `slow` in at most $Y$ steps, ensuring they meet.

---

### Question 63: What is the difference between Depth First Search (DFS) and Breadth First Search (BFS) in Tree/Graph traversals?
**Answer:**
* **DFS (Depth First Search):** Explores as deep as possible along each branch before backtracking. It uses a **Stack** data structure (or recursion call stack).
  * *Traversal order (Tree):* Pre-order, In-order, Post-order.
  * *Complexity:* Time $O(V + E)$, Space $O(V)$ (worst-case recursion stack height).
  * *Best for:* Finding paths, cycle detection, topological sorting, and problems requiring recursion (like backtracking or maze solving).
* **BFS (Breadth First Search):** Explores all neighbor nodes at the current depth before moving to the next level. It uses a **Queue** data structure.
  * *Traversal order (Tree):* Level-order.
  * *Complexity:* Time $O(V + E)$, Space $O(V)$ (queue storing the maximum width of the graph).
  * *Best for:* Finding the **shortest path** on unweighted graphs (first time a node is reached is guaranteed to be the shortest path).

---

### Question 64: Explain the difference between Memoization (Top-Down) and Tabulation (Bottom-Up) in Dynamic Programming.
**Answer:**
* **Memoization (Top-Down):** Solves the problem recursively by breaking it into subproblems. Every time a subproblem is solved, the result is saved in a lookup table (cache). Before solving a subproblem, the algorithm checks the cache first.
  * *Pros:* Easy to write recursively; only solves the subproblems that are actually needed.
  * *Cons:* Overhead of recursion call stack, risking Stack Overflow for deep recursions.
* **Tabulation (Bottom-Up):** Solves the problem iteratively by solving the smallest subproblems first and building up the solution. Results are stored in a table (usually a 1D or 2D array).
  * *Pros:* No recursion overhead; often allows space optimization (discarding older rows).
  * *Cons:* Requires solving all subproblems sequentially, even if some aren't needed.

---

### Question 65: Explain Dijkstra’s Algorithm. How does it find the shortest path in a weighted graph, and what are its limitations?
**Answer:**
Dijkstra’s Algorithm finds the shortest path from a single source node to all other nodes in a weighted graph with non-negative edge weights:
1. **Initialize:** Set the distance to the source node to `0` and all other nodes to `infinity`. Add all nodes to a Min-Priority Queue.
2. **Loop:** While the queue is not empty:
   * Extract the node $U$ with the minimum distance.
   * For each neighbor $V$ of $U$, calculate the tentative distance: `dist[U] + weight(U, V)`.
   * If this value is less than the current `dist[V]`, update `dist[V]` and push the updated node to the Priority Queue (a step called "relaxation").
* **Complexity:** $O((V + E) \log V)$ when using a binary heap priority queue.
* **Limitation:** Fails on graphs with **negative edge weights**, as it assumes once a node is visited, its shortest path is finalized. For negative weights, Bellman-Ford must be used.

---

### Question 66: What is a Binary Search Tree (BST), and what are its average and worst-case time complexities?
**Answer:**
A Binary Search Tree is a binary tree where:
* The left subtree of a node contains only nodes with keys **less** than the node's key.
* The right subtree contains only nodes with keys **greater** than the node's key.
* Left and right subtrees must also be BSTs.

**Time Complexities:**
* **Search / Insert / Delete (Average Case):** $O(\log N)$ time, occurring when the tree is balanced.
* **Search / Insert / Delete (Worst Case):** $O(N)$ time, occurring when the tree is completely unbalanced or skewed (like a linked list, e.g., inserting sorted values `1 -> 2 -> 3 -> 4`).
* *Note:* Self-balancing trees (like AVL trees or Red-Black trees) guarantee $O(\log N)$ worst-case complexity by rotating nodes during insertion.

---

## 15. Advanced JavaScript & TypeScript Core Concepts

### Question 67: What is a Closure in JavaScript, and what are its practical use cases?
**Answer:**
A **Closure** is the combination of a function bundled together with references to its surrounding state (the **lexical environment**). In other words, a closure allows an inner function to access variables from its outer scope even after the outer function has finished executing.

* **How it works:** When a function is defined in JS, it retains a reference to its parent scope chain.
* **Practical Use Cases:**
  1. **Data Privacy / Encapsulation:** Creating private variables that cannot be accessed or modified from the outside.
     ```javascript
     function createCounter() {
       let count = 0; // Private variable
       return {
         increment: () => ++count,
         getCount: () => count
       };
     }
     ```
  2. **Function Factories:** Creating functions with pre-configured parameters.
  3. **Event Handlers & Callbacks:** Storing state across asynchronous execution frames.

---

### Question 68: Explain the Event Loop in JavaScript. How do Microtasks differ from Macrotasks?
**Answer:**
JavaScript is a single-threaded language. To handle asynchronous execution, the JS runtime coordinates a Call Stack, a Web API environment, a Callback Queue (Macrotask Queue), and a Microtask Queue.

The **Event Loop** constantly monitors the Call Stack. If the stack is empty, it processes pending tasks in this order:
1. **Microtask Queue:** Explores and executes *all* callbacks in the microtask queue until it is empty. Microtasks include:
   * Promise callbacks (`.then()`, `.catch()`, `.finally()`)
   * `MutationObserver`
   * `process.nextTick` (in Node.js)
2. **Macrotask Queue (Callback Queue):** Executes **one** task from the macrotask queue. Macrotasks include:
   * `setTimeout`, `setInterval`
   * File I/O operations
   * DOM events (click, scroll)
   * `setImmediate`
3. After executing a single macrotask, the loop checks the microtask queue again, repeating this cycle.

---

### Question 69: Explain the difference between `==` and `===` in JavaScript.
**Answer:**
* **`==` (Loose Equality / Double Equals):** Compares two values for equality after performing **Type Coercion**. If the types are different, JavaScript attempts to convert them to a common type before comparing (e.g. `'5' == 5` evaluates to `true` because the string is coerced to a number).
* **`===` (Strict Equality / Triple Equals):** Compares both the **value** and the **type** for equality. No type coercion is performed. If the types are different, the comparison immediately returns `false` (e.g. `'5' === 5` evaluates to `false`).

---

### Question 70: What is Prototype Inheritance in JavaScript? How does it differ from Class Inheritance?
**Answer:**
* **Prototype Inheritance:** Every JavaScript object has a private property pointing to another object called its **Prototype**. When you access a property or method on an object, JavaScript checks the object itself first. If not found, it traverses up the prototype chain until it finds the property or reaches the end (`null`). This is object-to-object delegation.
* **Class Inheritance (Classical):** Used in languages like Java or C++. Classes act as blueprints. When you instantiate an object, the compiler copies all properties and methods from the class blueprint down to the new object instance.

In JavaScript, the `class` keyword (introduced in ES6) is merely **syntactic sugar** over prototype inheritance. Under the hood, JS still uses prototypes to delegate properties and methods, rather than copying blueprints.

---

### Question 71: Explain the difference between `bind`, `call`, and `apply` in JavaScript.
**Answer:**
All three methods are used to set the `this` context of a function explicitly:
* **`call`:** Invokes the function immediately, passing the `this` context as the first argument, and additional function arguments individually separated by commas.
  ```javascript
  greet.call(personObj, "Hello", "World");
  ```
* **`apply`:** Invokes the function immediately, passing the `this` context as the first argument, and additional arguments as a **single array**.
  ```javascript
  greet.apply(personObj, ["Hello", "World"]);
  ```
* **`bind`:** Does **not** invoke the function immediately. Instead, it returns a **new function** with its `this` context permanently bound to the passed object, which can be executed later.
  ```javascript
  const boundGreet = greet.bind(personObj);
  boundGreet("Hello", "World");
  ```

---

### Question 72: What is the difference between `null` and `undefined` in JavaScript?
**Answer:**
* **`undefined`:** Represents the default value assigned by the JavaScript engine to variables that have been declared but not initialized, or missing function arguments. It means "value not set".
* **`null`:** An **explicit assignment** by the developer indicating that a variable has no value or points to nothing. It represents "empty" or "void".
* *Note on types:* `typeof undefined` returns `'undefined'`, whereas `typeof null` returns `'object'` (which is a historical bug in JavaScript's implementation).

---

### Question 73: What is the difference between `var`, `let`, and `const` in JavaScript?
**Answer:**
* **Scope:** `var` is function-scoped. `let` and `const` are block-scoped (scoped within `{}`).
* **Hoisting:** `var` variables are hoisted and initialized with `undefined`. `let` and `const` variables are hoisted but remain uninitialized in the **Temporal Dead Zone (TDZ)**; accessing them before declaration throws a `ReferenceError`.
* **Reassignment:** `var` and `let` can be reassigned. `const` creates a read-only reference and cannot be reassigned (though properties of objects/arrays declared with `const` can still be mutated).

---

### Question 74: What is Event Delegation in JavaScript?
**Answer:**
Event Delegation is a technique of handling events at a higher level in the DOM tree than the elements where the events actually originate. 
* Instead of adding individual event listeners to 100 list items (`<li>`), we add a single event listener to the parent container (`<ul>`).
* When a list item is clicked, the event bubbles up the DOM tree to the parent.
* The parent listener intercepts the event and inspects `event.target` to determine which child list item was actually clicked, executing the handler dynamically.
* *Pros:* Massive memory savings, and automatically works for dynamically added list items without rebinding listeners.

---

### Question 75: Explain the difference between Debouncing and Throttling.
**Answer:**
Both are optimization techniques used to limit the frequency of function executions:
* **Debouncing:** Delays function execution until a certain amount of idle time has passed since the last event trigger. Useful for search autocomplete inputs (we only query the API after the user has stopped typing for 300ms).
* **Throttling:** Guarantees that the function will execute at most once in a given time interval, ignoring all subsequent event triggers until the interval resets. Useful for window scroll or resize event handlers.

---

### Question 76: Explain the difference between `Promise.all`, `Promise.allSettled`, `Promise.any`, and `Promise.race`.
**Answer:**
* **`Promise.all`:** Resolves when **all** promises resolve successfully. If a single promise rejects, the entire operation immediately rejects (all-or-nothing).
* **`Promise.allSettled`:** Resolves when all promises have **settled** (either resolved or rejected). It returns an array of objects describing the outcome of each promise, never rejecting.
* **`Promise.any`:** Resolves as soon as **any single** promise resolves successfully. If all reject, it returns an AggregateError.
* **`Promise.race`:** Resolves or rejects as soon as **any single** promise settles (first one to complete wins).

---

### Question 77: What are Arrow Functions in JavaScript, and how do they differ from Regular Functions?
**Answer:**
Arrow functions (`() => {}`) differ from regular functions (`function() {}`) in:
1. **`this` Binding:** Arrow functions do not have their own `this` context. They inherit `this` lexically from their parent scope. Regular functions set `this` dynamically based on how they are called.
2. **Arguments Object:** Arrow functions do not bind the `arguments` array object; regular functions do.
3. **Constructor:** Arrow functions cannot be used as constructors (you cannot call them with `new`).

---

### Question 78: Explain the difference between Synchronous and Asynchronous execution.
**Answer:**
* **Synchronous:** Code is executed line-by-line sequentially. Each operation blocks the thread, meaning subsequent lines must wait for the current line to complete before starting.
* **Asynchronous:** Code execution is offloaded to a background thread or engine, allowing the main thread to continue running other code. Once complete, the background task notifies the main thread via callbacks, promises, or events.

---

### Question 79: What is the difference between standard functions and Generator Functions in JavaScript?
**Answer:**
* **Standard Functions:** Execute run-to-completion. Once called, the function runs until it returns or throws.
* **Generator Functions (declared with `function*`):** Can be **paused** and **resumed** during execution. They return a Generator Object. Every time the function encounters the `yield` keyword, it pauses execution and returns the yielded value. Calling `.next()` on the generator object resumes execution from where it paused.

---

### Question 80: What is TypeScript, and how does it benefit JavaScript development?
**Answer:**
TypeScript is a strongly typed superset of JavaScript that compiles down to plain JavaScript.
* **Compile-Time Type Checking:** Detects type errors (e.g. passing a string to a function expecting a number) during development before the code executes.
* **Rich IDE Tooling:** Provides autocomplete, refactoring, and code navigation support.
* **Documentation:** Explicit types act as self-documenting code, making team collaborations much cleaner.

---

## 16. Software Engineering Design Patterns

### Question 81: Explain the Singleton Design Pattern and where you used it in your code.
**Answer:**
The **Singleton Pattern** restricts the instantiation of a class to one single instance and provides a global point of access to it.
* **Why:** For resource-heavy classes (like database client connections, thread pools, or loggers), opening new instances repeatedly wastes system memory and sockets.
* **Application in Your Projects:** In both projects, the **Prisma Client** and the **Redis Connection Client** (`ioredis`) are implemented as Singletons. Instead of running `new PrismaClient()` in every controller (which would open thousands of database connections and crash PostgreSQL), we initialize it once inside a central file (`database.js` or `database.ts`) and export that single instance globally.

---

### Question 82: Explain the Observer Design Pattern and how it relates to event-driven architectures.
**Answer:**
The **Observer Pattern** defines a one-to-many dependency between objects. When one object (the **Subject**) changes state, all its dependents (the **Observers**) are notified and updated automatically.
* **Relation to Event-Driven Code:** This is the foundation of Node.js event emitters and WebSocket channels.
* **Application in CargoGo:** In the location tracking system, drivers act as publishers, and passengers act as observers. When a driver's GPS coordinates change, they publish the coordinate update to a Socket.io room. The Socket.io server (acting as the subject) broadcasts the update, automatically notifying all passenger sockets (the observers) currently subscribed to that room.

---

### Question 83: What is the Factory Design Pattern, and when should you use it?
**Answer:**
The **Factory Pattern** provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects that will be created.
* **When to use:** When your code needs to instantiate different subclasses based on runtime parameters (e.g., dynamic conditions).
* **Example in logistics:** If a user selects a vehicle type, instead of hardcoding `new Truck()` or `new Bike()`, you use a `VehicleFactory.createVehicle(type)` method which returns the correct vehicle class dynamically, separating instantiation logic from business logic.

---

### Question 84: Explain the difference between MVC (Model-View-Controller) and Microservices Architectures.
**Answer:**
* **MVC (Monolithic):** A design pattern that divides an application into three interconnected components: the **Model** (data/database schema), the **View** (user interface), and the **Controller** (business logic). All components run within a single codebase and system process. *Pros:* Simple to deploy and test. *Cons:* Difficult to scale individual features; a crash in one module takes down the entire system.
* **Microservices:** An architectural style that structures an application as a collection of small, autonomous, loosely coupled services (e.g., separating user auth, payment processing, and messaging into individual APIs). Each service has its own database and communicates via lightweight APIs or message queues. *Pros:* High scalability and fault isolation. *Cons:* Complex network design and consistency challenges.

---

### Question 85: What is the difference between REST APIs and GraphQL?
**Answer:**
* **REST APIs:** Resource-based. The client requests data from specific endpoints (e.g. `/api/users/1`).
  * *Pros:* Simple to cache, widely supported.
  * *Cons:* **Over-fetching** (receiving data you don't need) or **Under-fetching** (requiring multiple API calls to get related data).
* **GraphQL:** Query-based. The client requests data from a single endpoint (e.g. `/graphql`) and specifies the exact fields it needs in a single query payload.
  * *Pros:* No over-fetching or under-fetching; strongly typed schemas.
  * *Cons:* Complex caching, heavier CPU overhead on the server.

---

## 17. Web Application Security (OWASP Top 10)

### Question 86: What is Cross-Site Scripting (XSS), and how do you prevent it?
**Answer:**
XSS occurs when an attacker successfully injects malicious client-side scripts (usually JavaScript) into a trusted website, which then executes in the browser of an unsuspecting user. This can steal session cookies or localStorage tokens.
* **Prevention:**
  1. **Sanitize Inputs & Encode Outputs:** Never trust user inputs. Use libraries like DOMPurify or let frameworks (like React) automatically escape HTML entities before rendering.
  2. **HTTP-only Cookies:** Store sensitive session tokens in HTTP-only cookies, which prevents JavaScript from accessing them via `document.cookie`.
  3. **Content Security Policy (CSP):** Use headers to restrict where scripts can be loaded from.

---

### Question 87: What is Cross-Site Request Forgery (CSRF), and how do you mitigate it?
**Answer:**
CSRF occurs when a malicious website trick a logged-in user's browser into sending an unauthorized HTTP request to your backend API. Because browsers automatically attach cookies (including session cookies) to cross-site requests, the backend thinks the request is legitimate.
* **Mitigation:**
  1. **SameSite Cookie Attribute:** Configure cookies with `SameSite=Strict` or `SameSite=Lax`. This prevents the browser from sending cookies along with cross-site requests.
  2. **Anti-CSRF Tokens:** Generate a unique, cryptographically secure token associated with the session. The client must send this token in the header of all state-changing requests (`POST`, `PUT`), which the server validates.

---

### Question 88: What is SQL Injection (SQLi), and how does using an ORM like Prisma prevent it?
**Answer:**
SQL Injection occurs when an attacker inserts malicious SQL statements into input fields, tricking the database into executing unauthorized commands (e.g., inputting `' OR 1=1 --` into a login field to bypass passwords).
* **Prevention:** Using **Parameterized Queries** (prepared statements) where input data is treated strictly as values, never as executable SQL code.
* **How Prisma Prevents It:** Prisma automatically compiles all queries using prepared statements under the hood. For instance, `prisma.user.findUnique({ where: { email } })` parameterizes the `email` variable, neutralizing any SQL statements typed into it.

---

### Question 89: Why is Helmet middleware critical for securing Express applications?
**Answer:**
**Helmet** is a collection of middleware functions that secure Express apps by setting various HTTP response security headers. It helps protect against common vulnerabilities:
* `Content-Security-Policy (CSP)`: Restricts script sources to mitigate XSS.
* `X-Frame-Options`: Prevents **Clickjacking** by blocking your page from being loaded inside an `<iframe>` on other domains.
* `Strict-Transport-Security (HSTS)`: Forces browsers to communicate only over secure HTTPS.
* `X-Content-Type-Options`: Blocks browsers from MIME-sniffing content types (prevents executing text uploads as scripts).

---

### Question 90: Explain the difference between hashing a password using salt and simple MD5 hashing.
**Answer:**
* **Simple Hashing (e.g., MD5/SHA256):** Deterministic. The same password always generates the exact same hash. Attackers use precomputed lists of popular password hashes (called **Rainbow Tables**) to crack passwords in seconds.
* **Salted Hashing (e.g. bcrypt):** A unique, random string (the **Salt**) is appended to the password before hashing. The salt is saved alongside the hash. Because every user has a different salt, identical passwords generate completely different hashes, rendering Rainbow Tables useless. Furthermore, bcrypt is designed to be computationally slow, protecting against brute-force attacks.

---

## 18. Version Control (Git) & CI/CD Pipelines

### Question 91: What is the difference between `git merge` and `git rebase`?
**Answer:**
* **`git merge`:** Combines the changes from one branch into another, creating a new **merge commit** in the history.
  * *Pros:* Preserves complete, chronological history and context of when branches were merged.
  * *Cons:* Commits can become cluttered and messy with multiple merge commits.
* **`git rebase`:** Moves or applies the commits of your branch on top of another branch’s latest commit, rewriting git history to be linear.
  * *Pros:* Creates a clean, linear git commit log.
  * *Cons:* Rewrites history, which is highly dangerous on shared public branches.

---

### Question 92: What is `git cherry-pick`, and when should you use it?
**Answer:**
`git cherry-pick <commit-hash>` is a command that applies the changes introduced by a specific commit from one branch onto your current active branch.
* **When to use:** When you need a specific fix or feature that is present in another branch, but you do not want to merge or rebase the entire branch (e.g., pulling a hotfix commit from a development branch directly into a release branch).

---

### Question 93: Explain the difference between `git reset` (soft, mixed, hard).
**Answer:**
All three commands move your current branch pointer to a specific commit, but they affect your working directory and staging area differently:
* **`--soft`:** Resets the commit pointer but leaves your changes intact in your **Staging Area** (ready to commit).
* **`--mixed` (default):** Resets the commit pointer and un-stages your changes, leaving them in your **Working Directory** (unstaged).
* **`--hard`:** Resets the commit pointer, staging area, and working directory, completely discarding all uncommitted changes and file modifications since that commit.

---

### Question 94: What is a CI/CD Pipeline, and what are its main stages?
**Answer:**
CI/CD stands for Continuous Integration and Continuous Deployment. It is an automated workflow that tests and deploys code when changes are pushed:
1. **Source Stage:** Triggered when code is pushed to a repository (like GitHub).
2. **Build Stage:** Installs dependencies and compiles code (e.g., compiling TypeScript, bundling React assets).
3. **Test Stage:** Runs automated tests (like Jest integration tests) to ensure no regressions.
4. **Deploy Stage:** Pushes the verified build to production platforms (Render, Vercel).

---

## 19. System Scaling & High Availability

### Question 95: Explain the difference between Horizontal and Vertical Scaling.
**Answer:**
* **Vertical Scaling (Scale Up):** Adding more power (CPU, RAM, storage) to a single physical server.
  * *Pros:* Simple, no architectural changes needed.
  * *Cons:* Has a hard hardware limit; introduces a single point of failure.
* **Horizontal Scaling (Scale Out):** Adding more servers to your system pool and distributing load across them using a load balancer.
  * *Pros:* Practically limitless scaling; high availability (if one server dies, others handle load).
  * *Cons:* Requires architectural complexity (session clustering, Redis sync, stateless servers).

---

### Question 96: What is a Load Balancer, and explain two common routing algorithms.
**Answer:**
A Load Balancer sits in front of your servers and routes incoming user requests across available backend instances to prevent any single server from becoming overloaded.
* **Round Robin:** Routes requests sequentially down the list of servers (Server 1, then Server 2, then Server 3). Simple, but assumes all servers have equal capacity and requests take equal time.
* **Least Connections:** Routes requests to the server that is currently handling the fewest active connections. More efficient for long-running operations.

---

### Question 97: Explain the difference between Database Replication and Database Sharding.
**Answer:**
* **Database Replication:** Copying the entire database across multiple servers. Typically set up as Master-Slave:
  * **Master:** Handles all write operations and syncs changes to Slaves.
  * **Slaves:** Handle read operations. *Pros:* Speeds up reads and provides backups.
* **Database Sharding:** Dividing a single large database table horizontally into smaller pieces (shards) across different servers (e.g., users with IDs 1-10000 on Server A, IDs 10001+ on Server B). *Pros:* Speeds up both reads and writes.

---

### Question 98: What is the difference between a Container (e.g. Docker) and a Virtual Machine (VM)?
**Answer:**
* **Virtual Machine (VM):** Runs on top of a hypervisor. Each VM includes a complete guest operating system, virtual drivers, and applications. *Cons:* Heavy, slow boot times, high memory footprint.
* **Container:** Shares the host operating system's kernel. It isolates only the application and its dependencies in user space. *Pros:* Lightweight, boots in seconds, uses minimal RAM.

---

## 20. Behavioral & Career Readiness

### Question 99: Walk me through your preferred workflow for debugging a complex server-client integration issue.
**Answer:**
1. **Isolate the Fault:** Determine if the issue is client-side or backend-side by inspecting browser network calls (F12 DevTools). If the request is not sent or fails validation, check the client code.
2. **Inspect Server Logs:** Look at the Express/Render server output to identify any exceptions or database query errors.
3. **Verify Database State:** Connect directly to the database (using tools like Prisma Studio) to check if the target rows contain correct data.
4. **Replicate Locally:** Create a minimal test case locally (e.g. running a Jest test or a raw fetch script) to isolate the bug from other dependencies.

---

### Question 100: How do you handle changing requirements or tight deadlines in a software project?
**Answer:**
1. **Prioritization (MVP):** Focus on the core functionality that delivers value (the Minimum Viable Product) and push secondary features to subsequent iterations.
2. **Clear Communication:** Immediately raise flags with team members or stakeholders if a deadline is in jeopardy, proposing alternate scopes or solutions.
3. **Structured Execution:** Break down the work into small, atomic tasks, using version control and testing to make sure fast modifications do not break existing features.



