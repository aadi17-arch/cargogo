# FreelanceGuard — 50 Interview Questions & Answers

---

## Section 1: Prisma, Database & Transactions (Q1–12)

### Q1: How do Prisma interactive transactions guarantee atomic escrow updates?
**Answer:**
Releasing milestone funds requires three simultaneous updates: decrementing the client's held balance, incrementing the freelancer's wallet, and creating a payment audit log. If any one of these fails midway, the database is left in a corrupt state — money vanishes.

We use `prisma.$transaction(async (tx) => { ... })`. Under the hood, Prisma sends `BEGIN` to PostgreSQL, executes all queries inside the isolated sandbox, and then either sends `COMMIT` (all succeed) or `ROLLBACK` (any one fails). Every change since `BEGIN` is discarded on rollback. This guarantees all-or-nothing atomicity on every milestone release.

---

### Q2: Why is `Decimal` used instead of `Float` for wallet balances?
**Answer:**
`Float` uses IEEE 754 binary representation which cannot precisely store base-10 decimals. `0.1 + 0.2 = 0.30000000000000004` in JavaScript. Over thousands of escrow transactions, these tiny errors compound into real financial discrepancies.

`Decimal` in Prisma maps to `DECIMAL(10,2)` in PostgreSQL — a fixed-point type stored as an exact string internally. All arithmetic is base-10 precise. Platform fees and milestone splits are always mathematically accurate to the exact paisa.

---

### Q3: What referential actions (onDelete) did you configure in the schema and why?
**Answer:**
- **User → Projects:** `onDelete: Restrict` — prevents deleting a user who has active contracts. Financial audit trails must be preserved.
- **Contract → Milestones:** `onDelete: Cascade` — a milestone has no meaning without its parent contract. If a draft contract is deleted, clean up all its milestones automatically.
- **Milestone → Disputes:** `onDelete: Restrict` — a milestone under active dispute cannot be deleted. The dispute record acts as a lock to preserve evidence.

---

### Q4: How does the transaction prevent deadlocks under concurrent milestone releases?
**Answer:**
A deadlock occurs when Transaction A holds lock on Client 1 waiting for Freelancer 2, while Transaction B holds lock on Freelancer 2 waiting for Client 1. They block each other forever.

We prevent this by enforcing a **consistent update order** inside every transaction: always update the Client wallet first, then the Freelancer wallet, then create the PaymentLog. Since all concurrent transactions acquire locks in the same order, no circular wait can form. Additionally, we configure a database transaction timeout so any stuck transaction aborts and releases its locks automatically.

---

### Q5: What SQL isolation level does PostgreSQL use by default, and how does it affect our escrow?
**Answer:**
PostgreSQL defaults to **Read Committed** isolation. This means a transaction only sees data that has been committed before each individual query — not the state at the start of the transaction. For financial operations, this could cause non-repeatable reads if another transaction commits between two reads inside ours.

For our escrow ledger, we rely on Prisma's interactive transaction to scope all reads and writes to the same connection. For critical balance checks where we need to prevent phantom reads, we use `SELECT ... FOR UPDATE` to acquire row-level locks, ensuring no other transaction can modify the row while ours is running.

---

### Q6: Why use Prisma over raw SQL queries?
**Answer:**
Prisma provides:
1. **Type Safety:** Schema-generated TypeScript types prevent runtime type mismatches at compile time.
2. **SQL Injection Prevention:** All queries are automatically parameterized (prepared statements) — user inputs are never interpolated into raw SQL strings.
3. **Schema as Single Source of Truth:** The `schema.prisma` file defines the database structure, generates migrations, and produces TypeScript types all at once.
4. **Readable Query API:** `prisma.user.findMany({ where: { role: 'FREELANCER' }, include: { contracts: true } })` is far more maintainable than equivalent raw SQL joins.

---

### Q7: How did you handle database connection pooling on Render's free tier?
**Answer:**
Render's free tier has limited memory per container. Running `new PrismaClient()` in every module would open hundreds of idle database connections and quickly exhaust Neon PostgreSQL's connection limit.

We follow the **Singleton pattern**: Prisma Client is instantiated once in a central `database.js` file and exported as a global singleton. All controllers import the same instance. We also append `?connection_limit=10` to the Neon connection string so the pool never opens more than 10 connections per server instance, staying within Neon's free-tier limits.

