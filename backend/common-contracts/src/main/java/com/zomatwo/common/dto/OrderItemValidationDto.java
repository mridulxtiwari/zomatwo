package com.zomatwo.common.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record OrderItemValidationDto(
    @NotNull Long menuItemId,
    @Positive int quantity
) {}
