# ==============================================================
# Dockerfile for Zomatwo Payment Service
# Build Context: ./backend
# ==============================================================
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Copy reactor POMs for dependency resolution & caching
COPY pom.xml .
COPY common-contracts/pom.xml common-contracts/
COPY api-gateway/pom.xml api-gateway/
COPY identity-service/pom.xml identity-service/
COPY catalog-service/pom.xml catalog-service/
COPY order-service/pom.xml order-service/
COPY payment-service/pom.xml payment-service/
COPY realtime-service/pom.xml realtime-service/

# Copy source code for common-contracts and payment-service
COPY common-contracts/src common-contracts/src
COPY payment-service/src payment-service/src

# Build artifact
RUN mvn clean package -DskipTests -pl common-contracts,payment-service -am

# ==============================================================
# Runtime Stage
# ==============================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /build/payment-service/target/payment-service-*.jar app.jar

ENV PORT=8084 \
    JAVA_OPTS="-Xms128m -Xmx384m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

EXPOSE ${PORT}

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]