---

### Q8: How do database indexes improve query performance in FreelanceGuard?
**Answer:**
Without indexes, PostgreSQL performs a **full table scan** — reading every row to find matches. As milestones, contracts, and payment logs grow to hundreds of thousands of rows, this becomes unacceptably slow.

We add **B-Tree indexes** using `@@index([userId])` and `@@index([contractId])` in the Prisma schema on foreign key columns that appear frequently in `WHERE` clauses. PostgreSQL can now perform a binary search on the sorted index tree — $O(\log N)$ instead of $O(N)$. This reduced our p95 response time under 100 concurrent k6 users from 340ms to 61ms.

---

### Q9: What is the difference between `findUnique`, `findFirst`, and `findMany` in Prisma?
**Answer:**
- **`findUnique`:** Queries by a field marked `@unique` or the primary key. Throws a typed error if no record found. Most performant — database uses the unique index directly.
- **`findFirst`:** Returns the first record matching a `where` clause (not necessarily unique). Useful for arbitrary conditions without a unique constraint.
- **`findMany`:** Returns all matching records. Supports `skip`, `take`, `orderBy`, and `include` for pagination and relations.

---

### Q10: How do you prevent the N+1 query problem in Prisma?
**Answer:**
The N+1 problem occurs when fetching 1 list of contracts then making N individual queries for each contract's milestones. This sends N+1 total queries to the database — catastrophic at scale.

Prisma solves this with the `include` option:
```javascript
prisma.contract.findMany({
  include: { milestones: true, client: true }
})
```
Prisma batches this into a single SQL JOIN query, fetching contracts and their related milestones/client in one round trip to the database.

---

### Q11: What is schema migration and why is it critical in production?
**Answer:**
A schema migration is a version-controlled script that describes exactly how to alter the database structure (add/remove columns, create/drop tables, add indexes).

Without migrations, a developer changing the schema manually on production (e.g., adding a `heldAmount` column to the User table) creates a mismatch if other team members don't replicate the change. With `prisma migrate dev`, Prisma generates a timestamped SQL migration file checked into git. Running `prisma migrate deploy` on production applies exactly those same changes, keeping all environments in perfect sync.

---

### Q12: How does Prisma handle database seeding in development?
**Answer:**
Prisma supports a `prisma/seed.ts` script run via `prisma db seed`. This populates the database with realistic test data — sample users (client, freelancer, admin roles), sample contracts, milestones, and wallet balances — so developers can work with a fully functional application without manually inserting rows. The seed script uses the same Prisma Client, so it respects all schema constraints and triggers validation errors just like application code would.

---

## Section 2: Authentication & Security (Q13–25)

### Q13: How does your JWT authentication flow work end to end?
**Answer:**
1. User submits credentials to `POST /api/auth/login`.
2. Server verifies the password against the bcrypt hash stored in PostgreSQL.
3. On success, the server generates two tokens: a short-lived **Access Token** (JWT signed with `JWT_SECRET`, expires in 15 minutes) and a **Refresh Token** (stored as a hash in the database, expires in 7 days).
4. Access Token is returned in the response body. Refresh Token is set as an **HTTP-only cookie**.
5. Client attaches the Access Token in the `Authorization: Bearer <token>` header for every subsequent API request.
6. When the Access Token expires, the client calls `POST /api/auth/refresh`. The server reads the HTTP-only cookie, validates the Refresh Token against the database, rotates it, and issues a new Access Token.

---

### Q14: Why is the Refresh Token stored in an HTTP-only cookie while the Access Token is in the response body?
**Answer:**
- **Access Token in body/localStorage:** Needs to be readable by JavaScript so the client can attach it to API request headers. Short-lived (15 minutes) to minimize damage if compromised.
- **Refresh Token in HTTP-only cookie:** HTTP-only cookies are completely inaccessible to JavaScript (`document.cookie` cannot read them). This protects the long-lived Refresh Token from **XSS attacks** — even if malicious script is injected into the page, it cannot steal the cookie. Browsers automatically send the cookie with requests to the same domain, so no JavaScript access is needed.

---

### Q15: How does Refresh Token rotation detect token theft?
**Answer:**
Every time a client uses a Refresh Token, the server immediately invalidates it and issues a brand-new one. The new token is saved to the database; the old one is marked as used.

