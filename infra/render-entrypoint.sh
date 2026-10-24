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
export DB_POOL_MAX="3"
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
COMMON_JVM_OPTS="-XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:CICompilerCount=2 -Xss228k -XX:ReservedCodeCacheSize=8m -XX:MaxMetaspaceSize=48m -XX:+ExitOnOutOfMemoryError"
COMMON_SPRING_OPTS="-Dserver.tomcat.threads.max=8 -Dserver.tomcat.threads.min-spare=2 -Dserver.tomcat.max-connections=20 -Dserver.tomcat.accept-count=10 -Dspring.data.redis.repositories.enabled=false -Djava.security.egd=file:/dev/./urandom"

JVM_GATEWAY="-Xms8m -Xmx20m $COMMON_JVM_OPTS"
JVM_LIGHT="-Xms8m -Xmx20m $COMMON_JVM_OPTS"
JVM_WORKER="-Xms12m -Xmx26m $COMMON_JVM_OPTS"

# Helper function to wait for a port to be listening
wait_for_port() {
    PORT_TO_CHECK=$1
    NAME=$2
    for i in $(seq 1 50); do
        if nc -z 127.0.0.1 "$PORT_TO_CHECK" 2>/dev/null || curl -s -f -m 1 "http://127.0.0.1:$PORT_TO_CHECK/actuator/health" >/dev/null 2>&1; then
            echo "   [✓] $NAME is ready and listening on port :$PORT_TO_CHECK"
            return 0
        fi
        sleep 1
    done
    echo "   [!] $NAME did not report ready on :$PORT_TO_CHECK within timeout, proceeding..."
    return 0
}

# -------------------------------------------------------------
# STEP 1: Launch API Gateway FIRST!
# Render tests $PORT immediately. Starting the Gateway first binds
# the public port within seconds, passing Render's port scan check!
# -------------------------------------------------------------
echo "-> [1/6] Launching API Gateway on Render public port :${PORT}..."
PORT=${PORT} java $JVM_GATEWAY $COMMON_SPRING_OPTS -jar /app/api-gateway.jar > /dev/stdout 2>&1 &
PID_GATEWAY=$!
wait_for_port "${PORT}" "API Gateway"

# -------------------------------------------------------------
# STEP 2-6: Launch downstream services sequentially
# Staggered startup prevents simultaneous CPU thrashing and
# peak JIT compilation memory spikes.
# -------------------------------------------------------------
echo "-> [2/6] Launching Identity Service (:8081)..."
PORT=8081 FLYWAY_TABLE=flyway_identity_history java $JVM_WORKER $COMMON_SPRING_OPTS -jar /app/identity-service.jar > /dev/stdout 2>&1 &
PID_IDENTITY=$!
wait_for_port 8081 "Identity Service"

echo "-> [3/6] Launching Catalog Service (:8082)..."
PORT=8082 FLYWAY_TABLE=flyway_catalog_history java $JVM_WORKER $COMMON_SPRING_OPTS -jar /app/catalog-service.jar > /dev/stdout 2>&1 &
PID_CATALOG=$!
wait_for_port 8082 "Catalog Service"

echo "-> [4/6] Launching Order Service (:8083)..."
PORT=8083 FLYWAY_TABLE=flyway_order_history java $JVM_WORKER $COMMON_SPRING_OPTS -jar /app/order-service.jar > /dev/stdout 2>&1 &
PID_ORDER=$!
wait_for_port 8083 "Order Service"

echo "-> [5/6] Launching Payment Service (:8084)..."
PORT=8084 FLYWAY_TABLE=flyway_payment_history java $JVM_WORKER $COMMON_SPRING_OPTS -jar /app/payment-service.jar > /dev/stdout 2>&1 &
PID_PAYMENT=$!
wait_for_port 8084 "Payment Service"

echo "-> [6/6] Launching Realtime SSE Service (:8085)..."
PORT=8085 java $JVM_LIGHT $COMMON_SPRING_OPTS -jar /app/realtime-service.jar > /dev/stdout 2>&1 &
PID_REALTIME=$!
wait_for_port 8085 "Realtime Service"

# Trap signals for graceful shutdown
trap 'kill -TERM $PID_GATEWAY $PID_IDENTITY $PID_CATALOG $PID_ORDER $PID_PAYMENT $PID_REALTIME' SIGINT SIGTERM

echo "=========================================================="
echo " All Zomatwo microservices running on single free DB!"
echo " Public API Gateway listening on port :${PORT}"
echo "=========================================================="
wait -n $PID_GATEWAY $PID_IDENTITY $PID_CATALOG $PID_ORDER $PID_PAYMENT $PID_REALTIME
