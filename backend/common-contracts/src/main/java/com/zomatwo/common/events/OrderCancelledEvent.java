package com.zomatwo.common.events;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Emitted when an order is cancelled or rejected, triggering compensation refunds in payment-service.
 */
public record OrderCancelledEvent(
    Long orderId,
    Long customerId,
    Long restaurantId,
    String reason,
    boolean refundRequired,
    BigDecimal refundAmount,
    Instant timestamp
) {}
