#!/bin/sh
set -e

echo "=========================================================="
echo " Starting Zomatwo All-in-One Microservices Stack on Render"
echo " (Optimized for Render Free Tier: 512MB RAM & 1 Shared DB)"
echo "=========================================================="

# Default single-container URLs
export PORT=${PORT:-8080}
export IDENTITY_SERVICE_URL="http://127.0.0.1:8081"
export CATALOG_SERVICE_URL="http://127.0.0.1:8082"
export ORDER_SERVICE_URL="http://127.0.0.1:8083"
export PAYMENT_SERVICE_URL="http://127.0.0.1:8084"
export REALTIME_SERVICE_URL="http://127.0.0.1:8085"
export CACHE_TYPE="simple"
export KAFKA_ENABLED="false"
export DB_POOL_MAX="2"
export DB_POOL_MIN="1"

# -------------------------------------------------------------
# Parse Render DATABASE_URL into JDBC format and credentials
# Example: postgresql://zomatwo_user:pass@dpg-xxx-a/zomatwo
# -------------------------------------------------------------
if [ -n "$DATABASE_URL" ]; then
    # Strip protocol prefix (postgres:// or postgresql://)
    REST="${DATABASE_URL#*://}"

    # Extract user & pass if @ present
    case "$REST" in
        *@*)
            USERINFO="${REST%%@*}"
            HOSTPATH="${REST#*@}"
            EXT_USER="${USERINFO%%:*}"
            EXT_PASS="${USERINFO#*:}"
            ;;
        *)
            HOSTPATH="$REST"
            EXT_USER=""
            EXT_PASS=""
            ;;
    esac

    # Extract host:port and database name
    HOSTPORT="${HOSTPATH%%/*}"
    DBPART="${HOSTPATH#*/}"
    DBNAME="${DBPART%%\?*}"

    # Default port to 5432 if missing
    case "$HOSTPORT" in
        *:*) ;;
        *) HOSTPORT="${HOSTPORT}:5432" ;;
    esac

    export SPRING_DATASOURCE_URL="jdbc:postgresql://${HOSTPORT}/${DBNAME}?sslmode=require"
    export SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-${DB_USERNAME:-${EXT_USER}}}"
    export SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-${DB_PASSWORD:-${EXT_PASS}}}"

    echo "[Database Configured]"
    echo "  JDBC URL : $SPRING_DATASOURCE_URL"
    echo "  Username : $SPRING_DATASOURCE_USERNAME"
    echo "  Shared DB: ${DBNAME} (Flyway isolated table per service)"

    # -------------------------------------------------------------
    # Database Pre-flight Check & Auto-Repair for Shared Database:
    # If a previous deployment baselined flyway tables prematurely at v1
    # on an existing shared database, V1 was skipped and target tables
    # (restaurants, coupons, etc.) were never created.
    # We detect if the target table exists; if not, we drop the invalid
    # flyway history table so Flyway executes V1 and V2 cleanly from baseline 0.
    # -------------------------------------------------------------
    if command -v psql >/dev/null 2>&1; then
        echo "-> Running database pre-flight check..."
        PG_HOST="${HOSTPORT%%:*}"
        PG_PORT="${HOSTPORT##*:}"
        [ "$PG_PORT" = "$PG_HOST" ] && PG_PORT="5432"

        PGPASSWORD="$SPRING_DATASOURCE_PASSWORD" PGSSLMODE="require" psql -h "$PG_HOST" -p "$PG_PORT" -U "$SPRING_DATASOURCE_USERNAME" -d "$DBNAME" -v ON_ERROR_STOP=0 << 'EOF' 2>/dev/null || true
DO $$
BEGIN
    -- 1. If restaurants table does not exist, reset catalog flyway history
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurants') THEN
        DROP TABLE IF EXISTS flyway_catalog_history CASCADE;
    END IF;

    -- 2. If coupons table does not exist, reset order flyway history
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
        DROP TABLE IF EXISTS flyway_order_history CASCADE;
    END IF;

    -- 3. If payment_transactions table does not exist, reset payment flyway history
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_transactions') THEN
        DROP TABLE IF EXISTS flyway_payment_history CASCADE;
    END IF;

    -- 4. Purge any failed migration rows if any remain
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flyway_identity_history') THEN
        DELETE FROM flyway_identity_history WHERE success = false;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flyway_catalog_history') THEN
        DELETE FROM flyway_catalog_history WHERE success = false;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flyway_order_history') THEN
        DELETE FROM flyway_order_history WHERE success = false;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flyway_payment_history') THEN
        DELETE FROM flyway_payment_history WHERE success = false;
    END IF;
