package com.zomatwo.catalog.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public record MenuItemDto(
    Long id,
    String name,
    String description,
    BigDecimal price,
    String category,
    boolean isVeg,
    boolean isAvailable,
    String imageUrl
) implements Serializable {}
