# Zomato Clone — Master Microservices Architecture, Schemas & Journeys (`roadmap.md`)

## 1. Executive Summary & Engineering Goals
This project is an enterprise-grade, distributed food-delivery platform built with **Java 21, Spring Boot 3.3+ Microservices, Spring Cloud Gateway, Apache Kafka (KRaft mode), PostgreSQL, Redis 7, and React 18+ (Vite + Tailwind CSS)**.

### Key Architectural Highlights
* **Edge Authentication & Hashed Refresh Tokens:** Custom stateless JWT authentication (`accessToken` + `refreshToken`) verified at the Spring Cloud Gateway edge, injecting trusted `X-User-Id` and `X-User-Role` headers downstream. Refresh tokens are stored strictly as cryptographic SHA-256 hashes with **token family reuse detection** to mitigate token theft.
* **Database-Per-Service Isolation:** 4 isolated PostgreSQL schemas (`identity`, `catalog`, `order`, `payment`) with zero cross-database foreign keys, using denormalized data snapshots in `order_db` for high-speed immutable historical reads.
* **Hybrid Synchronous & Asynchronous Communication:** Strict synchronous REST (`OpenFeign` + `Resilience4j` Circuit Breakers) for pre-checkout stock/price validation and payment initiation, paired with Asynchronous Event Choreography (`Apache Kafka`) for post-payment confirmation, order state progression, cancellations, refunds, and real-time streaming.
* **Transactional Outbox & Scalable Concurrency:** Guarantees at-least-once Kafka event delivery without dual-write bugs using the **Transactional Outbox Pattern** with `SELECT ... FOR UPDATE SKIP LOCKED` for scale-safe multi-instance polling. Concurrency is hardened via `Idempotency-Key` deduplication, atomic conditional SQL increments for promotional coupons, and per-user redemption audits.
* **Geospatial Search & Multi-Tier Caching:** Bounding-box indexed Haversine SQL queries for sub-50ms nearby restaurant discovery, paired with Redis write-through cache eviction on menu updates.
* **Resilient Real-Time Order Streaming (SSE):** Unidirectional Server-Sent Events (`SseEmitter`) bridged to Kafka topics with a 15-second keep-alive heartbeat, authenticated via `@microsoft/fetch-event-source`, and backed by a **Redis Pub/Sub backplane** to support horizontal multi-replica scaling.

---

## 2. High-Level Design (HLD)

### 2.1 System Architecture Topology

```text
+-----------------------------------------------------------------------------------+
|                                  REACT 18+ SPA                                    |
|        Customer App & Partner Dashboard (Single API Base URL: :8080/api/v1)       |
|        State: TanStack Query (Server Cache) + Zustand (Local Cart & Auth)         |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS (REST + SSE Stream via fetch-event-source)
                                          v
+-----------------------------------------------------------------------------------+
|                        SPRING CLOUD GATEWAY (Port 8080)                           |
|  - Edge JWT Validation Filter (Strips spoofing headers, injects X-User-Id, Role)  |
|  - Redis Rate Limiter (Token Bucket) & Resilience4j Circuit Breaker               |
|  - Route Forwarding (/api/v1/auth/**, /api/v1/restaurants/**, /api/v1/orders/**)  |
+------+------------------------+-------------------------+------------------+------+
       |                        |                         |                  |
       v (REST)                 v (REST)                  v (REST)           v (SSE Stream)
+--------------+       +-----------------+       +-----------------+  +-------------+
| Identity Svc |       |   Catalog Svc   |       |    Order Svc    |  | Realtime Svc|
|  (Port 8081) |       |   (Port 8082)   |<------|   (Port 8083)   |  | (Port 8085) |
|              |       |                 | Feign |                 |  |             |
| - JWT Issue  |       | - Geospatial SQL| (Sync | - Idempotency   |  | - SseEmitter|
| - Hashed Tkn |       | - Menu CRUD     | Item  | - Atomic Coupon |  |   Registry  |
| - User/Addr  |       | - Redis Cache   | Check)| - Outbox Poller |  | - 15s Ping  |
+------+-------+       +--------+--------+       +---+--------+----+  +------+------+
       |                        |                    |        |              ^
       |                        |                    | Feign  | Outbox       | Redis
       |                        |                    | (Sync) | Poller       | Pub/Sub
       |                        |                    |        v (Kafka)      | Fanout
       |                        |                    |    +-------------+    |
       |                        |                    |    | Apache Kafka|----+
       |                        |                    |    | Topics:     |
       |                        |                    |    | order-events|
       |                        |                    |    | pay-events  |
       |                        |                    |    +------+------+
       |                        |                    |           ^
       |                        |                    v           | Publishes
       |                        |            +-----------------+ | Webhook
       |                        |            |   Payment Svc   |-+ Verification
       |                        |            |   (Port 8084)   |
       |                        |            | - Razorpay SDK  |
       |                        |            | - Webhook Verify|
       |                        |            | - Refund Trigger|
       |                        |            +--------+--------+
       v                        v                     v                  v
+--------------+       +-----------------+   +-----------------+  +-----------------+
| Identity DB  |       |   Catalog DB    |   |    Order DB     |  |   Payment DB    |
| (PostgreSQL) |       | (Postgres+Redis)|   |  (PostgreSQL)   |  |  (PostgreSQL)   |
+--------------+       +-----------------+   +-----------------+  +-----------------+
```

