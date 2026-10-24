package com.zomatwo.runner.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import javax.crypto.SecretKey;
import java.io.IOException;

@Configuration
@Slf4j
public class UnifiedWebConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter(@Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("https://*.onrender.com");
        config.addAllowedOriginPattern("https://*.vercel.app");
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            config.addAllowedOriginPattern(frontendUrl);
        }
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE + 1)
    public Filter jwtAuthFilter(@Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secretHex) {
        byte[] keyBytes = java.util.HexFormat.of().parseHex(secretHex);
        SecretKey signingKey = Keys.hmacShaKeyFor(keyBytes);

        return new Filter() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
                    throws IOException, ServletException {
                HttpServletRequest request = (HttpServletRequest) req;
                HttpServletResponse response = (HttpServletResponse) res;
                String path = request.getRequestURI();
                String method = request.getMethod();

                if ("OPTIONS".equalsIgnoreCase(method)) {
                    chain.doFilter(req, res);
                    return;
                }

                // Public endpoints that do not mandate authentication
                boolean isPublic = path.startsWith("/api/v1/auth/")
                        || path.startsWith("/api/v1/stream/")
                        || path.startsWith("/actuator/")
                        || path.startsWith("/internal/")
                        || (path.startsWith("/api/v1/restaurants") && "GET".equalsIgnoreCase(method));

                String authHeader = request.getHeader("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    if (isPublic) {
                        chain.doFilter(req, res);
                        return;
                    }
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(String.format(
                        "{\"type\":\"about:blank\",\"title\":\"Unauthorized\",\"status\":401,\"detail\":\"Missing or malformed Authorization header\",\"instance\":\"%s\"}",
                        path
                    ));
                    return;
                }

                String token = authHeader.substring(7);
                try {
                    Claims claims = Jwts.parser()
                            .verifyWith(signingKey)
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();

                    String userId = String.valueOf(claims.get("userId"));
                    String role = String.valueOf(claims.get("role"));

                    HeaderMapRequestWrapper wrappedRequest = new HeaderMapRequestWrapper(request);
                    wrappedRequest.addHeader("X-User-Id", userId);
                    wrappedRequest.addHeader("X-User-Role", role);

                    chain.doFilter(wrappedRequest, res);
                } catch (JwtException | IllegalArgumentException e) {
                    if (isPublic) {
                        chain.doFilter(req, res);
                        return;
                    }
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(String.format(
                        "{\"type\":\"about:blank\",\"title\":\"Unauthorized\",\"status\":401,\"detail\":\"Invalid or expired JWT token\",\"instance\":\"%s\"}",
                        path
                    ));
                }
            }
        };
    }
}
