package com.zomatwo.identity.service;

import com.zomatwo.identity.dto.*;
import com.zomatwo.identity.entity.RefreshToken;
import com.zomatwo.identity.entity.User;
import com.zomatwo.identity.repository.RefreshTokenRepository;
import com.zomatwo.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
        if (userRepository.existsByPhone(request.phone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number is already registered");
        }

        User user = User.builder()
            .name(request.name().trim())
            .email(request.email().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(request.password()))
            .phone(request.phone().trim())
            .role(request.role())
            .active(true)
            .build();

        user = userRepository.save(user);
        log.info("User registered successfully with id: {} and email: {}", user.getId(), user.getEmail());

        return createAuthSession(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is deactivated");
        }

        log.info("User logged in successfully with id: {}", user.getId());
        return createAuthSession(user);
    }

    @Transactional
    public AuthResponse refreshToken(String rawRefreshToken) {
        String tokenHash = jwtService.hashToken(rawRefreshToken);

        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        // Token Family Reuse Detection
        if (token.isRevoked() || token.getReplacedByHash() != null) {
            log.warn("Token reuse detected for family: {}. Revoking entire token family!", token.getFamilyId());
            refreshTokenRepository.revokeAllByFamilyId(token.getFamilyId());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token reuse detected. All sessions invalidated.");
        }

        if (token.isExpired()) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
        }

        User user = token.getUser();
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
        }

        // Rotate token within same family
        String newRawToken = jwtService.generateRawRefreshToken();
        String newHash = jwtService.hashToken(newRawToken);

        token.setReplacedByHash(newHash);
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        RefreshToken successor = RefreshToken.builder()
            .user(user)
            .familyId(token.getFamilyId())
            .tokenHash(newHash)
            .expiryDate(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()))
            .revoked(false)
            .build();
        refreshTokenRepository.save(successor);

        String newAccessToken = jwtService.generateAccessToken(user);
        return new AuthResponse(newAccessToken, newRawToken, toSummaryDto(user));
    }

    private AuthResponse createAuthSession(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRawRefreshToken();
        String tokenHash = jwtService.hashToken(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .familyId(UUID.randomUUID())
            .tokenHash(tokenHash)
            .expiryDate(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()))
            .revoked(false)
            .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, rawRefreshToken, toSummaryDto(user));
    }

    public UserSummaryDto toSummaryDto(User user) {
        return new UserSummaryDto(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole());
    }
}