### 2.2 Service Decomposition Matrix

| Microservice | Port | Database / Storage | Core Responsibilities |
|---|---|---|---|
| **`api-gateway`** | `8080` | Redis (Rate Limiter) | Single entry point for React. Validates JWT signatures, strips external `X-User-*` headers, injects trusted identity headers, handles CORS, rate limiting, and routes traffic. |
| **`identity-service`** | `8081` | `zomato_identity_db` | User registration, login, custom JWT issuance (`accessToken` + SHA-256 `token_hash`), token family rotation/revocation, and customer delivery addresses. |
| **`catalog-service`** | `8082` | `zomato_catalog_db` + Redis | Geospatial restaurant discovery (Haversine bounding box), menu item CRUD, Redis menu caching (`menus::{id}`), and internal batch price/stock validation API. |
| **`order-service`** | `8083` | `zomato_order_db` | Order lifecycle state machine, atomic coupon redemption audit, idempotency enforcement, synchronous payment intent coordination, and scale-safe **Transactional Outbox** polling. |
| **`payment-service`** | `8084` | `zomato_payment_db` | Razorpay order creation (in paise), webhook and signature verification, automated refunds on cancellation, and publishing `payment-events`. |
| **`realtime-service`** | `8085` | In-Memory (`ConcurrentHashMap`) + Redis Pub/Sub | Consumes `order-events` from Kafka, broadcasts across multi-instance nodes via Redis Pub/Sub, and pushes live updates to connected React clients via `SseEmitter` with a 15s keep-alive heartbeat. |

---

## 3. Complete Database Schemas (PostgreSQL DDL + Indexes)

Each microservice owns an isolated database. Cross-service entity references (`user_id`, `restaurant_id`, `menu_item_id`) are stored as plain `BIGINT` columns without cross-database foreign keys.

### 3.1 `zomato_identity_db` (`identity-service`)

```sql
-- 1. Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ROLE_CUSTOMER', 'ROLE_RESTAURANT_OWNER', 'ROLE_ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_phone ON users(phone);

-- 2. Customer Delivery Addresses
CREATE TABLE customer_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(30) NOT NULL, -- e.g., 'Home', 'Work', 'Other'
    full_address VARCHAR(300) NOT NULL,
    landmark VARCHAR(150),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_user_id ON customer_addresses(user_id);
-- Partial unique index guarantees at most one default address per user
CREATE UNIQUE INDEX idx_user_single_default_address 
ON customer_addresses(user_id) 
WHERE is_default = TRUE;

-- 3. Refresh Tokens (Hashed storage with Token Family Reuse Detection)
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,                        -- Tracks the token genealogy family
    token_hash VARCHAR(64) NOT NULL UNIQUE,          -- SHA-256 hash of the plain token
    replaced_by_hash VARCHAR(64),                   -- Hash of successor token upon rotation
    expiry_date TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
```

### 3.2 `zomato_catalog_db` (`catalog-service`)

```sql
-- 1. Restaurants Table
CREATE TABLE restaurants (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,                        -- Logical FK to zomato_identity_db.users(id)
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    cuisine_types VARCHAR(200) NOT NULL,             -- e.g., 'North Indian, Biryani, Mughlai'
    address_line VARCHAR(250) NOT NULL,
    city VARCHAR(80) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,         -- Soft-delete flag
    average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    total_ratings_count INT NOT NULL DEFAULT 0,
    cost_for_two INT NOT NULL,                       -- In INR (e.g., 500)
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Composite index for fast bounding-box filtering prior to exact Haversine calculation
CREATE INDEX idx_restaurants_lat_lng ON restaurants(latitude, longitude);
CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX idx_restaurants_city_open ON restaurants(city, is_open);

-- 2. Menu Items Table
CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(60) NOT NULL,                   -- e.g., 'Recommended', 'Starters', 'Main Course', 'Breads'
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,         -- Soft-delete flag
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);

-- 3. Restaurant Ratings & Reviews Audit Table
CREATE TABLE restaurant_reviews (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL,                     -- Logical FK to zomato_identity_db.users(id)
    order_id BIGINT NOT NULL UNIQUE,                 -- Logical FK to zomato_order_db.orders(id)
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_restaurant ON restaurant_reviews(restaurant_id);
```

