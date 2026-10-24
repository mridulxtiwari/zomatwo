package com.zomatwo.common.events;

import java.time.Instant;

/**
 * Emitted by payment-service when payment verification fails or expires.
 */
public record PaymentFailedEvent(
    Long orderId,
    Long customerId,
    String gatewayOrderId,
    String failureReason,
    Instant timestamp
) {}