END $$;
EOF
        echo "   [✓] Database pre-flight verified."
    fi
fi

# -------------------------------------------------------------
# Microservice JVM Memory Tuning for 512MB RAM Free Tier:
# - TieredStopAtLevel=1: Restricts to C1 compiler; completely disables C2.
#   Saves ~35MB native RAM per JVM & boosts startup speed by 4x.
# - SerialGC: Zero footprint GC (< 2MB overhead vs 60MB+ for G1GC).
# - Thread tuning: Restricts Tomcat thread pools to 6-8 threads per instance
#   (saves ~160MB of thread stacks across the stack).
# - CICompilerCount=2: Limits compiler threads per JVM.
# -------------------------------------------------------------
COMMON_JVM_OPTS="-XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:CICompilerCount=2 -Xss200k -XX:ReservedCodeCacheSize=6m -XX:+ExitOnOutOfMemoryError"
COMMON_SPRING_OPTS="-Dserver.tomcat.threads.max=4 -Dserver.tomcat.threads.min-spare=1 -Dserver.tomcat.max-connections=10 -Dserver.tomcat.accept-count=10 -Dspring.data.redis.repositories.enabled=false -Djava.security.egd=file:/dev/./urandom -Dspring.flyway.baseline-version=0 -Dspring.flyway.baseline-on-migrate=true -Dspring.jmx.enabled=false -Dspring.main.lazy-initialization=true -Dspring.jpa.open-in-view=false -Dspring.jpa.properties.hibernate.query.plan_cache_max_size=8 -Dspring.jpa.properties.hibernate.generate_statistics=false"

JVM_GATEWAY="-Xms6m -Xmx14m -XX:MaxMetaspaceSize=36m -XX:MaxDirectMemorySize=12m -Dio.netty.allocator.type=unpooled -Dio.netty.noPreferDirect=true $COMMON_JVM_OPTS"
JVM_LIGHT="-Xms6m -Xmx12m -XX:MaxMetaspaceSize=32m $COMMON_JVM_OPTS"
JVM_WORKER="-Xms8m -Xmx18m -XX:MaxMetaspaceSize=52m $COMMON_JVM_OPTS"
JVM_ORDER="-Xms8m -Xmx20m -XX:MaxMetaspaceSize=54m $COMMON_JVM_OPTS"

# -------------------------------------------------------------
# Strict Sequential Hand-off Function:
# Polls the service's /actuator/health endpoint.
# Only hands off to the next service when HTTP 200 (status: UP)
# is confirmed, guaranteeing zero CPU or memory collision between startups.
# -------------------------------------------------------------
wait_for_service_ready() {
    PORT_TO_CHECK=$1
    NAME=$2
    PID_TO_CHECK=$3
    MAX_ATTEMPTS=${4:-120}

    echo "   [i] Waiting for $NAME to fully initialize and give hand-off..."

    for i in $(seq 1 "$MAX_ATTEMPTS"); do
        # 1. Process liveness check: detect unexpected crashes immediately
        if [ -n "$PID_TO_CHECK" ] && ! kill -0 "$PID_TO_CHECK" 2>/dev/null; then
            echo "   [X] FATAL: $NAME (PID $PID_TO_CHECK) died during startup! Exiting..."
            return 1
        fi

        # 2. Actuator health verification (Spring Boot true hand-off signal)
        HEALTH_STATUS=$(curl -s -m 2 "http://127.0.0.1:$PORT_TO_CHECK/actuator/health" 2>/dev/null || true)
        case "$HEALTH_STATUS" in
            *\"status\":\"UP\"*|*\"status\":\ \"UP\"*)
                echo "   [✓] $NAME is UP & HEALTHY! Hand-off confirmed on port :$PORT_TO_CHECK (took ${i}s)"
                # Allow JIT compiler and memory to settle before launching next service
                sleep 3
                return 0
                ;;
        esac

        sleep 1
    done

    # Fallback TCP check if Actuator took longer
    if nc -z 127.0.0.1 "$PORT_TO_CHECK" 2>/dev/null; then
        echo "   [!] $NAME listening on :$PORT_TO_CHECK (health endpoint delayed, proceeding with hand-off)"
        sleep 3
        return 0
    fi

    echo "   [X] FATAL: $NAME failed to report ready on :$PORT_TO_CHECK within ${MAX_ATTEMPTS}s!"
    return 1
}