If a hacker steals a Refresh Token and tries to use it after the legitimate user has already rotated it:
1. The server looks up the stolen token — it's marked as used/invalid.
2. This signals a token reuse attack — someone is replaying an old token.
3. The server immediately invalidates **all** active Refresh Tokens for that user, forcibly logging out both the legitimate user and the attacker. The user must log in again.

---

### Q16: What is RBAC, and how did you implement it in FreelanceGuard?
**Answer:**
**Role-Based Access Control** restricts system access based on user roles. FreelanceGuard has three roles: `CLIENT`, `FREELANCER`, and `ADMIN`.

Implementation:
1. The role is stored in the `User` table and embedded in the JWT payload on login.
2. A `roleMiddleware` factory function accepts an array of permitted roles:
   ```javascript
   const roleMiddleware = (roles) => (req, res, next) => {
     if (!roles.includes(req.user.role)) {
       return res.status(403).json({ message: "Access denied." });
     }
     next();
   };
   ```
3. Routes are protected by composing the auth middleware and role middleware:
   ```javascript
   router.post('/release', authMiddleware, roleMiddleware(['CLIENT']), releaseController);
   ```

---

### Q17: How do you prevent horizontal privilege escalation in FreelanceGuard?
**Answer:**
Horizontal privilege escalation means a legitimate user accessing another user's data (e.g., Freelancer A viewing Freelancer B's earnings).

After passing authentication and RBAC checks, controllers perform a **resource ownership check**:
```javascript
const milestone = await prisma.milestone.findUnique({ where: { id }, include: { contract: true } });
if (milestone.contract.clientId !== req.user.id && milestone.contract.freelancerId !== req.user.id) {
  return res.status(403).json({ message: "You do not have access to this resource." });
}
```
The user's ID from the JWT (which they cannot modify) is compared against the resource's owner IDs from the database. Any mismatch is rejected.

---

### Q18: How do you store and verify passwords securely?
**Answer:**
Passwords are never stored in plain text. On registration:
1. We validate the password meets strength requirements via Zod (minimum length, complexity).
2. We hash it using **bcrypt** with a salt rounds value of 12: `bcrypt.hash(password, 12)`.
3. The hash is stored in the `User` table's `passwordHash` column.

On login:
1. The submitted password is compared against the stored hash using `bcrypt.compare(password, user.passwordHash)`.
2. bcrypt internally extracts the salt from the stored hash and rehashes the input for comparison — the original password is never recoverable.

---

### Q19: Why bcrypt over MD5 or SHA256 for password hashing?
**Answer:**
MD5 and SHA256 are cryptographic hash functions optimized for **speed** — designed to hash millions of inputs per second. This makes them disastrous for passwords: attackers can run billions of brute-force or dictionary attack attempts per second.

bcrypt is intentionally **slow** by design. The `saltRounds` parameter (we use 12) controls the computational cost — each hash takes ~250ms. This makes brute-force attacks prohibitively expensive. bcrypt also automatically generates and embeds a unique random salt, making precomputed Rainbow Table attacks useless.

---

### Q20: What is Zod and why did you use it over Express-Validator or manual validation?
**Answer:**
Zod is a TypeScript-first schema validation library. We use it because:

1. **Type Inference:** Zod schemas automatically generate TypeScript types — the validated output is fully typed without writing separate interface definitions.
2. **Structured Errors:** On validation failure, Zod returns a detailed, field-level error map (which field failed, which rule, and why), enabling clean `400` responses.
3. **Composability:** Schemas can be extended, merged, and reused across different endpoints.
4. **Middleware Integration:** We wrap Zod schemas in a `validateRequest` middleware that parses `req.body`, `req.query`, and `req.params` — all in one place.

---

### Q21: How does your Zod validation middleware work?
**Answer:**
```javascript
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  req.body = result.data.body;
  Object.assign(req.query, result.data.query);
  Object.assign(req.params, result.data.params);
  next();
};
```
We use `Object.assign` for `req.query` and `req.params` because Express configures those with internal descriptors that prevent direct reassignment. Mutating in-place via `Object.assign` works correctly.

---

