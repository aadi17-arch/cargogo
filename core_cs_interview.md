# Core Computer Science — 50 Interview Questions & Answers

Covers DBMS, Operating Systems, Computer Networks, DSA, and JavaScript fundamentals.

---

## Section 1: Database Management Systems — DBMS (Q1–12)

### Q1: Explain ACID properties with a real-world example.
**Answer:**
ACID ensures database transactions are processed reliably:

- **Atomicity:** All operations in a transaction succeed, or none do. *Example:* Transferring ₹1000 between bank accounts — either both the debit and credit succeed, or neither happens. There is no "money deducted but not credited" state.
- **Consistency:** A transaction moves the database from one valid state to another, respecting all constraints. *Example:* An account balance can never go negative (CHECK constraint). A transfer that would cause this is rejected.
- **Isolation:** Concurrent transactions execute as if they were sequential. *Example:* Two people booking the last seat on a flight simultaneously — only one succeeds; the other sees no seat available.
- **Durability:** Once committed, changes survive crashes. *Example:* After a payment confirmation, a power cut cannot undo the transaction — it's written to disk.

---

### Q2: What is database normalization? Explain 1NF, 2NF, and 3NF.
**Answer:**
Normalization structures tables to eliminate data redundancy and prevent anomalies.

- **1NF (First Normal Form):** Every column must contain **atomic** (indivisible) values. No repeating groups. *Violation:* A `phone_numbers` column storing `"9876543210, 8765432109"`. *Fix:* Separate rows per phone number.

- **2NF (Second Normal Form):** Must be in 1NF + all non-key columns must be fully dependent on the **entire** primary key (no partial dependencies). *Violation:* In a composite key table `(student_id, course_id)`, if `student_name` depends only on `student_id`, that's partial dependence. *Fix:* Move `student_name` to a separate `Students` table.

- **3NF (Third Normal Form):** Must be in 2NF + no transitive dependencies (non-key column depending on another non-key column). *Violation:* `Order` table has `zip_code` and `city` — `city` depends on `zip_code`, not the primary key. *Fix:* Move `(zip_code, city)` to a `ZipCodes` table.

---

### Q3: Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN.
**Answer:**
Given tables A (Customers) and B (Orders):

- **INNER JOIN:** Returns only rows where a match exists in **both** tables. Customers with no orders are excluded. Orders with no valid customer are excluded.
- **LEFT JOIN:** Returns **all rows from A** (Customers) and matching rows from B. Customers with no orders appear with NULL order columns.
- **RIGHT JOIN:** Returns **all rows from B** (Orders) and matching rows from A. Orders with no valid customer appear with NULL customer columns.
- **FULL JOIN:** Returns **all rows from both** tables. NULLs fill missing matches on either side.

---

### Q4: What is the difference between a clustered and non-clustered index?
**Answer:**
- **Clustered Index:** Determines the **physical sort order** of data on disk. A table can have only **one** clustered index (typically the Primary Key). Looking up by primary key directly finds the row — no extra step.
- **Non-Clustered Index:** A separate data structure pointing back to the actual rows. A table can have **many** non-clustered indexes. A lookup finds the pointer first, then follows it to the actual row (called a **key lookup** or **bookmark lookup**).

*Performance Note:* Clustered index lookups are faster (data is the index). Non-clustered reads require an extra I/O hop.

---

