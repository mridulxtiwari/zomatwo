package com.zomatwo.identity.dto;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    UserSummaryDto user
) {}
