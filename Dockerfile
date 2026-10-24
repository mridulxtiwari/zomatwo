# ==============================================================
# All-in-One Multi-Service Dockerfile for Zomatwo on Render
# Allows running the full microservices suite on a single
# Render Web Service instance (Starter or Free tier friendly)
# ==============================================================
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Copy all reactor POMs
COPY backend/pom.xml .
COPY backend/common-contracts/pom.xml common-contracts/
COPY backend/api-gateway/pom.xml api-gateway/
COPY backend/identity-service/pom.xml identity-service/
COPY backend/catalog-service/pom.xml catalog-service/
COPY backend/order-service/pom.xml order-service/
COPY backend/payment-service/pom.xml payment-service/
COPY backend/realtime-service/pom.xml realtime-service/
COPY backend/unified-runner/pom.xml unified-runner/

# Copy all module source directories
COPY backend/common-contracts/src common-contracts/src
COPY backend/api-gateway/src api-gateway/src
COPY backend/identity-service/src identity-service/src
COPY backend/catalog-service/src catalog-service/src
COPY backend/order-service/src order-service/src
COPY backend/payment-service/src payment-service/src
COPY backend/realtime-service/src realtime-service/src
COPY backend/unified-runner/src unified-runner/src

# Build complete backend reactor in parallel
RUN mvn clean package -DskipTests -T 1.5C

# ==============================================================
# Production Runtime Stage
# ==============================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN apk add --no-cache curl bash postgresql-client

COPY --from=builder /build/unified-runner/target/unified-runner-*.jar /app/unified-runner.jar
COPY --from=builder /build/api-gateway/target/api-gateway-*-exec.jar /app/api-gateway.jar
COPY --from=builder /build/identity-service/target/identity-service-*-exec.jar /app/identity-service.jar
COPY --from=builder /build/catalog-service/target/catalog-service-*-exec.jar /app/catalog-service.jar
COPY --from=builder /build/order-service/target/order-service-*-exec.jar /app/order-service.jar
COPY --from=builder /build/payment-service/target/payment-service-*-exec.jar /app/payment-service.jar
COPY --from=builder /build/realtime-service/target/realtime-service-*-exec.jar /app/realtime-service.jar

COPY infra/render-entrypoint.sh /app/render-entrypoint.sh
RUN chmod +x /app/render-entrypoint.sh

ENV PORT=8080

EXPOSE ${PORT}

ENTRYPOINT ["/bin/sh", "/app/render-entrypoint.sh"]