### 3.3 `zomato_order_db` (`order-service`)

```sql
-- 1. Orders Table (Immutable historical snapshots of items, restaurant and address)
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key VARCHAR(64) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,                     -- Logical FK to zomato_identity_db.users(id)
    restaurant_id BIGINT NOT NULL,                   -- Logical FK to zomato_catalog_db.restaurants(id)
    restaurant_name_snapshot VARCHAR(150) NOT NULL,
    restaurant_address_snapshot VARCHAR(250) NOT NULL,
    delivery_address_snapshot VARCHAR(300) NOT NULL,
    delivery_lat DOUBLE PRECISION NOT NULL,
    delivery_lng DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'PAYMENT_PENDING', 'CONFIRMED', 'PREPARING', 
        'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 
        'CANCELLED', 'REJECTED'
    )),
    item_total NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL,              -- 5% GST on Restaurant Food
    delivery_fee NUMERIC(10, 2) NOT NULL,
    grand_total NUMERIC(10, 2) NOT NULL,
    coupon_code VARCHAR(30),
    gateway_order_id VARCHAR(100),                   -- Razorpay order ID (e.g., 'order_Nxyz123')
    rejection_reason VARCHAR(250),
    version BIGINT NOT NULL DEFAULT 0,               -- JPA @Version for Order Entity Optimistic Locking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE UNIQUE INDEX idx_orders_idempotency ON orders(idempotency_key);

-- 2. Order Items Table (Preserves historical item names & prices at checkout time)
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL,                   -- Logical FK to zomato_catalog_db.menu_items(id)
    item_name_snapshot VARCHAR(120) NOT NULL,
    is_veg_snapshot BOOLEAN NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 3. Promotional Coupons Table (Atomic Conditional Counter)
CREATE TABLE coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,                -- e.g., 'WELCOME50'
    discount_percentage INT NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100),
    max_discount_cap NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2) NOT NULL,
    max_usage_limit INT NOT NULL,
    current_usage_count INT NOT NULL DEFAULT 0,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Coupon Redemptions (Enforces strict per-user usage limits)
CREATE TABLE coupon_redemptions (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL REFERENCES coupons(id),
    user_id BIGINT NOT NULL,                         -- Logical FK to zomato_identity_db.users(id)
    order_id BIGINT NOT NULL,                        -- Logical FK to orders(id)
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (coupon_id, user_id)                      -- Guarantees single use per user
);
CREATE INDEX idx_redemptions_user ON coupon_redemptions(user_id);

-- 5. Transactional Outbox Table (Guarantees reliable Kafka event publishing)
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,             -- 'ORDER'
    aggregate_id VARCHAR(50) NOT NULL,               -- order.id as String
    event_type VARCHAR(60) NOT NULL,                 -- 'ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED'
    payload_json TEXT NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_outbox_unprocessed ON outbox_events(processed, created_at) WHERE processed = FALSE;
-- Retention strategy: Daily scheduled cron purges events: DELETE FROM outbox_events WHERE processed = TRUE AND created_at < NOW() - INTERVAL '7 days';
```

### 3.4 `zomato_payment_db` (`payment-service`)

```sql
CREATE TABLE payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,                 -- Logical FK to zomato_order_db.orders(id)
    customer_id BIGINT NOT NULL,                     -- Logical FK to zomato_identity_db.users(id)
    amount NUMERIC(10, 2) NOT NULL,                  -- In INR (e.g., 450.50). Converted to paise (* 100) for Razorpay API
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    gateway_order_id VARCHAR(100) NOT NULL UNIQUE,   -- Razorpay 'order_Nxyz123'
    gateway_payment_id VARCHAR(100),                 -- Razorpay 'pay_Abc987'
    gateway_signature VARCHAR(255),
    status VARCHAR(30) NOT NULL CHECK (status IN ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED')),
    refund_id VARCHAR(100),                          -- Razorpay refund ID 'rfnd_Xyz456'
    failure_reason VARCHAR(250),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payments_gw_order_id ON payment_transactions(gateway_order_id);
```

---

## 4. Main End-to-End User & System Journeys

### Journey 1: Stateless Authentication, Edge Verification & Silent Refresh
**Actors:** Customer / Restaurant Owner, React SPA (`axiosClient`), API Gateway (`8080`), Identity Service (`8081`).

```text
[React SPA]                  [API Gateway :8080]               [Identity Svc :8081]
     |                                |                                 |
     |--- 1. POST /api/v1/auth/login ->|--- Forward /api/v1/auth/login ->|
     |                                |                                 |-- Verify BCrypt Hash
     |                                |                                 |-- Sign JWT (15m TTL)
     |                                |                                 |-- Hash RefreshToken (SHA-256)
     |                                |                                 |-- Persist with Family UUID
     |<-- 2. 200 OK (accessToken, rawRefreshToken, userDto) ------------|
     |                                |                                 |
     |--- 3. GET /api/v1/orders ----->|                                 |
     |    (Bearer <accessToken>)      |-- Validate HMAC-SHA256 Signature|
     |                                |-- Strip incoming X-User-*       |
     |                                |-- Inject X-User-Id: 42          |
     |                                |-- Inject X-User-Role: CUSTOMER  |
     |                                |--- Forward to Order Svc :8083 ->|
```

