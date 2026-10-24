package com.zomatwo.common.events;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Emitted by payment-service when Razorpay payment signature verification succeeds.
 */
public record PaymentSucceededEvent(
    Long orderId,
    Long customerId,
    String gatewayOrderId,
    String gatewayPaymentId,
    BigDecimal amount,
    Instant timestamp
) {}
