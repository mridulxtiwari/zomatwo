package com.zomatwo.common.dto;

import java.time.Instant;

public record CustomerAddressDto(
    Long id,
    Long userId,
    String label,
    String fullAddress,
    String landmark,
    Double latitude,
    Double longitude,
    boolean isDefault,
    Instant createdAt
) {}