1. **Login & Token Issuance:**
   * Customer logs in. `identity-service` validates BCrypt hash, signs a 15-minute `accessToken` with claims (`userId`, `role`), generates a random cryptographically secure 128-character `rawRefreshToken`, computes its SHA-256 hash, and saves it into `refresh_tokens` alongside a new `family_id` UUID.
2. **Gateway Verification:**
   * `api-gateway` uses a non-blocking `ReactiveGlobalFilter` to validate the JWT signature in memory. It strips incoming `X-User-Id` headers to eliminate external header spoofing, then injects verified `X-User-Id` and `X-User-Role` headers before forwarding to downstream microservices.
3. **Silent Token Refresh with Race-Condition Lock:**
   * When the 15-minute `accessToken` expires, downstream calls return `401 Unauthorized`.
   * **React `axiosClient` Queuing:** To prevent concurrent request storms from firing multiple refresh calls simultaneously, `axiosClient.js` uses an `isRefreshing` lock flag and a subscriber callback queue. Pending 401 requests pause until the single `/api/v1/auth/refresh` call finishes, then seamlessly replay with the new token.
4. **Token Family Reuse Detection:**
   * When rotating a refresh token, `identity-service` computes `sha256(rawRefreshToken)`.
   * If the presented token has already been rotated (`revoked = TRUE` or `replaced_by_hash IS NOT NULL`), **token theft is detected**. `identity-service` immediately revokes **all** tokens sharing that `family_id`, invalidating the malicious actor and protecting the account.

---

### Journey 2: Geospatial Restaurant Discovery & Cached Menu Browsing
**Actors:** Customer, React SPA (`TanStack Query`), Catalog Service (`8082`), PostgreSQL, Redis.

1. **Location Selection:** Customer chooses a delivery address (e.g., `lat = 18.5204, lng = 73.8567` in Pune) or allows browser geolocation.
2. **Debounced Discovery Query:** As the user searches for cuisines or toggles filters (`Rating 4.0+`, `Pure Veg`), React's `useDebounce(searchTerm, 300)` triggers:
   `GET /api/v1/restaurants?lat=18.5204&lng=73.8567&radiusKm=10&cuisine=Biryani&page=0&size=12`
3. **Bounding-Box + Haversine Execution:**
   * `catalog-service` pre-computes a bounding box `[minLat, maxLat, minLng, maxLng]` for $10\text{ km}$ ($1^\circ \text{lat} \approx 111\text{ km}$, $\Delta \text{lng} = \Delta \text{lat} / \cos(\text{lat})$).
   * PostgreSQL filters rows using composite index `idx_restaurants_lat_lng` in `< 5ms`, then computes the exact Haversine distance formula:
     $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   * Sorts results by `is_open DESC, distanceKm ASC`.
4. **Menu Cache Lookup with Cache-Stampede Protection:**
   * `GET /api/v1/restaurants/105` checks **Redis** key `menus::105`.
   * **Hit:** Returns categorized menu JSON directly from Redis in $< 3\text{ ms}$.
   * **Miss:** Queries PostgreSQL, groups items into categories (`Recommended`, `Starters`, `Mains`), and stores in Redis with a 30-minute TTL plus a randomized 5-minute jitter to prevent synchronized cache stampedes.

---

### Journey 3: Local Cart Management & Single-Restaurant Guard
**Actors:** Customer, React SPA (`useCartStore` in Zustand), Order Service (`8083`).

1. **Adding Items:** Customer clicks `+ Add`. Items are stored in Zustand `useCartStore` (persisted to `localStorage`).
2. **Single-Restaurant Conflict Modal:**
   * If the cart contains items from `restaurantId: 105` (*Biryani Blues*) and the user clicks `+ Add` on an item from `restaurantId: 209` (*Burger King*), `useCartStore` blocks the update and mounts `<ReplaceCartModal />`:
     > *"Your cart contains items from Biryani Blues. Would you like to reset your cart to add dishes from Burger King?"*
3. **Live Stateless Bill Breakdown:**
   * Opening the checkout drawer invokes `POST /api/v1/orders/calculate-bill` with `{ restaurantId, deliveryAddressId, couponCode, items }`.
   * `order-service` calls `catalog-service` to obtain authoritative item prices and calculates:
     * `itemTotal` = $\sum (\text{price} \times \text{qty})$
     * `discountAmount` (calculated if coupon is active and order exceeds `min_order_value`)
     * `taxAmount` = $5\%$ GST on food
     * `deliveryFee` = Base fee (₹30) + distance surcharge (₹10/km beyond 4km)
     * `grandTotal` = `itemTotal` - `discountAmount` + `taxAmount` + `deliveryFee`

