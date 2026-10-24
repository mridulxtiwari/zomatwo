package com.zomatwo.payment.dto;

import com.zomatwo.common.enums.PaymentStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyPaymentResponse {
    private boolean verified;
    private PaymentStatus status;
    private Long orderId;
    private String gatewayPaymentId;
    private String message;
}
