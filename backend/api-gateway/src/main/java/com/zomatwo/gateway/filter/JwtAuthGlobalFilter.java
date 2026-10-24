package com.zomatwo.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Slf4j
public class JwtAuthGlobalFilter implements GlobalFilter, Ordered {

    private final SecretKey signingKey;

    // Public endpoints that do not mandate a valid JWT
    private static final List<String> PUBLIC_PATH_PREFIXES = List.of(
        "/api/v1/auth/",
        "/api/v1/stream/",
        "/actuator/"
    );

    public JwtAuthGlobalFilter(@Value("${app.jwt.secret}") String secretHex) {
        byte[] keyBytes = java.util.HexFormat.of().parseHex(secretHex);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Defend against header spoofing: Always strip untrusted incoming X-User-* headers
        ServerHttpRequest.Builder requestBuilder = request.mutate()
            .headers(httpHeaders -> {
                httpHeaders.remove("X-User-Id");
                httpHeaders.remove("X-User-Role");
            });

        // 2. Check if route is public
        boolean isPublic = isPublicPath(path, request.getMethod().name());

        // 3. Extract Authorization Header
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (isPublic) {
                return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
            }
            return unauthorizedResponse(exchange, "Missing or malformed Authorization header");
        }

        String token = authHeader.substring(7);

        try {
            // 4. In-Memory HMAC-SHA256 signature and expiration check
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

            String userId = String.valueOf(claims.get("userId"));
            String role = String.valueOf(claims.get("role"));

            // 5. Inject trusted identity headers downstream
            requestBuilder
                .header("X-User-Id", userId)
                .header("X-User-Role", role);

            log.debug("JWT validated for path: {}. Injected X-User-Id: {}, X-User-Role: {}", path, userId, role);
            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());

        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token for path {}: {}", path, e.getMessage());
            if (isPublic) {
                return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
            }
            return unauthorizedResponse(exchange, "Invalid or expired JWT token");
        }
    }

    private boolean isPublicPath(String path, String method) {
        for (String prefix : PUBLIC_PATH_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        // Public restaurant discovery endpoints
        if (path.startsWith("/api/v1/restaurants") && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        return false;
    }

    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String detail) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String json = String.format(
            "{\"type\":\"about:blank\",\"title\":\"Unauthorized\",\"status\":401,\"detail\":\"%s\",\"instance\":\"%s\"}",
            detail, exchange.getRequest().getURI().getPath()
        );

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -100; // Run ahead of standard route filtering
    }
}