---

### Journey 4: Fault-Tolerant Distributed Checkout & Payment Saga
**Actors:** Customer, React SPA, Order Service (`8083`), Catalog Service (`8082`), Identity Service (`8081`), Payment Service (`8084`), Kafka.

```text
[React Client] 
   |
   | 1. POST /api/v1/orders (Header: Idempotency-Key: 9b1deb4d-...)
   v
[Order Service :8083]
   |--- 2. Check Idempotency: Query `orders` by `idempotency_key`. If exists, return cached Order.
   |
   |== Phase A: Non-Transactional Pre-Flight Checks & Payment Intent ==
   |--- 3. OpenFeign -> POST http://catalog-service/internal/v1/catalog/validate-order-items
   |       (Checks restaurant isOpen, items isAvailable, returns authoritative prices)
   |--- 4. OpenFeign -> GET http://identity-service/internal/v1/users/42/addresses/12
   |       (Fetches delivery address string & coordinates)
   |--- 5. OpenFeign -> POST http://payment-service/internal/v1/payments/initiate
   |       (Calls Razorpay orders.create in paise, saves PaymentTransaction as INITIATED)
   |       Returns: gatewayOrderId = "order_Nxyz123"
   |
   |== Phase B: Local ACID Transaction (@Transactional in order_db) ==
   |--- 6. Atomic Coupon Check & Increment:
   |       UPDATE coupons SET current_usage_count = current_usage_count + 1 
   |       WHERE code = :code AND current_usage_count < max_usage_limit;
   |       INSERT INTO coupon_redemptions (coupon_id, user_id, order_id) VALUES (...);
   |--- 7. Persist Order (status = 'PAYMENT_PENDING', gateway_order_id = "order_Nxyz123")
   |--- 8. Persist OrderItem snapshots (names, prices, veg/non-veg)
   |--- 9. Insert 'ORDER_CREATED' into outbox_events
   |
   |--- 10. Return 201 Created to React (with orderId: 5009, gatewayOrderId: "order_Nxyz123")
   v
[React Client] -> Opens Razorpay Modal -> Customer Pays via UPI/Card
   |
   | 11. POST /api/v1/payments/verify (razorpay_order_id, razorpay_payment_id, razorpay_signature)
   v
[Payment Service :8084]
   |--- 12. Verifies HMAC-SHA256 signature:
   |        generated_sig = HmacSHA256(order_id + "|" + payment_id, secret)
   |        Marks PaymentTransaction = SUCCESS
   |--- 13. Publishes PAYMENT_SUCCEEDED to Kafka topic `payment-events`
   v
[Order Service :8083 (@KafkaListener)]
   |--- 14. Consumes PAYMENT_SUCCEEDED -> Transitions Order 5009 from PAYMENT_PENDING to CONFIRMED
   |--- 15. Writes ORDER_STATUS_CHANGED into outbox_events
   |--- 16. Outbox Poller (SKIP LOCKED) publishes to Kafka `order-events`
```

#### Compensation Saga on Failure & Rejection:
* **Payment Failure / Expiration:** If the user abandons payment or Razorpay reports failure, `payment-service` publishes `PAYMENT_FAILED`. `order-service` consumes it, transitions status to `CANCELLED`, decrements coupon usage count, and deletes the `coupon_redemptions` record.
* **Restaurant Rejection / Out-of-Stock Compensation:** If a restaurant rejects a confirmed order (`PATCH /status` $\rightarrow$ `REJECTED`), `order-service` writes `ORDER_CANCELLED` to `outbox_events`. `payment-service` consumes the cancellation event and immediately calls Razorpay's Refund API (`POST /v1/payments/{payment_id}/refund`), setting `payment_transactions.status = 'REFUNDED'`.

---

### Journey 5: Restaurant Partner Menu Management & Cache Eviction
**Actors:** Restaurant Owner, React Partner Dashboard, Catalog Service (`8082`), Redis.

1. **Item Availability Toggle:** During peak dinner rush, an item runs out. The owner toggles the switch on the dashboard (`PATCH /api/v1/partner/catalog/items/805/availability` with `{ "isAvailable": false }`).
2. **Optimistic React Mutation:** TanStack Query updates local UI immediately via `onMutate`.
3. **Database Update & Redis Eviction:**
   * `catalog-service` verifies `X-User-Id` owns the restaurant.
   * Updates `menu_items.is_available = false`.
   * Triggers `@CacheEvict(value = "menus", key = "#restaurantId")` to immediately purge stale Redis cache entries.

---

