package com.zomatwo.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateRestaurantRequest(
    @NotBlank String name,
    String description,
    @NotBlank String cuisineTypes,
    @NotBlank String addressLine,
    @NotBlank String city,
    @NotNull Double latitude,
    @NotNull Double longitude,
    @Positive int costForTwo,
    String imageUrl
) {}
