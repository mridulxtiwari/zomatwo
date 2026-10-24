package com.zomatwo.identity.service;

import com.zomatwo.identity.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Date;
import java.util.HexFormat;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final SecureRandom secureRandom = new SecureRandom();

    public JwtService(
        @Value("${app.jwt.secret}") String secretHex,
        @Value("${app.jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs,
        @Value("${app.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs
    ) {
        byte[] keyBytes = HexFormat.of().parseHex(secretHex);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * Generates a 15-minute stateless JWT access token containing userId and role claims.
     */
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
            .subject(String.valueOf(user.getId()))
            .claim("userId", user.getId())
            .claim("role", user.getRole().name())
            .claim("email", user.getEmail())
            .claim("name", user.getName())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(signingKey)
            .compact();
    }

    /**
     * Generates a cryptographically secure 128-character random string for refresh tokens.
     */
    public String generateRawRefreshToken() {
        byte[] randomBytes = new byte[64];
        secureRandom.nextBytes(randomBytes);
        return HexFormat.of().formatHex(randomBytes);
    }

    /**
     * Computes the SHA-256 hash of a raw refresh token before database persistence.
     */
    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    /**
     * Parses and validates a JWT token, returning its claims.
     */
    public Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
