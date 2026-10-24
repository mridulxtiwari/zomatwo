package com.zomatwo.common.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record InitiatePaymentRequest(
    @NotNull Long orderId,
    @NotNull Long customerId,
    @NotNull @Positive BigDecimal amount,
    String currency
) {}
