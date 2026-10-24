package com.zomatwo.common.dto;

import java.math.BigDecimal;
import java.util.List;

public record ValidateOrderItemsResponse(
    boolean restaurantOpen,
    String restaurantName,
    String restaurantAddress,
    boolean allAvailable,
    List<ValidatedItemDto> validatedItems
) {
    public record ValidatedItemDto(
        Long menuItemId,
        String name,
        boolean isVeg,
        BigDecimal price,
        boolean isAvailable,
        int quantity,
        BigDecimal subtotal
    ) {}
}
