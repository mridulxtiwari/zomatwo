package com.zomatwo.common.dto;

import java.math.BigDecimal;

public record InitiatePaymentResponse(
    Long orderId,
    String gatewayOrderId,
    BigDecimal amount,
    String currency,
    String keyId
) {}
