# Zomatwo — Distributed Food Delivery Microservices Platform 🍕🚀

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%2B-orange.svg?logo=openjdk)](https://openjdk.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-3.8%20(KRaft)-black.svg?logo=apachekafka)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-7.4-DC382D.svg?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?logo=docker)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Render-Deploy%20Ready-46E3B7.svg?logo=render)](https://render.com)

**Zomatwo** is an enterprise-grade, distributed food-delivery platform inspired by modern on-demand food networks. It is built with **Spring Boot 3.3+ Microservices, Spring Cloud Gateway, Apache Kafka, PostgreSQL, Redis, and React 18+ (Vite + Tailwind CSS)**.

The system is designed for high concurrency, zero dual-write anomalies (via the **Transactional Outbox Pattern**), real-time order tracking via **Server-Sent Events (SSE)**, strict **Role-Based Access Control (RBAC)**, and cloud deployment on **Render** (supporting both single-database free tiers and multi-service private network architectures).

---

## 🏛️ System Architecture Topology

```text
                                  [ User Browser / Mobile ]
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
                    ▼ (HTTPS)                                           ▼ (API / SSE Stream)
        ┌────────────────────────┐                          ┌────────────────────────┐
        │    React 18+ SPA       │                          │  Spring Cloud Gateway  │
        │ - Customer Discovery   │                          │      (Port 8080)       │
        │ - Partner Kitchen View │                          │ - Edge JWT Validation  │
        │ - Zustand + TanStack   │                          │ - Route Forwarding     │
        └────────────────────────┘                          │ - CORS / Rate Limiting │
                                                            └───────────┬────────────┘
                                                                        │
        ┌───────────────────┬───────────────────┬───────────────────────┼───────────────────┐
        ▼ (REST)            ▼ (REST)            ▼ (REST)                ▼ (REST)            ▼ (SSE)
┌───────────────┐   ┌───────────────┐   ┌───────────────┐       ┌───────────────┐   ┌───────────────┐
│Identity Svc   │   │Catalog Svc    │   │Order Svc      │       │Payment Svc    │   │Realtime Svc   │
│  (Port 8081)  │   │  (Port 8082)  │   │  (Port 8083)  │       │  (Port 8084)  │   │  (Port 8085)  │
│ - JWT Issuance│   │ - Geospatial  │   │ - State Mach. │       │ - Razorpay SDK│   │ - SseEmitter  │
│ - Refresh Hash│   │ - Menus & CRUD│   │ - Outbox Poll │       │ - Refunds     │   │ - 15s Heartbt │
│ - Addresses   │   │ - Cache Layer │   │ - Coupons     │       │ - Webhooks    │   │ - Order Stream│
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘       └───────┬───────┘   └───────┬───────┘
        │                   │                   │                       │                   │
        │                   │                   ▼ (Kafka / Outbox)      ▼ (Kafka)           ▲ (Events)
        │                   │           ┌───────────────────────────────────────┐           │
        │                   │           │     Apache Kafka (order-events)       ├───────────┘
        │                   │           └───────────────────────────────────────┘
        ▼                   ▼                   ▼                       ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐       ┌───────────────┐
│  Identity DB  │   │  Catalog DB   │   │   Order DB    │       │  Payment DB   │
│ (PostgreSQL)  │   │ (PostgreSQL)  │   │ (PostgreSQL)  │       │ (PostgreSQL)  │
└───────────────┘   └───────────────┘   └───────────────┘       └───────────────┘
```

---

## 📦 Microservices Decomposition Matrix

| Microservice | Port | Database / History | Key Responsibilities |
|---|---|---|---|
| **`api-gateway`** | `8080` / `$PORT` | Memory / Redis | Edge entry point. Validates JWT signatures, strips spoofed headers, injects trusted `X-User-Id` / `X-User-Role`, and dynamically routes requests. |
| **`identity-service`** | `8081` | `flyway_identity_history` | User registration, authentication, custom JWT generation (`accessToken` + SHA-256 `token_hash`), token family rotation, and customer delivery addresses. |
| **`catalog-service`** | `8082` | `flyway_catalog_history` | Geospatial restaurant search (bounding-box queries across Pune neighborhoods), menu categories, dish items, and caching. |
| **`order-service`** | `8083` | `flyway_order_history` | Order lifecycle state machine, atomic coupon validation, Transactional Outbox pattern (`SELECT ... FOR UPDATE SKIP LOCKED`), and payment coordination. |
| **`payment-service`** | `8084` | `flyway_payment_history` | Razorpay payment intent creation, signature and webhook verification, automated refund triggers, and transaction logging. |
| **`realtime-service`** | `8085` | In-Memory (`ConcurrentHashMap`) | Server-Sent Events (SSE) streaming engine with 15s keep-alive heartbeat for live client order progression tracking. |

---

## ✨ Key Platform Features

### 🛍️ Customer Experience
- **Responsive Discovery Page**: Adaptive omnibar with Pune delivery neighborhood selector (`Kharadi`, `Koregaon Park`, `Viman Nagar`, etc.) and instant dish/restaurant search.
- **Dynamic Offers Carousel**: Interactive food banners with copyable promo codes and category filters.
- **What's on your mind?**: Visual cuisine browser with instant filtering.
- **Menu & Cart Drawer**: Categorized sticky navigation tabs, vegetarian filters, and reactive cart counter with live tax/fee calculations.
- **Streamlined Checkout**: Multiple delivery address management, promo code redemption, and payment rail selection.
- **Live Order Tracking**: Visual progress stepper (`PLACED` &rarr; `ACCEPTED` &rarr; `PREPARING` &rarr; `OUT_FOR_DELIVERY` &rarr; `DELIVERED`) backed by real-time SSE stream.

### 👨‍🍳 Restaurant Partner Portal
- **Kitchen Live Terminal (`/partner/orders`)**: Dedicated console for restaurant owners to accept incoming orders, mark items as preparing, and hand over to riders.
- **Strict Role-Based Access Control (RBAC)**: Protected via `RoleGuard` (`ROLE_RESTAURANT_OWNER`, `ROLE_ADMIN`, `ROLE_CUSTOMER`). Navigation adapts dynamically to user permissions.

### 🛡️ Enterprise Engineering Patterns
- **Transactional Outbox Pattern**: Order state events are written atomically with business data in a single database transaction, then published asynchronously to avoid dual-write bugs.
- **Zero-Collision Shared Database Architecture**: All microservices can either run on individual databases or share a single cloud PostgreSQL instance without table name or migration conflicts.
- **Memory-Tuned Containerization**: JVM processes configured with SerialGC (`-XX:+UseSerialGC`) and bounded heaps, allowing all 6 services to co-exist within 512MB RAM on free cloud instances.

---

## 🛠️ Technology Stack

### Backend
- **Core Framework**: Java 17+, Spring Boot 3.3.4
- **Edge & Routing**: Spring Cloud Gateway (Reactive WebFlux)
- **Data & ORM**: Spring Data JPA, Hibernate 6, PostgreSQL 16 Driver
- **Database Migrations**: Flyway Core & Flyway PostgreSQL
- **Security**: JJWT (0.12.6) for HMAC-SHA256 stateless tokens
- **Event Streaming**: Apache Kafka (Spring Kafka) + Server-Sent Events (SseEmitter)
- **Utilities**: Lombok, MapStruct

### Frontend
- **Framework**: React 18.3.1, Vite 5.4
- **Styling**: Tailwind CSS 3.4, Vanilla CSS animations
- **State Management**: Zustand 5.0 (Client state & auth tokens)
- **Server Cache**: TanStack React Query 5.59
- **Networking**: Axios, `@microsoft/fetch-event-source`
- **Icons & UI**: Lucide React, Leaflet Maps

---

## 🚀 Local Development Quickstart

### 1. Prerequisites
- **Java 17+** JDK installed
- **Node.js 20+** and `npm` installed
- **Docker & Docker Compose** installed

### 2. Start Infrastructure Services
Launch local PostgreSQL, Redis, Kafka, and Kafka UI:
```bash
docker compose up -d
```
Verify containers are healthy:
```bash
docker ps
```

### 3. Build & Run Backend Microservices
From the `backend` directory:
```bash
cd backend
mvn clean package -DskipTests
```
Launch each service in separate terminal windows (or via your IDE):
```bash
# Terminal 1: Identity Service (:8081)
java -jar identity-service/target/identity-service-1.0.0-SNAPSHOT.jar

# Terminal 2: Catalog Service (:8082)
java -jar catalog-service/target/catalog-service-1.0.0-SNAPSHOT.jar

# Terminal 3: Order Service (:8083)
java -jar order-service/target/order-service-1.0.0-SNAPSHOT.jar

# Terminal 4: Payment Service (:8084)
java -jar payment-service/target/payment-service-1.0.0-SNAPSHOT.jar

# Terminal 5: Realtime Service (:8085)
java -jar realtime-service/target/realtime-service-1.0.0-SNAPSHOT.jar

# Terminal 6: API Gateway (:8080)
java -jar api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar
```

### 4. Start Frontend
From the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🌐 Deploying on Render (Free Tier Optimized)

This project includes complete Infrastructure-as-Code for deployment on [Render](https://render.com):

1. **All-in-One Multi-Service Container** ([`Dockerfile`](./Dockerfile)): Packages the API Gateway and all microservices into a single container that runs within Render's free 512MB RAM tier.
2. **Single Free Database Support**: Automatically parses Render's `DATABASE_URL`, extracts credentials, converts to JDBC format (`jdbc:postgresql://...`), and runs Flyway migrations using isolated history tables.
3. **1-Click Render Blueprint** ([`render.yaml`](./render.yaml)): Provisions your web service and static site with all environment variables pre-configured.

📖 **Detailed step-by-step instructions can be found in [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md).**

---

## 🔑 Default Seeded Credentials

When database migrations run, sample accounts are automatically available for testing:

| Role | Email | Password | Access |
|---|---|---|---|
| **Customer** | `raj.patel@example.com` | `Password123!` | Discovery, Cart, Checkout, Order Tracking |
| **Partner (Owner)** | `chef.anand@biryaniproject.com` | `Password123!` | Kitchen Live Terminal (`/partner/orders`) |
| **Admin** | `admin@zomatwo.com` | `Admin123!` | Full System Access |

---

## 📜 Environment Variables Reference

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `8080` | Port bound by the API Gateway or Render Web Service |
| `DATABASE_URL` | `postgresql://...` | Connection string to your PostgreSQL instance |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `root` | Database password |
| `JWT_SECRET` | `404E6352...` | 256-bit HMAC secret key for token signing |
| `CACHE_TYPE` | `simple` | `simple` for in-memory caching; `redis` for external Redis |
| `KAFKA_ENABLED` | `false` | `false` for cloud zero-broker mode; `true` for Kafka |
| `DB_POOL_MAX` | `3` | Maximum connections per service (protects Render free DB limit) |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin for frontend requests |
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Frontend API endpoint pointing to Gateway |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
