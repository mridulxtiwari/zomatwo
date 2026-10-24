package com.zomatwo.identity.dto;

import com.zomatwo.common.enums.UserRole;

public record UserSummaryDto(
    Long id,
    String name,
    String email,
    String phone,
    UserRole role
) {}
