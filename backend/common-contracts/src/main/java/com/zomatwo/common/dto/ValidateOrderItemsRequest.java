package com.zomatwo.common.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ValidateOrderItemsRequest(
    @NotNull Long restaurantId,
    @NotEmpty @Valid List<OrderItemValidationDto> items
) {}