### Q22: How does the rate limiter protect authentication endpoints?
**Answer:**
The `express-rate-limit` middleware tracks request counts per IP address using a sliding window. For authentication endpoints:
```javascript
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts
  message: 'Too many login attempts. Please try again later.',
});
router.post('/login', strictLimiter, loginController);
```
This limits brute-force credential stuffing attacks. Even if an attacker tries thousands of passwords, they are blocked after 10 attempts per 15-minute window per IP address.

---

### Q23: Why is Helmet middleware used in FreelanceGuard?
**Answer:**
Helmet sets security-critical HTTP response headers automatically:
- `Content-Security-Policy`: Restricts script sources, preventing XSS injection.
- `X-Frame-Options: DENY`: Prevents clickjacking by blocking the page from loading in iframes on foreign domains.
- `Strict-Transport-Security`: Forces all future requests over HTTPS.
- `X-Content-Type-Options: nosniff`: Prevents browsers from interpreting files as a different MIME type (prevents uploaded text files being executed as scripts).

---

### Q24: How is CORS configured in FreelanceGuard?
**Answer:**
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
```
`origin` is set to the exact Vercel frontend domain from environment variables. This tells browsers that only requests originating from that domain are permitted to read the API response. `credentials: true` is required because we use HTTP-only cookies for Refresh Tokens — without this flag, the browser will refuse to send cookies cross-origin.

---

### Q25: How does the Admin role escalation work in FreelanceGuard?
**Answer:**
Admin users are created directly via database seed scripts or by another admin — there is no self-registration path for the admin role. The `ADMIN` role bypasses most resource-ownership checks (admins can view all contracts, intervene in all disputes, and release funds on behalf of parties).

The admin dashboard is protected by composing both `authMiddleware` and `roleMiddleware(['ADMIN'])`. Attempting to access it with a `CLIENT` or `FREELANCER` token returns a `403 Forbidden` immediately at the middleware layer before any controller logic executes.

---

## Section 3: Cloudinary Uploads & Dispute Module (Q26–34)

### Q26: Why did you migrate from local Multer disk storage to Cloudinary?
**Answer:**
Local Multer disk storage worked in development but failed completely in production. Render (and most cloud platforms) runs applications in **ephemeral containers** — every deployment or container restart wipes the entire local filesystem. All uploaded dispute evidence files (PDFs, images, DOCX) were permanently lost on every deploy.

Cloudinary solves this by streaming files directly from the client through Express to Cloudinary's CDN. The local filesystem is bypassed entirely. Cloudinary returns a permanent HTTPS URL, which we store in PostgreSQL. Files persist forever regardless of server restarts or redeployments.

---

### Q27: How is the Multer-Cloudinary integration configured?
**Answer:**
```javascript
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'freelanceguard/disputes',
    allowed_formats: ['jpg', 'png', 'pdf', 'docx'],
    resource_type: 'auto',
  },
});
const upload = multer({ storage: cloudinaryStorage });
```
Multer processes the `multipart/form-data` request and passes each file buffer to the Cloudinary storage engine. The engine uploads the buffer directly to the Cloudinary API. When the upload completes, Multer calls `next()` with `req.file.path` containing the Cloudinary URL, which we save to the database.

---

### Q28: How does the dispute state machine work?
**Answer:**
A dispute transitions through a strict sequence of states:
1. **`RAISED`**: Either party raises a dispute against a specific milestone. The milestone's payment is frozen.
2. **`EVIDENCE_SUBMITTED`**: Both parties upload evidence files. The dispute is in review.
3. **`UNDER_REVIEW`**: Admin picks up the dispute and begins evaluation.
4. **`RESOLVED_CLIENT`**: Admin rules in the client's favor — funds are returned from escrow to the client.
5. **`RESOLVED_FREELANCER`**: Admin rules in the freelancer's favor — funds are released to the freelancer.
6. **`CLOSED`**: Final state after resolution. No further actions permitted.

State transitions are validated server-side. A controller attempting to move from `RAISED` directly to `RESOLVED_CLIENT` without going through `EVIDENCE_SUBMITTED` and `UNDER_REVIEW` is rejected.

---

### Q29: How do you validate uploaded file types server-side?
**Answer:**
Client-side MIME type checking is trivially bypassed. We enforce file type validation server-side at two layers:

1. **Multer `fileFilter`:** Before accepting the upload, we check the MIME type against an allowlist:
   ```javascript
   fileFilter: (req, file, cb) => {
     const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
     cb(null, allowed.includes(file.mimetype));
   }
   ```
2. **Cloudinary `allowed_formats`:** Cloudinary also validates the actual file content (not just the declared MIME type) and rejects formats not in the allowlist — preventing disguised file uploads.

---

### Q30: What happens to escrow funds when a dispute is raised?
**Answer:**
When a dispute is raised against a milestone:
1. The milestone's status is set to `DISPUTED` in the database.
2. The associated funds in the escrow ledger are marked as `FROZEN` — they cannot be released by the client, withdrawn by the freelancer, or affected by any other operation.
3. The frozen state persists until an Admin resolves the dispute.
4. On resolution: if `RESOLVED_FREELANCER`, a Prisma interactive transaction atomically releases the frozen amount to the freelancer's wallet and updates the milestone to `COMPLETED`. If `RESOLVED_CLIENT`, the funds are returned to the client's held balance.

---

### Q31: How does the chat module work in FreelanceGuard?
**Answer:**
FreelanceGuard uses **REST-based short polling** for the chat interface rather than WebSockets. This was a deliberate architectural choice for simplicity — full duplex real-time communication (WebSockets) adds significant infrastructure complexity that isn't justified for a chat feature used primarily during business-hours contract communication.

The client sends `GET /api/chat/:contractId/messages` every 3 seconds with a timestamp of the last message received. The server queries PostgreSQL for messages newer than that timestamp and returns them. The client appends new messages to the UI. This achieves near-real-time updates with minimal infrastructure overhead.

---

### Q32: What are the trade-offs of REST short polling vs WebSockets for chat?
**Answer:**
- **Short Polling Pros:** Simple to implement, stateless, no persistent connection management, works behind standard HTTP proxies and CDNs.
- **Short Polling Cons:** Network overhead from repeated HTTP requests even when no new messages exist. Latency proportional to the polling interval (up to 3 seconds).
- **WebSocket Pros:** True real-time delivery (sub-100ms), no wasted requests when idle.
- **WebSocket Cons:** Requires connection state management, reconnection logic, Redis pub/sub adapter for horizontal scaling, and more complex server infrastructure.

For a contract management platform (not a live chat app), the 3-second polling delay is acceptable and the infrastructure simplicity is worth it.

---

### Q33: How do you paginate message history in the chat module?
**Answer:**
We implement **cursor-based pagination** rather than offset-based pagination for message history:
```javascript
prisma.message.findMany({
  where: {
    contractId,
    createdAt: { lt: cursor }, // fetch messages older than the cursor
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```
The client sends the `createdAt` timestamp of the oldest visible message as the cursor when scrolling up. This is more efficient than `OFFSET` pagination because it doesn't require the database to count and skip rows — it simply seeks to the cursor position using the `createdAt` index.

---

### Q34: How do you secure the file upload endpoint against abuse?
**Answer:**
Multiple protection layers:
1. **Authentication:** Only authenticated users with valid JWTs can hit the upload endpoint.
2. **Ownership Check:** Only participants in the specific dispute (client or freelancer of that contract) can upload evidence for it.
3. **File Size Limit:** Multer enforces a `limits: { fileSize: 5 * 1024 * 1024 }` (5MB) limit per file.
4. **File Type Allowlist:** Both Multer fileFilter and Cloudinary allowed_formats restrict uploads to images, PDFs, and DOCX only.
5. **Rate Limiting:** The endpoint is covered by the global rate limiter preventing upload spam.

---

## Section 4: Project Architecture & Deployment (Q35–50)

### Q35: Walk me through the folder structure and architecture of FreelanceGuard's backend.
**Answer:**
```
server/
  src/
    modules/
      auth/         → auth.controller, auth.service, auth.routes
      projects/     → project.controller, project.service, project.routes
      contracts/    → ...
      milestones/   → ...
      disputes/     → ...
      chat/         → ...
    middleware/
      auth.middleware.js
      role.middleware.js
      validation.middleware.js
      upload.js
    prisma/
      schema.prisma
      client.js     → Singleton Prisma Client
    app.js          → Express app setup
    server.js       → HTTP server startup
```
This **modular architecture** follows separation of concerns. Each domain (auth, projects, contracts) owns its own routes, controllers (HTTP handling), and services (business logic). No business logic leaks into controllers — controllers only parse requests and call services.

---

### Q36: What is the difference between a controller and a service in your architecture?
**Answer:**
- **Controller:** Handles HTTP concerns. It parses `req.body`, `req.params`, and `req.query`, calls the appropriate service function, and formats the HTTP response. Controllers contain zero business logic.
- **Service:** Contains all business logic. Services call Prisma, perform calculations (like fee splits), send emails, or call third-party APIs. Services are completely unaware of HTTP — they accept plain arguments and return plain data or throw errors.

This separation means services can be unit tested without a running HTTP server, and controllers can be replaced (e.g., switching from REST to GraphQL) without touching business logic.

---

### Q37: How do you handle errors globally in FreelanceGuard?
**Answer:**
Express's error handling middleware (a function with 4 parameters: `err, req, res, next`) sits at the bottom of the middleware stack:
```javascript
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ errors: err.flatten() });
  }
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'A record with this value already exists.' });
    }
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});
```
Controllers pass errors to `next(err)`. The global handler catches them all, maps known error types to appropriate HTTP codes, and prevents raw stack traces from leaking to the client.

---

### Q38: How is the React frontend structured in FreelanceGuard?
**Answer:**
```
client/
  src/
    context/
      AuthContext.jsx  → Global auth state, token management, axios interceptors
    pages/
      auth/            → Login, Register
      dashboard/       → Role-specific dashboards
      projects/        → Browse and post projects
      contracts/       → Contract details, milestone tracking
      kyc/             → KYC document upload
      admin/           → Admin dashboard, dispute management
    components/
      disputes/        → RaiseDisputeModal, EvidenceUploader
      shared/          → Buttons, Modals, LoadingSpinner
    services/
      api.js           → Axios instance with base URL and interceptors