### Journey 6: Partner Order Fulfillment & Real-Time Tracking (SSE)
**Actors:** Customer, Restaurant Owner, Order Service (`8083`), Kafka (`order-events`), Realtime Service (`8085`).

```text
[Partner Dashboard UI]        [Order Svc :8083]        [Kafka :9092]        [Realtime Svc :8085]        [Customer Tracking UI]
          |                           |                      |                       |                            |
          |                           |                      |                       |<-- 1. Stream via fetch-event-source
          |                           |                      |                       |    (Auth: Bearer JWT)      |
          |                           |                      |                       |-- 15s Heartbeat Ping (:keep-alive)
          |--- 2. PATCH /status ----->|                      |                       |                            |
          |    (status: PREPARING)    |-- Validate State     |                       |                            |
          |                           |-- Save Order & Outbox|                       |                            |
          |                           |--- 3. Publish ------>|--- 4. Consume ------->|                            |
          |                           |   order-events       |   ORDER_STATUS_CHANGED|-- Broadcast (Redis Pub/Sub)|
          |                           |                      |                       |-- Lookup SseEmitter(5009)  |
          |                           |                      |                       |--- 5. Push SSE Event ----->|
          |                           |                      |                       |    (Stepper updates live!) |
```

1. **Authenticated SSE Subscription:**
   * Customer tracking screen uses `@microsoft/fetch-event-source` to connect to `GET /api/v1/stream/orders/5009`, passing `Authorization: Bearer <accessToken>` header.
   * `realtime-service` registers an `SseEmitter` in a thread-safe `ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>>`.
   * A 15-second scheduled executor sends empty SSE comments (`: keep-alive\n\n`) to prevent Gateway or reverse-proxy TCP connection timeouts.
2. **Multi-Replica Broadcast:**
   * In multi-replica deployments, Kafka events are consumed and republished to a Redis Pub/Sub channel (`sse:order-events`). All `realtime-service` pods receive the event and check their local emitters, ensuring the client receives the update regardless of which replica holds their connection.
3. **Partner Status Progression:**
   * Owner clicks **"Accept & Start Preparing"** (`PATCH /api/v1/partner/orders/5009/status` with `{ "status": "PREPARING" }`).
   * `order-service` validates state transition: `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_PICKUP` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`.
   * Updates `orders.status` and writes `ORDER_STATUS_CHANGED` to `outbox_events`.
4. **Instant Zero-Polling UI Update:**
   * The SSE stream delivers the payload to the browser. TanStack Query updates its cache via `queryClient.setQueryData(['order', 5009], updatedData)`, advancing the animated tracking stepper instantly without polling.

---

### Journey 7: Automated Solo-Demo Simulator
To demonstrate the platform during an interview without needing two separate browser sessions:
* `order-service` includes an `@Scheduled(fixedDelay = 15000)` simulator enabled via `app.demo-simulator.enabled=true` in `application.yml`.
* Every 15 seconds, it queries active orders created in the last 10 minutes and advances their status by one step (`CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_PICKUP` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`), inserting outbox events at each stage.
* The customer tracking screen animates live across the delivery lifecycle automatically.

---

## 5. Public & Internal API Reference

### 5.1 Public API Gateway Endpoints (`Port 8080`)

