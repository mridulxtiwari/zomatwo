package com.zomatwo.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateMenuItemRequest(
    @NotBlank String name,
    String description,
    @NotNull @Positive BigDecimal price,
    @NotBlank String category,
    boolean isVeg,
    String imageUrl
) {}