```

---

### Q39: How does the AuthContext manage token refresh automatically?
**Answer:**
The `AuthContext` sets up **Axios interceptors** on initialization:

- **Request Interceptor:** Attaches the Access Token from state to every outgoing request's `Authorization` header.
- **Response Interceptor:** If any response returns `401 Unauthorized`, it automatically calls `POST /api/auth/refresh` to get a new Access Token, then retries the original failed request with the new token.

This means every component that calls the API gets seamless, automatic token refresh without any component needing to handle token expiry explicitly.

---

### Q40: Why do you append `/api` dynamically to the base URL in AuthContext?
**Answer:**
The `VITE_API_URL` environment variable on Vercel stores the base backend domain (e.g., `https://freelanceguard-api.onrender.com`). All API routes are prefixed with `/api` on the Express server.

By appending `/api` in a single place inside `AuthContext`:
```javascript
const API_URL = `${import.meta.env.VITE_API_URL}/api`;
```
We avoid hardcoding `/api` in every individual component's fetch call. If the API prefix ever changes, we update one line rather than hunting across the codebase.

---

### Q41: How does the KYC module work in FreelanceGuard?
**Answer:**
Freelancers must complete KYC (Know Your Customer) before withdrawing funds. The flow:

1. Freelancer uploads a government ID document (image or PDF) via the KYC page.
2. The file is uploaded to Cloudinary via Multer. The Cloudinary URL is stored in a `KYC` table in PostgreSQL with status `PENDING`.
3. An Admin reviews the document in the admin dashboard and either `APPROVES` or `REJECTS` it.
4. On approval, the user's `isKycVerified` flag is set to `true` in the `User` table.
5. Withdrawal endpoints check `req.user.isKycVerified` before proceeding — unverified freelancers cannot withdraw.

