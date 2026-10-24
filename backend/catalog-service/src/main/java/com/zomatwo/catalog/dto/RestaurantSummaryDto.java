package com.zomatwo.catalog.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public record RestaurantSummaryDto(
    Long id,
    Long ownerId,
    String name,
    String description,
    String cuisineTypes,
    String addressLine,
    String city,
    Double latitude,
    Double longitude,
    boolean isOpen,
    BigDecimal averageRating,
    int totalRatingsCount,
    int costForTwo,
    String imageUrl,
    Double distanceKm
) implements Serializable {}