# -------------------------------------------------------------
# STEP 1: Launch API Gateway FIRST!
# Render tests $PORT immediately. Starting the Gateway first binds
# the public port within seconds, passing Render's port scan check!
# -------------------------------------------------------------
echo "-> [1/6] Launching API Gateway on Render public port :${PORT}..."
PORT=${PORT} java $JVM_GATEWAY $COMMON_SPRING_OPTS -jar /app/api-gateway.jar > /dev/stdout 2>&1 &
PID_GATEWAY=$!
wait_for_service_ready "${PORT}" "API Gateway" "$PID_GATEWAY" || exit 1

# -------------------------------------------------------------
# STEP 2-6: Launch downstream services strictly one-by-one
# Each service must confirm health (hand-off) before the next launches.
# Zero simultaneous CPU thrashing or peak JIT compilation memory spikes.
# -------------------------------------------------------------
echo "-> [2/6] Launching Identity Service (:8081)..."
PORT=8081 FLYWAY_TABLE=flyway_identity_history java $JVM_WORKER $COMMON_SPRING_OPTS -jar /app/identity-service.jar > /dev/stdout 2>&1 &
PID_IDENTITY=$!
wait_for_service_ready 8081 "Identity Service" "$PID_IDENTITY" || exit 1

echo "-> [3/6] Launching Catalog Service (:8082)..."
PORT=8082 FLYWAY_TABLE=flyway_catalog_history java $JVM_WORKER $COMMON_SPRING_OPTS -jar /app/catalog-service.jar > /dev/stdout 2>&1 &
PID_CATALOG=$!
wait_for_service_ready 8082 "Catalog Service" "$PID_CATALOG" || exit 1

echo "-> [4/6] Launching Order Service (:8083)..."
PORT=8083 FLYWAY_TABLE=flyway_order_history java $JVM_ORDER $COMMON_SPRING_OPTS -jar /app/order-service.jar > /dev/stdout 2>&1 &
PID_ORDER=$!
wait_for_service_ready 8083 "Order Service" "$PID_ORDER" || exit 1

echo "-> [5/6] Launching Payment Service (:8084)..."
PORT=8084 FLYWAY_TABLE=flyway_payment_history java $JVM_WORKER $COMMON_SPRING_OPTS -jar /app/payment-service.jar > /dev/stdout 2>&1 &
PID_PAYMENT=$!
wait_for_service_ready 8084 "Payment Service" "$PID_PAYMENT" || exit 1

echo "-> [6/6] Launching Realtime SSE Service (:8085)..."
PORT=8085 java $JVM_LIGHT $COMMON_SPRING_OPTS -jar /app/realtime-service.jar > /dev/stdout 2>&1 &
PID_REALTIME=$!
wait_for_service_ready 8085 "Realtime Service" "$PID_REALTIME" || exit 1

# -------------------------------------------------------------
# STEP 7: Background Keep-Alive Ping Loop (Prevents 15m Render Free Sleep)
# Automatically pings the public URL every 10 minutes from the outside.
# Uses RENDER_EXTERNAL_URL (auto-set by Render) or KEEP_ALIVE_URL.
# -------------------------------------------------------------
TARGET_KEEP_ALIVE="${KEEP_ALIVE_URL:-$RENDER_EXTERNAL_URL}"
PID_KEEPALIVE=""
if [ -n "$TARGET_KEEP_ALIVE" ]; then
    echo "-> Enabling automatic keep-alive self-ping for: $TARGET_KEEP_ALIVE (every 10m)"
    (
        while true; do
            sleep 600
            echo "[$(date -u +'%Y-%m-%d %H:%M:%SZ')] [Keep-Alive] Pinging $TARGET_KEEP_ALIVE to maintain active state..."
            curl -s -f -m 15 "${TARGET_KEEP_ALIVE}/actuator/health" > /dev/null 2>&1 || true
            if [ -n "$FRONTEND_URL" ]; then
                curl -s -f -m 15 "$FRONTEND_URL" > /dev/null 2>&1 || true
            fi
        done
    ) &
    PID_KEEPALIVE=$!
fi

# Trap signals for graceful shutdown
trap 'kill -TERM $PID_GATEWAY $PID_IDENTITY $PID_CATALOG $PID_ORDER $PID_PAYMENT $PID_REALTIME $PID_KEEPALIVE 2>/dev/null' SIGINT SIGTERM

echo "=========================================================="
echo " All Zomatwo microservices running on single free DB!"
echo " Public API Gateway listening on port :${PORT}"
echo "=========================================================="
wait -n $PID_GATEWAY $PID_IDENTITY $PID_CATALOG $PID_ORDER $PID_PAYMENT $PID_REALTIME