---

### Q42: How do you implement role-specific dashboards in the frontend?
**Answer:**
After login, the user's role is stored in `AuthContext` state (decoded from the JWT payload). The routing logic uses conditional rendering:

```jsx
const Dashboard = () => {
  const { user } = useAuth();
  if (user.role === 'CLIENT') return <ClientDashboard />;
  if (user.role === 'FREELANCER') return <FreelancerDashboard />;
  if (user.role === 'ADMIN') return <AdminDashboard />;
};
```
Route guards also prevent direct URL access — if a `FREELANCER` navigates to `/admin`, the guard checks `user.role` and redirects them to their own dashboard.

---

### Q43: How does the vercel.json file fix the 404 errors on page refresh?
**Answer:**
FreelanceGuard uses React Router for client-side navigation. When a user navigates to `/dashboard` in the browser and presses refresh, the browser asks Vercel's CDN for a static file at `/dashboard`. Since no such file exists (Vite outputs only `index.html`), Vercel returns `404`.

The `vercel.json` rewrite rule:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
tells Vercel to serve `index.html` for any path. React Router then reads the URL and renders the correct component client-side. This is the standard SPA deployment configuration.

---

### Q44: How do you handle environment variables between development and production?
**Answer:**
- **Development:** Variables are stored in a `.env` file (gitignored). Vite exposes `VITE_` prefixed variables to the frontend bundle. Node reads backend variables via `dotenv`.
- **Production:** Variables are injected via the hosting platform dashboards (Render environment variables for the backend, Vercel environment variables for the frontend). They are never in source code or git history.
- **Team Communication:** A `.env.example` file in the repo lists all required keys with empty values — a template for new developers to fill in their own credentials.

