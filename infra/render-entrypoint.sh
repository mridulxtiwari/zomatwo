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
# SerialGC has virtually zero memory overhead (< 2MB vs 60MB+ for G1GC)
# -------------------------------------------------------------
JVM_WORKER="-Xms20m -Xmx60m -XX:MaxMetaspaceSize=44m -XX:ReservedCodeCacheSize=20m -Xss256k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"
JVM_GATEWAY="-Xms28m -Xmx72m -XX:MaxMetaspaceSize=48m -XX:ReservedCodeCacheSize=24m -Xss256k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

echo "-> [1/6] Launching Identity Service (:8081)..."
PORT=8081 java $JVM_WORKER -jar /app/identity-service.jar > /dev/stdout 2>&1 &
PID_IDENTITY=$!
sleep 3

echo "-> [2/6] Launching Catalog Service (:8082)..."
PORT=8082 java $JVM_WORKER -jar /app/catalog-service.jar > /dev/stdout 2>&1 &
PID_CATALOG=$!
sleep 3

echo "-> [3/6] Launching Order Service (:8083)..."
PORT=8083 java $JVM_WORKER -jar /app/order-service.jar > /dev/stdout 2>&1 &
PID_ORDER=$!
sleep 3

echo "-> [4/6] Launching Payment Service (:8084)..."
PORT=8084 java $JVM_WORKER -jar /app/payment-service.jar > /dev/stdout 2>&1 &
PID_PAYMENT=$!
sleep 2

echo "-> [5/6] Launching Realtime SSE Service (:8085)..."
PORT=8085 java $JVM_WORKER -jar /app/realtime-service.jar > /dev/stdout 2>&1 &
PID_REALTIME=$!
sleep 2

echo "-> [6/6] Launching API Gateway on Render public port :${PORT}..."
PORT=${PORT} java $JVM_GATEWAY -jar /app/api-gateway.jar &
PID_GATEWAY=$!

# Trap signals for graceful shutdown
trap 'kill -TERM $PID_IDENTITY $PID_CATALOG $PID_ORDER $PID_PAYMENT $PID_REALTIME $PID_GATEWAY' SIGINT SIGTERM

echo "=========================================================="
echo " All Zomatwo microservices running on single free DB!"
echo " Public API Gateway listening on port :${PORT}"
echo "=========================================================="
wait -n $PID_GATEWAY $PID_IDENTITY $PID_CATALOG $PID_ORDER $PID_PAYMENT $PID_REALTIME
