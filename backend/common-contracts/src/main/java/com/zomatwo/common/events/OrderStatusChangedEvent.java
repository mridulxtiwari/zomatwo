package com.zomatwo.common.events;

import com.zomatwo.common.enums.OrderStatus;
import java.time.Instant;

/**
 * Emitted when an order transitions between lifecycle statuses.
 */
public record OrderStatusChangedEvent(
    Long orderId,
    Long customerId,
    Long restaurantId,
    OrderStatus previousStatus,
    OrderStatus currentStatus,
    Instant timestamp
) {}