### Q5: What is the CAP Theorem?
**Answer:**
A distributed system can guarantee at most **two** of:
- **Consistency (C):** Every read receives the most recent write or an error.
- **Availability (A):** Every request receives a response (not necessarily the latest data).
- **Partition Tolerance (P):** The system continues operating despite network partitions (some nodes can't communicate).

Since network partitions always occur in real distributed systems, **P is non-negotiable**. The real choice is:
- **CP (Consistency + Partition Tolerance):** Reject requests if data can't be consistent. *Example:* Financial databases, ZooKeeper.
- **AP (Availability + Partition Tolerance):** Return potentially stale data. *Example:* Social media feeds, Cassandra.

---

### Q6: What are database transactions isolation levels?
**Answer:**
Isolation levels control how much concurrent transactions can "see" each other's uncommitted changes:

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|---|---|---|
| **Read Uncommitted** | ✅ possible | ✅ possible | ✅ possible |
| **Read Committed** | ❌ prevented | ✅ possible | ✅ possible |
| **Repeatable Read** | ❌ | ❌ prevented | ✅ possible |
| **Serializable** | ❌ | ❌ | ❌ prevented |

- **Dirty Read:** Reading uncommitted data from another transaction.
- **Non-Repeatable Read:** Same row returns different values when read twice in one transaction.
- **Phantom Read:** Re-running a query returns new rows inserted by another transaction.

PostgreSQL default: **Read Committed**.

---

### Q7: What is a database deadlock, and how do databases resolve it?
**Answer:**
A deadlock occurs when two or more transactions permanently wait for each other:
- Transaction A holds lock on Row 1, wants Row 2.
- Transaction B holds lock on Row 2, wants Row 1.
Both block indefinitely.

**Resolution Strategies:**
1. **Deadlock Detection:** PostgreSQL runs a periodic deadlock detection algorithm. When detected, it kills the transaction with the least amount of work done (the victim), returns an error, and allows the other to proceed.
2. **Lock Timeouts:** Set `lock_timeout = 5000` (5 seconds). If a lock can't be acquired in 5s, the transaction aborts automatically.
3. **Application-Level Prevention:** Always acquire locks in the same order across transactions (e.g., always lock the smaller ID first).

---

### Q8: What is the difference between a SQL View and a Materialized View?
**Answer:**
- **View:** A virtual table. It stores a saved SQL query, not data. Every time you query a view, the underlying query runs fresh. No disk space used, but can be slow for complex aggregations.
- **Materialized View:** Stores the **query results on disk**. Querying it reads the pre-computed result instantly. *Trade-off:* Data can become stale. Must be manually or periodically refreshed (`REFRESH MATERIALIZED VIEW view_name`).

*Use Case:* If you need `SELECT COUNT(*) FROM orders GROUP BY region` queried thousands of times per second, a Materialized View makes it instant.

---

### Q9: Explain indexing strategies — when should you NOT add an index?
**Answer:**
Don't add an index when:
1. **The table is small:** Full scans on a 100-row table are faster than an index lookup (index overhead isn't worth it).
2. **The column has low cardinality:** A `gender` column with only 2 values provides no filtering benefit — the database would still scan half the table.
3. **Heavy write workload:** Every `INSERT`, `UPDATE`, or `DELETE` must also update all associated indexes. Over-indexing slows down writes.
4. **The column is rarely queried:** An index on a column used in only 0.1% of queries wastes disk space and write performance.

---

### Q10: What is SQL injection and how is it prevented?
**Answer:**
SQL Injection occurs when user input is directly interpolated into SQL queries without sanitization:
```javascript
// VULNERABLE:
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
// If userInput = "' OR 1=1 --", query becomes:
// SELECT * FROM users WHERE email = '' OR 1=1 --'
// This returns ALL users!
```

**Prevention:**
1. **Parameterized Queries / Prepared Statements:**
   ```javascript
   db.query('SELECT * FROM users WHERE email = $1', [userInput]);
   ```
   The database treats `$1` strictly as data, never as executable SQL.
2. **ORM (Prisma, Sequelize):** ORMs parameterize all queries automatically.
3. **Input Validation:** Reject inputs that don't match expected formats (Zod schema validation).

---

### Q11: What is database sharding vs replication?
**Answer:**
- **Replication:** Copies the **entire** database to multiple servers (Master → Slaves). Master handles writes and syncs to slaves. Slaves handle reads. *Benefit:* Read scaling and high availability. *Limitation:* Every node stores the full dataset — doesn't help if data exceeds storage capacity.

- **Sharding:** Divides the database **horizontally** — different rows go to different servers (shards). Users 1–1M on Shard A, 1M–2M on Shard B. *Benefit:* Both read and write scaling, unlimited storage. *Challenge:* Cross-shard joins are expensive. Requires consistent shard routing logic.

---

### Q12: What is an ORM and what are its trade-offs?
**Answer:**
An **Object-Relational Mapper** lets you interact with databases using your programming language's objects instead of raw SQL.

- **Pros:** Type safety, SQL injection prevention, schema migrations, readable query syntax, database-agnostic code.
- **Cons:** Generated SQL may not be optimal — complex queries (like multi-level CTEs or window functions) are better written in raw SQL. Adds abstraction overhead. Can hide performance problems (like N+1 queries) from developers unfamiliar with the generated SQL.

---

## Section 2: Operating Systems (Q13–24)

### Q13: What is the difference between a process and a thread?
**Answer:**
- **Process:** An independent executing program with its own isolated memory address space (stack, heap, code, data). Processes don't share memory — they communicate via IPC (pipes, sockets, shared memory). Creating a process is expensive (fork a full memory copy).
- **Thread:** A lightweight unit of execution within a process. All threads in a process **share** the same heap and global data but have individual stacks and program counters. Creating a thread is cheap. Shared memory enables fast communication but requires synchronization (mutexes/semaphores) to prevent race conditions.

*Node.js context:* Node runs on a single main thread but uses the `libuv` thread pool for I/O operations.

---

### Q14: What are the four necessary conditions for a deadlock?
**Answer:**
Coffman's four conditions — **all four must hold simultaneously** for a deadlock to occur:
1. **Mutual Exclusion:** At least one resource is non-shareable — only one process can use it at a time.
2. **Hold and Wait:** A process holds at least one resource while waiting to acquire more resources held by other processes.
3. **No Preemption:** Resources cannot be forcibly taken from a process — they must be voluntarily released.
4. **Circular Wait:** P1 waits for a resource held by P2, P2 waits for P3, ..., Pn waits for P1 — forming a cycle.

**Prevention:** Violate any one condition. Most common: enforce consistent resource acquisition order (prevents circular wait).

---

### Q15: Explain CPU scheduling algorithms.
**Answer:**
- **FCFS (First Come First Served):** Processes run in arrival order. Simple but suffers from the **Convoy Effect** — short processes behind a long one wait excessively.
- **SJF (Shortest Job First):** The process with the shortest burst time runs next. Optimal average waiting time, but requires knowing burst times in advance.
- **Round Robin:** Each process gets a fixed **time quantum** (e.g., 10ms). After quantum, the process preempts and goes to the back of the ready queue. Fair for interactive systems.
- **Priority Scheduling:** Each process has a priority; highest priority runs first. Suffers from **starvation** (low priority processes never run). Solved with **aging** (gradually increasing priority of waiting processes).

---

### Q16: What is virtual memory and how does paging work?
**Answer:**
**Virtual Memory:** Allows processes to use more memory than physically available by using disk as an extension of RAM. Each process believes it has access to a large, contiguous address space.

**Paging:** Physical memory is divided into fixed-size **frames**. A process's virtual address space is divided into equal-sized **pages**. A **Page Table** (maintained by the OS per process) maps virtual page numbers to physical frame numbers.

**Page Fault:** When a process accesses a page not currently in RAM, the MMU raises a page fault interrupt. The OS loads the page from the swap space on disk into a free frame and updates the Page Table.

---

### Q17: What is thrashing?
**Answer:**
Thrashing occurs when the system spends more time swapping pages in and out of disk than actually executing processes. This happens when there are too many active processes and the total working set of all processes exceeds available physical RAM.

*Symptoms:* CPU utilization drops dramatically (processes are always waiting for page-ins). Disk I/O spikes to 100%.

*Solutions:* Reduce the degree of multiprogramming (fewer concurrent processes), add RAM, or use the **Working Set Model** to allocate enough frames per process to hold its active pages.

---

### Q18: Explain the difference between a mutex and a semaphore.
**Answer:**
- **Mutex (Mutual Exclusion Lock):** A **binary lock** with **ownership**. Only the thread that acquired the lock can release it. Protects a critical section from concurrent access. If Thread A locks a mutex, Thread B blocks until A unlocks it.
- **Semaphore:** A **counter** (not a lock). Two operations: `wait()` (decrement; block if 0) and `signal()` (increment; wake a blocked thread). No ownership — any thread can signal it.
  - **Binary Semaphore:** Like a mutex but without ownership (any thread can release).
  - **Counting Semaphore:** Initialized to N; allows up to N threads to proceed concurrently. Perfect for connection pools.

---

### Q19: What is a context switch and what overhead does it cause?
**Answer:**
A context switch is the process of saving the state (registers, program counter, stack pointer, memory mappings) of the currently running process/thread and restoring the state of another.

**Overhead:**
1. **Register Save/Restore:** CPU must save dozens of registers to memory and reload another process's registers.
2. **Cache Invalidation:** The CPU's L1/L2 caches contain data for the outgoing process. The incoming process must cold-start — fetching from slower RAM until caches warm up.
3. **TLB Flush:** The Translation Lookaside Buffer (cache for virtual-to-physical memory address translations) must be flushed on context switch, causing initial page table lookups to be slow.

Context switches are measured in microseconds — expensive to do thousands of times per second.

---

### Q20: What is the difference between a monolithic kernel and a microkernel?
**Answer:**
- **Monolithic Kernel:** All OS services (file system, device drivers, memory management, network stack, schedulers) run in **kernel space** with full hardware privileges. Direct function calls between components are fast. *Risk:* A buggy driver crashes the entire OS. *Example:* Linux.
- **Microkernel:** Only the bare minimum runs in kernel space (IPC, scheduling, basic memory management). All other services (drivers, file system) run as **user-space processes**. More stable (a crashed driver doesn't bring down the OS) but slower due to message-passing overhead between user-space services. *Example:* Mach, QNX.

---

### Q21: What are the different types of memory in a process?
**Answer:**
A process's memory layout:
- **Code Segment (Text):** Read-only. Contains the compiled machine instructions.
- **Data Segment:** Initialized global and static variables (known at compile time).
- **BSS Segment:** Uninitialized global/static variables (zero-initialized at startup).
- **Heap:** Dynamically allocated memory (`malloc`/`new`). Grows upward. Managed manually (C/C++) or by garbage collector (JavaScript/Java).
- **Stack:** Function call frames, local variables, return addresses. Grows downward. Automatically managed — pushed on function call, popped on return.

---

### Q22: What is a race condition and how is it prevented?
**Answer:**
A race condition occurs when two or more threads/processes access shared data concurrently and the outcome depends on the **execution order** — which is non-deterministic.

*Example:* Two threads read `counter = 5`, both increment to `6`, and both write `6`. The expected result was `7`.

**Prevention:**
1. **Mutex/Lock:** Only one thread enters the critical section at a time.
2. **Atomic Operations:** Hardware-level compare-and-swap (CAS) for simple counters.
3. **Immutability:** Shared data that is never mutated has no race conditions.
4. **Message Passing:** Instead of shared memory, threads communicate by sending messages (Go channels, Erlang actors).

---

### Q23: What is the difference between preemptive and non-preemptive scheduling?
**Answer:**
- **Preemptive Scheduling:** The OS can forcibly remove the CPU from a running process (interrupt it) to give it to another. The process is "preempted" mid-execution, saved to the ready queue, and resumed later. *Example:* Round Robin, Priority (preemptive). Required for responsive interactive systems.
- **Non-Preemptive Scheduling:** Once a process starts running, it runs until it voluntarily yields the CPU (by finishing, blocking on I/O, or calling yield). *Example:* FCFS, SJF (non-preemptive). Simpler but can lead to poor response times if a long process monopolizes the CPU.

---

### Q24: What is inter-process communication (IPC)?
**Answer:**
Processes have isolated memory — they can't share variables directly. IPC mechanisms allow them to communicate:
1. **Pipes:** Unidirectional byte stream between related processes (parent-child). `|` in Unix shells.
2. **Named Pipes (FIFOs):** Pipes accessible by name; usable between unrelated processes.
3. **Shared Memory:** Multiple processes map the same physical memory region into their address spaces. Fastest IPC — no kernel involvement after setup. Requires synchronization.
4. **Message Queues:** Kernel-managed queue for structured messages between processes.
5. **Sockets:** Network-capable IPC. Used for distributed communication (across machines).
6. **Semaphores:** Used for synchronization, not direct data transfer.

---

## Section 3: Computer Networks (Q25–35)

### Q25: Walk through the TCP three-way handshake.
**Answer:**
TCP establishes a reliable connection before data transfer:

1. **SYN:** Client sends a segment with the `SYN` flag and its **Initial Sequence Number (ISN)**: `SEQ=100`.
2. **SYN-ACK:** Server acknowledges and sends its own ISN: `ACK=101, SEQ=200, SYN`.
3. **ACK:** Client acknowledges the server's ISN: `ACK=201`.

Connection is now established. Both sides have agreed on their starting sequence numbers for reliable, ordered data delivery.

**Four-way termination:** Closing uses separate FIN from each side (FIN → ACK → FIN → ACK) because each direction of the connection closes independently.

---

### Q26: What happens when you type `https://google.com` in a browser?
**Answer:**
1. **URL Parsing:** Browser parses protocol (`https`), domain (`google.com`), path (`/`).
2. **DNS Resolution:** Browser checks local cache → OS cache → Recursive DNS resolver → Root server → TLD server (`.com`) → Authoritative DNS server → returns `142.250.x.x`.
3. **TCP Handshake:** Browser opens a TCP connection to `142.250.x.x:443` via 3-way handshake.
4. **TLS Handshake:** Browser and server negotiate TLS version, exchange certificates, verify Google's certificate against a Certificate Authority, and derive shared symmetric session keys.
5. **HTTP GET:** Browser sends encrypted `GET / HTTP/2 Host: google.com`.
6. **Server Response:** Google returns `200 OK` with HTML.
7. **Browser Rendering:** Parse HTML → build DOM → fetch CSS/JS → build CSSOM → layout → paint.

---

### Q27: Explain the difference between TCP and UDP.
**Answer:**

| Feature | TCP | UDP |
|---|---|---|
| Connection | Connection-oriented (handshake required) | Connectionless |
| Reliability | Guaranteed delivery, retransmission on loss | No guarantee — fire and forget |
| Order | Packets delivered in order | Out-of-order delivery possible |
| Speed | Slower (ACK overhead) | Faster (no handshake, no ACK) |
| Use Cases | HTTP, email, file transfer, SSH | Video streaming, gaming, DNS, VoIP |

*Why UDP for real-time:* A dropped video frame is better than a delayed one. TCP's retransmission would cause audio/video to freeze. UDP just skips the lost packet and plays on.

---

### Q28: What is HTTPS and how does TLS secure the connection?
**Answer:**
HTTPS = HTTP + TLS (Transport Layer Security). TLS uses two-phase encryption:

1. **Asymmetric Phase (Key Exchange):**
   - Server sends its digital certificate containing its **public key** (signed by a trusted Certificate Authority).
   - Browser verifies the certificate signature against known CA certificates.
   - Browser generates a random **pre-master secret**, encrypts it with the server's public key, and sends it.
   - Server decrypts it with its **private key**.
   - Both sides derive the same **session key** from the pre-master secret.

2. **Symmetric Phase (Data Transfer):**
   - All subsequent data is encrypted and decrypted using the shared session key (AES). Symmetric encryption is orders of magnitude faster than asymmetric.

---

### Q29: What are HTTP status code categories?
**Answer:**
- **1xx (Informational):** `100 Continue`, `101 Switching Protocols` (WebSocket upgrade).
- **2xx (Success):** `200 OK`, `201 Created`, `204 No Content`.
- **3xx (Redirection):** `301 Moved Permanently`, `302 Found`, `304 Not Modified`.
- **4xx (Client Error):** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `429 Too Many Requests`.
- **5xx (Server Error):** `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`.

---

### Q30: What is CORS and how does it work?
**Answer:**
**Cross-Origin Resource Sharing** is a browser security mechanism that restricts JavaScript running on one origin from reading responses from a different origin.

When `https://myapp.com` fetches `https://api.myapp.com`:
1. The browser adds `Origin: https://myapp.com` to the request.
2. If the server responds with `Access-Control-Allow-Origin: https://myapp.com`, the browser allows JavaScript to read the response.
3. If the header is missing or mismatches, the browser blocks the response (even though the server processed it).

**Preflight:** For non-simple requests (custom headers, JSON content-type, non-GET/POST methods), the browser sends an `OPTIONS` request first to check if the actual request is permitted.

---

### Q31: What is DNS poisoning and how is it prevented?
**Answer:**
**DNS Cache Poisoning:** An attacker injects malicious DNS records into a resolver's cache, redirecting traffic for `bank.com` to a malicious IP.

**Prevention:**
1. **DNSSEC (DNS Security Extensions):** Cryptographically signs DNS records so resolvers can verify they came from the legitimate authoritative server.
2. **DNS over HTTPS (DoH):** Encrypts DNS queries over HTTPS, preventing eavesdropping and tampering by attackers on the network path.
3. **Randomized Source Ports + Query IDs:** Makes it harder for attackers to craft valid spoofed responses.

---

### Q32: What is the difference between a load balancer and a reverse proxy?
**Answer:**
- **Reverse Proxy:** Sits in front of one or more backend servers. Intercepts all incoming requests. Handles SSL termination, caching, compression, and security headers before forwarding to the backend. The client sees only the proxy's IP. *Example:* Nginx, Cloudflare.
- **Load Balancer:** A specific type of reverse proxy focused on **distributing traffic** across multiple backend instances to prevent overload. Algorithms: Round Robin, Least Connections, IP Hash (sticky sessions).

In practice, a load balancer **is** a reverse proxy — but not all reverse proxies do load balancing.

---

### Q33: What is the OSI Model?
**Answer:**
7 layers from hardware to application:

| Layer | Name | Function | Example |
|---|---|---|---|
| 7 | Application | User-facing protocols | HTTP, FTP, SMTP |
| 6 | Presentation | Encryption, compression | TLS, JPEG |
| 5 | Session | Connection management | NetBIOS |
| 4 | Transport | Reliable delivery, ports | TCP, UDP |
| 3 | Network | Routing, IP addressing | IP, ICMP |
| 2 | Data Link | MAC addressing, framing | Ethernet, WiFi |
| 1 | Physical | Bits over wires/wireless | Cables, radio waves |

---

### Q34: What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?
**Answer:**
- **HTTP/1.1:** One request at a time per TCP connection. Multiple connections per domain needed for parallelism. Head-of-Line blocking at the application layer.
- **HTTP/2:** **Multiplexing** — multiple requests and responses simultaneously over **one** TCP connection using binary framing. Header compression (HPACK). Server Push. Still has TCP-level Head-of-Line blocking (one lost packet stalls all streams).
- **HTTP/3:** Replaces TCP with **QUIC** (UDP-based). Each stream is independent — a lost packet in Stream 1 doesn't block Stream 2. Faster connection setup (0-RTT for returning clients). The future standard for low-latency web.

---

### Q35: What is a CDN (Content Delivery Network)?
**Answer:**
A CDN is a geographically distributed network of servers (edge nodes) that cache and serve static content (images, CSS, JS, videos) close to users.

*How it works:*
1. User in Mumbai requests `https://myapp.com/logo.png`.
2. DNS resolves to the nearest CDN edge server (e.g., in Mumbai).
3. Edge server has the image cached → serves it from Mumbai in ~5ms.
4. Without CDN, request would go to US origin server → ~200ms.

*Benefits:* Reduced latency, reduced origin server load, DDoS protection (absorb traffic at the edge), high availability.

---

## Section 4: Data Structures & Algorithms (Q36–44)

### Q36: What is the time complexity of binary search and when can it be applied?
**Answer:**
Binary search has **O(log N)** time complexity. It repeatedly halves the search space:
1. Compare target with the middle element.
2. If match → found.
3. If target < middle → search left half.
4. If target > middle → search right half.

**Precondition:** The array must be **sorted**. Binary search only works on sorted, random-access data structures (arrays, not linked lists — linked lists don't support O(1) midpoint access).

---

### Q37: Explain the difference between BFS and DFS.
**Answer:**
Both traverse graphs/trees but in different orders:

- **BFS (Breadth-First Search):** Explores level by level. Uses a **Queue**. First visit closest nodes. Guaranteed to find the **shortest path** on unweighted graphs.
- **DFS (Depth-First Search):** Explores as deep as possible before backtracking. Uses a **Stack** (or recursion). Better for cycle detection, topological sort, backtracking problems.

*When to use BFS:* Shortest path (e.g., level-order traversal, word ladder, 0-1 BFS).
*When to use DFS:* Path existence, cycle detection, connected components, topological ordering.

---

### Q38: What is Dynamic Programming (DP)?
**Answer:**
DP solves problems by breaking them into overlapping sub-problems and storing the results to avoid recomputation.

Two approaches:
1. **Top-Down (Memoization):** Recursive solution + cache. Compute sub-problems only when needed:
   ```javascript
   const memo = {};
   function fib(n) {
     if (n <= 1) return n;
     if (memo[n]) return memo[n];
     return memo[n] = fib(n-1) + fib(n-2);
   }
   ```
2. **Bottom-Up (Tabulation):** Iterative. Build up from base cases:
   ```javascript
   const dp = [0, 1];
   for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
   ```

*DP Identification:* If a brute-force recursive solution has **overlapping sub-problems** and **optimal substructure** (optimal solution built from optimal sub-solutions), DP applies.

---

### Q39: What is the Sliding Window technique?
**Answer:**
Sliding Window optimizes problems on contiguous arrays/strings from O(N²) to O(N) by maintaining a "window" of elements:

```javascript
// Maximum sum subarray of size K:
let windowSum = 0;
for (let i = 0; i < k; i++) windowSum += arr[i];
let maxSum = windowSum;
for (let i = k; i < arr.length; i++) {
  windowSum += arr[i] - arr[i - k]; // slide: add new, remove old
  maxSum = Math.max(maxSum, windowSum);
}
```

*When to use:* Finding max/min/sum in a fixed or variable-size contiguous subarray. "Longest substring without repeating characters" — variable-size sliding window with a HashSet.

---

### Q40: Explain merge sort and its time/space complexity.
**Answer:**
Merge Sort is a **divide and conquer** sorting algorithm:
1. **Divide:** Split the array in half recursively until single elements.
2. **Conquer:** Merge adjacent sorted halves, maintaining sorted order during merge.

```
[38, 27, 43, 3]
→ [38, 27] [43, 3]
→ [38] [27] [43] [3]
→ [27, 38] [3, 43]
→ [3, 27, 38, 43]
```

- **Time:** O(N log N) in all cases (worst, average, best). The log N comes from splitting depth; N from merging each level.
- **Space:** O(N) auxiliary space — requires temporary arrays for merging.
- **Stable:** Preserves relative order of equal elements.

---

### Q41: What is a hash map and how does it handle collisions?
**Answer:**
A hash map stores key-value pairs. The key is passed through a **hash function** that maps it to an index in an underlying array. Ideal operations are O(1).

**Collisions** occur when two different keys hash to the same index:
1. **Separate Chaining:** Each array slot holds a linked list. Colliding entries are appended to the list. Worst case: all keys hash to one slot → O(N) lookups.
2. **Open Addressing (Linear Probing):** On collision, probe the next slot (or skip by a fixed step). Requires careful load factor management.
3. **Robin Hood Hashing:** A variant of open addressing that reduces variance in probe lengths for more predictable performance.

---

### Q42: What is a Trie and what is it used for?
**Answer:**
A **Trie** (Prefix Tree) is a tree where each node represents a character. A path from root to a node spells a word prefix.

```
         root
        /    \
       c      t
       |      |
       a      o
       |
       t (end)
```

*Use Cases:*
- **Autocomplete:** Traverse to the prefix node, then DFS all children for completions.
- **Spell Check:** O(L) lookup where L is word length (vs O(L × N) linear search).
- **Word Search (Leetcode 212):** Simultaneously searching multiple words in a 2D grid.
- **IP Routing:** Longest prefix match in network routing tables.

---

### Q43: Explain Quick Sort and its worst-case scenario.
**Answer:**
Quick Sort picks a **pivot** element and partitions the array into elements less than and greater than the pivot. Recursively sorts both halves.

```javascript
function quickSort(arr, low, high) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
}
```

- **Average Case:** O(N log N) — pivot splits array roughly in half each time.
- **Worst Case:** O(N²) — occurs when the pivot is always the smallest or largest element (e.g., sorted input with last-element pivot). Fixed by **randomized pivot selection**.
- **Space:** O(log N) stack frames on average (O(N) worst case).

---

### Q44: What is the two-pointer technique?
**Answer:**
Two pointers solve problems by maintaining two indices that move through data in a coordinated manner, reducing O(N²) brute force to O(N):

**Example — Two Sum on sorted array:**
```javascript
let left = 0, right = arr.length - 1;
while (left < right) {
  const sum = arr[left] + arr[right];
  if (sum === target) return [left, right];
  else if (sum < target) left++;
  else right--;
}
```

*Applications:* Two Sum (sorted), 3Sum, Container With Most Water, Remove Duplicates, Palindrome check, Merge two sorted arrays.

---

## Section 5: JavaScript Core Concepts (Q45–50)

### Q45: Explain the Event Loop in JavaScript.
**Answer:**
JavaScript is **single-threaded** but handles async operations through the Event Loop:

1. **Call Stack:** Executes synchronous code.
2. **Web APIs / libuv:** Handles async operations (setTimeout, fetch, fs.readFile) outside the main thread.
3. **Microtask Queue:** Holds Promise callbacks. **Always processed completely before macrotasks.**
4. **Macrotask Queue (Callback Queue):** Holds setTimeout, setInterval, I/O callbacks.

**Event Loop Cycle:**
```
Execute all synchronous code (empty call stack)
→ Drain entire Microtask Queue (all Promises)
→ Execute ONE Macrotask
→ Drain entire Microtask Queue again
→ Execute next Macrotask
→ ...
```

---

### Q46: What is a closure and why is it useful?
**Answer:**
A closure is a function that retains access to its **outer scope's variables** even after the outer function has returned.

```javascript
function makeCounter() {
  let count = 0; // private variable
  return {
    increment: () => ++count,
    get: () => count,
  };
}
const counter = makeCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.get(); // 2
// count is inaccessible from outside — truly private
```

*Use cases:* Data encapsulation (private state), function factories (currying), memoization, event handlers maintaining state.

---

### Q47: What is the difference between `==` and `===`?
**Answer:**
- **`==` (Loose Equality):** Performs **type coercion** before comparing. JavaScript converts operands to a common type.
  ```javascript
  '5' == 5    // true (string coerced to number)
  null == undefined // true
  0 == false  // true
  ```
- **`===` (Strict Equality):** No type coercion. Both **type** and **value** must match.
  ```javascript
  '5' === 5   // false (different types)
  null === undefined // false
  ```

**Rule:** Always use `===` in production code. `==` coercion rules are complex and error-prone.

---

### Q48: Explain Promise.all, Promise.allSettled, Promise.race, and Promise.any.
**Answer:**
- **`Promise.all([p1, p2, p3])`:** Resolves when **all** promises resolve. Rejects immediately if **any** rejects. Returns array of results. Use when all operations must succeed.
- **`Promise.allSettled([p1, p2, p3])`:** Waits for **all** to settle (resolve or reject). Never rejects itself. Returns array of `{status: 'fulfilled', value: ...}` or `{status: 'rejected', reason: ...}`. Use when you need all results regardless of failures.
- **`Promise.race([p1, p2, p3])`:** Resolves/rejects as soon as the **first** settles. Use for timeout races: `Promise.race([fetchData(), timeout(5000)])`.
- **`Promise.any([p1, p2, p3])`:** Resolves when **any** resolves. Rejects only if **all** reject (AggregateError). Use when you have multiple data sources and want the fastest.

---

### Q49: What is the difference between `var`, `let`, and `const`?
**Answer:**

| Feature | `var` | `let` | `const` |
|---|---|---|---|
| Scope | Function-scoped | Block-scoped `{}` | Block-scoped `{}` |
| Hoisting | Hoisted + initialized to `undefined` | Hoisted but TDZ (uninitialized) | Hoisted but TDZ |
| Reassignment | ✅ | ✅ | ❌ (reference) |
| Re-declaration | ✅ | ❌ | ❌ |

**Temporal Dead Zone (TDZ):** The region from scope start to the `let`/`const` declaration where accessing the variable throws `ReferenceError`.

```javascript
console.log(x); // undefined (var hoisted)
var x = 5;

console.log(y); // ReferenceError (TDZ)
let y = 5;
```

---

### Q50: What is the difference between arrow functions and regular functions?
**Answer:**
Three key differences:

1. **`this` Binding:**
   - Regular function: `this` is determined dynamically by how the function is called (who calls it).
   - Arrow function: `this` is inherited **lexically** from the surrounding scope at definition time. Cannot be changed.
   ```javascript
   const obj = {
     name: 'Test',
     regular: function() { console.log(this.name); }, // 'Test'
     arrow: () => { console.log(this.name); }, // undefined (inherits outer `this`)
   };
   ```
2. **`arguments` Object:** Regular functions have an `arguments` object. Arrow functions don't — use rest parameters `(...args)` instead.
3. **Constructor:** Arrow functions cannot be called with `new` — they don't have a `[[Construct]]` internal method.
