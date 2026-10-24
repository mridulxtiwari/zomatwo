# Deploying Zomatwo on Render 🚀 (Free Tier Optimized)

This guide provides instructions for deploying the **Zomatwo Distributed Food Delivery Platform** to [Render](https://render.com) using your **single free PostgreSQL database** and staying 100% within Render's free tier.

---

## 💡 How Infra Constraints Were Adjusted for Render Free Tier

| Free Tier Constraint | Potential Issue | Solution Implemented |
|---|---|---|
| **Only 1 Free PostgreSQL DB** | 4 services needing their own databases | All 4 services share the single database `zomatwo`. Each service uses an isolated Flyway schema history table (`flyway_identity_history`, `flyway_catalog_history`, etc.). Zero table collisions. |
| **Max 20-25 DB Connections** | Multiple services opening default pools (10+ each = 50+) exceeds DB connection limit | Configured lightweight Hikari pools (`DB_POOL_MAX=3`, `DB_POOL_MIN=1`). All services combined use at most 12 connections. |
| **Render URL format vs JDBC** | Render provides `postgresql://user:pass@host/db`, but Java JDBC strictly rejects userinfo in URL | `infra/render-entrypoint.sh` automatically extracts credentials and converts the URL into `jdbc:postgresql://host:5432/db?sslmode=require`. |
| **512 MB Web Service RAM** | 6 JVM processes would normally exceed 512MB RAM | Configured `-XX:+UseSerialGC`, `-Xms20m -Xmx60m`, and `-Xss256k`. Total RSS for all 6 processes is only ~280MB. |
| **No Free Redis on Render** | Redis Key-Value costs $7/mo | Set `CACHE_TYPE=simple` (in-memory `ConcurrentMapCacheManager`) & in-memory SSE. Zero Redis dependency. |
| **No Kafka Broker on Render** | Apache Kafka requires dedicated cloud infrastructure | Set `KAFKA_ENABLED=false`. All direct transactions and in-memory SSE event streams run smoothly without a broker. |

---

## Your Render Database Details

- **Internal Database URL**: `postgresql://zomatwo_user:qMFY6aD0ARMZTvkxJ8Kp5cOPK597nr0t@dpg-dbeak00ae00c73cgr9og-a/zomatwo`
- **Database Name**: `zomatwo`
- **Username**: `zomatwo_user`
- **Password**: `qMFY6aD0ARMZTvkxJ8Kp5cOPK597nr0t`

---

## Deployment Steps (100% Free Tier)

### Step 1: Push Code to GitHub
Push the adjusted configuration to your GitHub repository:
```bash
git add .
git commit -m "feat: configure single free database and memory tuning for render"
git push origin main
```

---

### Step 2: Deploy Backend as Web Service
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect your GitHub repository `zomatwo`.
3. Set the following settings:
   - **Name**: `zomatwo-backend`
   - **Environment**: `Docker`
   - **Region**: Same region as your database (`Oregon`)
   - **Branch**: `main`
   - **Docker Context**: `.` (default root)
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `PORT` | `8080` | Render port binding |
   | `DATABASE_URL` | `postgresql://zomatwo_user:qMFY6aD0ARMZTvkxJ8Kp5cOPK597nr0t@dpg-dbeak00ae00c73cgr9og-a/zomatwo` | Your existing Render DB |
   | `DB_USERNAME` | `zomatwo_user` | DB Username |
   | `DB_PASSWORD` | `qMFY6aD0ARMZTvkxJ8Kp5cOPK597nr0t` | DB Password |
   | `CACHE_TYPE` | `simple` | In-memory caching (no Redis required) |
   | `KAFKA_ENABLED` | `false` | Cloud zero-broker mode |
   | `DB_POOL_MAX` | `3` | Connection pool limit for single DB |
   | `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit HMAC key |
   | `FRONTEND_URL` | `https://zomatwo-frontend.onrender.com` | Allowed CORS origin |
   | `RAZORPAY_KEY_ID` | `rzp_test_zomatwoKey123` | Razorpay mock ID |
   | `RAZORPAY_KEY_SECRET` | `sample_secret_key_mock_razorpay_signature` | Razorpay mock secret |
5. Click **Create Web Service**.
6. Render will build the Docker container, start the microservices, run Flyway migrations on your `zomatwo` database, and launch the Gateway.
7. Once deployed, copy your backend URL: e.g., `https://zomatwo-backend.onrender.com`.

---

### Step 3: Deploy Frontend as Static Site (Free)
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Static Site**.
2. Connect your GitHub repository `zomatwo`.
3. Set the following settings:
   - **Name**: `zomatwo-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**, add:
   ```env
   VITE_API_BASE_URL=https://zomatwo-backend.onrender.com/api/v1
   ```
5. Click **Create Static Site**.
6. Render will build and deploy the React application to Render's global CDN.

---

## Verifying the Deployment

1. **Test Backend Gateway Health**:
   ```bash
   curl https://zomatwo-backend.onrender.com/actuator/health
   # Expected response: {"status":"UP"}
   ```

2. **Test Restaurant Discovery API (Data from your database)**:
   ```bash
   curl https://zomatwo-backend.onrender.com/api/v1/restaurants
   # Expected response: JSON list of seeded Pune restaurants
   ```

3. **Open Frontend**:
   Navigate to `https://zomatwo-frontend.onrender.com` in your web browser.
   - Explore restaurants across Pune neighborhoods.
   - Register or Sign In with customer/partner credentials.
   - Add dishes to cart and test the checkout flow.
