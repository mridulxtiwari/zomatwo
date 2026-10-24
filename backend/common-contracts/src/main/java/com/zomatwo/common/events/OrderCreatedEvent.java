package com.zomatwo.common.events;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Emitted when an order is first created in PAYMENT_PENDING state.
 */
public record OrderCreatedEvent(
    Long orderId,
    Long customerId,
    Long restaurantId,
    BigDecimal grandTotal,
    String gatewayOrderId,
    Instant createdAt
) {}