| Method & Gateway Path | Target Microservice | Auth Required | Description |
|---|---|---|---|
| `POST /api/v1/auth/register` | `identity-service:8081` | Public | Register `CUSTOMER` or `RESTAURANT_OWNER`. |
| `POST /api/v1/auth/login` | `identity-service:8081` | Public | Authenticate; returns `accessToken` and raw `refreshToken`. |
| `POST /api/v1/auth/refresh` | `identity-service:8081` | Public | Rotates refresh token (family reuse check); returns new `accessToken`. |
| `GET /api/v1/users/me` | `identity-service:8081` | Authenticated | Get current user profile and delivery addresses. |
| `POST /api/v1/users/me/addresses` | `identity-service:8081` | `CUSTOMER` | Save new delivery address with latitude and longitude. |
| `GET /api/v1/restaurants` | `catalog-service:8082` | Public | Paginated geospatial search (`lat`, `lng`, `radiusKm`, `cuisine`, `minRating`). |
| `GET /api/v1/restaurants/{id}` | `catalog-service:8082` | Public | Get restaurant details + categorized menu (Redis cached). |
| `POST /api/v1/partner/catalog/restaurants` | `catalog-service:8082` | `RESTAURANT_OWNER` | Create/onboard a new restaurant. |
| `POST /api/v1/partner/catalog/restaurants/{id}/items` | `catalog-service:8082` | `RESTAURANT_OWNER` | Add menu item and evict Redis menu cache. |
| `PATCH /api/v1/partner/catalog/items/{id}/availability` | `catalog-service:8082` | `RESTAURANT_OWNER` | Toggle item in-stock / out-of-stock status. |
| `POST /api/v1/orders/calculate-bill` | `order-service:8083` | `CUSTOMER` | Stateless bill breakdown (Item Total, GST, Delivery Fee, Coupon). |
| `POST /api/v1/orders` | `order-service:8083` | `CUSTOMER` | Place order (`Idempotency-Key` header required). |
| `GET /api/v1/orders` | `order-service:8083` | `CUSTOMER` | Paginated customer order history. |
| `GET /api/v1/orders/{id}` | `order-service:8083` | `CUSTOMER`/`OWNER` | Fetch single order detail + snapshot items. |
| `PATCH /api/v1/partner/orders/{id}/status` | `order-service:8083` | `RESTAURANT_OWNER` | Advance order state (`CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `DELIVERED`). |
| `POST /api/v1/partner/orders/{id}/reject` | `order-service:8083` | `RESTAURANT_OWNER` | Reject order with reason; triggers compensation refund. |
| `POST /api/v1/payments/verify` | `payment-service:8084` | `CUSTOMER` | Verify Razorpay HMAC signature and publish `PAYMENT_SUCCEEDED`. |
| `GET /api/v1/stream/orders/{orderId}` | `realtime-service:8085` | `CUSTOMER` | Subscribe to live SSE order updates (`fetch-event-source` authenticated). |

### 5.2 Internal Inter-Service Contracts
* **Synchronous Feign (`order-service` $\rightarrow$ `catalog-service`):** `POST /internal/v1/catalog/validate-order-items`
* **Synchronous Feign (`order-service` $\rightarrow$ `identity-service`):** `GET /internal/v1/users/{userId}/addresses/{addressId}`
* **Synchronous Feign (`order-service` $\rightarrow$ `payment-service`):** `POST /internal/v1/payments/initiate`
* **Asynchronous Kafka (`payment-service` $\rightarrow$ `order-service`):** Topic `payment-events` (`PAYMENT_SUCCEEDED`, `PAYMENT_FAILED`)
* **Asynchronous Kafka (`order-service` $\rightarrow$ `realtime-service`):** Topic `order-events` (`ORDER_STATUS_CHANGED`)
* **Asynchronous Kafka (`order-service` $\rightarrow$ `payment-service`):** Topic `order-events` (`ORDER_CANCELLED`, triggers Razorpay refund)

---

## 6. Monorepo Project Structure

```text
zomato-clone-microservices/
├── docker-compose.yml                # Multi-DB Postgres, Redis 7, Kafka (KRaft mode)
├── infra/
│   └── init-multiple-dbs.sh          # Creates zomato_identity_db, catalog_db, order_db, payment_db
├── backend/
│   ├── pom.xml                       # Root parent POM (Java 21, Spring Boot 3.3.4, Spring Cloud 2023.0.3)
│   ├── common-contracts/             # Shared Kafka Event records, Feign DTOs, Enums, RFC 7807 ProblemDetail
│   ├── api-gateway/                  # Port 8080: Spring Cloud Gateway, Reactive JWT Filter, Redis Rate Limiter
│   ├── identity-service/             # Port 8081: Auth, BCrypt, Hashed Token Rotation, Addresses
│   ├── catalog-service/              # Port 8082: Geospatial Haversine Search, Menu CRUD, Redis Cache
│   ├── order-service/                # Port 8083: Checkout Saga, Atomic Coupons, SKIP LOCKED Outbox Poller
│   ├── payment-service/              # Port 8084: Razorpay SDK, Webhook HMAC Verification, Auto Refunds
│   └── realtime-service/             # Port 8085: SseEmitter Registry, 15s Heartbeat, Redis Pub/Sub Fanout
└── frontend/                         # React 18 + Vite + Tailwind CSS
    ├── package.json                  # @tanstack/react-query, zustand, @microsoft/fetch-event-source, lucide-react, leaflet
    └── src/
        ├── api/                      # axiosClient.js (Queued 401 Refresh Lock), endpoints.js
        ├── components/
        │   ├── ui/                   # Button, Badge, Card, Input, Modal, Drawer, Toast, Stepper, LeafletMapPicker
        │   ├── layout/               # Navbar, Footer, PartnerSidebar, ProtectedRoute, RoleGuard
        │   └── modals/               # AddressModal, ReplaceCartModal, RejectOrderModal, StoryViewerModal
        ├── features/
        │   ├── auth/                 # LoginPage, RegisterPage, useAuthStore (Zustand)
        │   ├── catalog/              # RestaurantDiscoveryPage (Grid & Map Views), RestaurantMenuPage, useRestaurants
        │   ├── cart/                 # CartDrawer, CartItemRow, QuantityStepper, useCartStore (Zustand)
        │   ├── checkout/             # CheckoutPage (AddressSection, PaymentSection, SummarySection), useRazorpayCheckout
        │   └── orders/               # LiveOrderTrackingPage (SSE Stepper & Map), PartnerOrderDashboard, useOrderStream
        ├── hooks/                    # useDebounce.js, useGeolocation.js
        └── App.jsx                   # Central route configuration & layout wrapper
```

---

## 7. Phased 5-Week Implementation Checklist

### Week 1: Infrastructure, Multi-Module Setup & Edge Auth (`identity-service` + `api-gateway`)
* [ ] Create root Maven `pom.xml` with submodules, define Spring Boot 3.3.x dependencies, and configure `docker-compose.yml` (PostgreSQL with `init-multiple-dbs.sh`, Redis 7, Kafka in KRaft mode).
* [ ] Implement `identity-service`: User registration, BCrypt password hashing, custom JWT generation (`accessToken` + SHA-256 `token_hash`), token family reuse detection, and `CustomerAddress` CRUD with partial unique index on `is_default`.
* [ ] Implement `api-gateway`: Configure route predicates in `application.yml` and build `AuthenticationGatewayFilterFactory` to strip incoming `X-User-*` headers, validate JWTs in memory, and propagate trusted identity headers downstream.
* [ ] **React:** Initialize Vite + Tailwind CSS, build `axiosClient.js` with queued 401 token refresh lock, and build Login/Register screens with Zustand auth persistence.

### Week 2: Geospatial Discovery & Redis Caching (`catalog-service`)
* [ ] Implement `Restaurant`, `MenuItem`, and `RestaurantReview` entities in `catalog-service` with Flyway migrations (`V1__init_catalog_schema.sql`) and seed data (15–20 realistic restaurants with coordinates).
* [ ] Build native Haversine geospatial query with bounding-box pre-filtering (`idx_restaurants_lat_lng`) and pagination.
* [ ] Configure Redis caching (`@Cacheable`) on `GET /api/v1/restaurants/{id}` with TTL + jitter, and `@CacheEvict` on partner menu updates.
* [ ] Build internal batch validation endpoint (`POST /internal/v1/catalog/validate-order-items`).
* [ ] **React:** Build Restaurant Discovery page with debounced search, cuisine/rating filters, loading skeletons via **TanStack Query**, and categorized Restaurant Menu page.

### Week 3: Distributed Checkout, Idempotency & Atomic Coupons (`order-service`)
* [ ] Implement `Order`, `OrderItem`, `Coupon`, `CouponRedemption`, and `OutboxEvent` entities in `order-service` with Flyway migrations.
* [ ] Configure `OpenFeign` clients with `Resilience4j` circuit breakers to call `catalog-service` and `identity-service` during checkout pre-flight.
* [ ] Implement `POST /api/v1/orders/calculate-bill` and `POST /api/v1/orders` with `Idempotency-Key` header verification and atomic conditional SQL updates on `coupons`.
* [ ] Keep external HTTP Feign calls outside the `@Transactional` boundary; ensure local ACID transactions strictly cover order insertion, coupon redemption, and outbox event creation.
* [ ] **React:** Build `useCartStore` in Zustand (persisted to `localStorage`) with the **Single-Restaurant Guard Modal** and Checkout summary drawer.

### Week 4: Payment Choreography Saga & Transactional Outbox (`payment-service` + Kafka)
* [ ] Build the `@Scheduled` Outbox Poller in `order-service` using `SELECT ... FOR UPDATE SKIP LOCKED` to publish events reliably to Kafka across multi-instance deployments.
* [ ] Implement `payment-service` with Razorpay Test Mode SDK (`orders.create` in paise and HMAC-SHA256 signature verification).
* [ ] Wire Kafka producer in `payment-service` (`payment-events`) and `@KafkaListener` in `order-service` to transition orders from `PAYMENT_PENDING` to `CONFIRMED` (or `CANCELLED` on failure).
* [ ] Implement compensation refund saga: when an order is cancelled or rejected, `payment-service` initiates Razorpay Refund API calls.
* [ ] **React:** Integrate Razorpay Checkout JS script on the Checkout page and redirect to the Live Order Tracking screen on success.

### Week 5: Real-Time SSE Tracking, Partner Dashboard & Polish (`realtime-service`)
* [ ] Implement `realtime-service` with `SseEmitter` registry, 15-second keep-alive heartbeat comments, and Redis Pub/Sub broadcast fanout for multi-replica scaling.
* [ ] Build Partner Order Dashboard endpoints (`PATCH /api/v1/partner/orders/{id}/status`, `POST /api/v1/partner/orders/{id}/reject`) and the `@Scheduled` solo-demo simulator (`app.demo-simulator.enabled=true`).
* [ ] **React:** Implement `useOrderStream` hook using `@microsoft/fetch-event-source` to maintain authenticated SSE connections and update the TanStack Query cache in real time, paired with an animated stepper and the Partner Order Dashboard.