---

### Q45: What is the deployment architecture of FreelanceGuard?
**Answer:**
- **Frontend:** React + Vite, deployed to **Vercel**. Vercel CI/CD auto-deploys on every push to `main` branch. Root directory is set to `client/`. Output directory is `dist/`.
- **Backend:** Node.js + Express, deployed to **Render** as a Web Service. Render auto-deploys on push. Start command: `node src/server.js`.
- **Database:** **Neon** serverless PostgreSQL — a cloud-native PostgreSQL with auto-scaling connections and branching for development.
- **File Storage:** **Cloudinary** CDN for all uploaded dispute evidence and KYC documents.

---

### Q46: How does your project handle API versioning?
**Answer:**
Currently all routes are prefixed with `/api` (e.g., `/api/auth/login`, `/api/projects`). While we haven't implemented formal versioning (like `/api/v1/`), the architecture supports it cleanly. If we needed to introduce breaking changes to the API, we would:
1. Create a `/api/v2` router in Express.
2. Register new route versions alongside old ones.
3. Gradually migrate clients and deprecate v1 endpoints with a sunset header.

---

### Q47: What is the purpose of the request logger middleware?
**Answer:**
Every incoming HTTP request is logged by a custom `requestLogger` middleware:
```javascript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});
```
In production (Render), these logs appear in the container log stream. During incidents, this allows us to trace the exact sequence of requests, identify which endpoint was hit before an error, and detect abnormal traffic patterns (like repeated failed logins from the same IP).

---

### Q48: How do you handle BigInt serialization issues in the JSON response?
**Answer:**
PostgreSQL IDs returned by Prisma can sometimes be of type `BigInt` in JavaScript. `JSON.stringify` throws a `TypeError: Do not know how to serialize a BigInt` error when trying to include them in HTTP responses.

We handle this by configuring a custom JSON serializer or by converting BigInt IDs to strings before returning them. Alternatively, we use `Int` IDs in the Prisma schema with `@default(autoincrement())` which returns regular JavaScript `number` types safely serializable to JSON.

---

### Q49: What would you improve in FreelanceGuard if you had more time?
**Answer:**
1. **WebSocket Chat:** Replace REST short-polling with Socket.io for real-time message delivery.
2. **Email Notifications:** Add transactional emails (via Resend or Nodemailer) for milestone releases, dispute updates, and payment confirmations.
3. **Automated KYC Verification:** Integrate a third-party API (like Digio or KYC.com) for automated document verification rather than manual admin review.
4. **Payment Gateway:** Integrate Razorpay for actual INR payment processing instead of the in-app wallet simulation.
5. **Comprehensive Test Suite:** Add Jest integration tests covering all escrow transaction paths and auth flows.

---

### Q50: How did you verify that the escrow transaction logic is race-condition-safe?
**Answer:**
We used two verification methods:

1. **k6 Load Testing:** We wrote a k6 script that simulates 100 concurrent virtual users all triggering milestone releases at the same time against the same contract. We then verified in the database that the final wallet balance equals exactly the initial escrow amount — no more, no less. If race conditions existed, the total would be different due to lost updates or double-crediting.

2. **PostgreSQL Transaction Isolation:** By running all balance updates within `prisma.$transaction`, PostgreSQL's `READ COMMITTED` isolation combined with Prisma's single-connection transaction scope ensures each transaction sees a consistent snapshot and applies changes atomically, preventing dirty reads and lost updates under concurrent load.
