package com.zomatwo.runner.client;

import com.zomatwo.common.dto.InitiatePaymentRequest;
import com.zomatwo.common.dto.InitiatePaymentResponse;
import com.zomatwo.order.client.PaymentFeignClient;
import com.zomatwo.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Direct in-memory replacement for PaymentFeignClient in single-JVM Unified Runner mode.
 * Eliminates HTTP serialization and network overhead by directly invoking PaymentService.
 */
@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class LocalPaymentClient implements PaymentFeignClient {

    private final PaymentService paymentService;

    @Override
    public InitiatePaymentResponse initiatePayment(InitiatePaymentRequest request) {
        log.debug("In-memory dispatch: initiatePayment for orderId={}", request.orderId());
        return paymentService.initiatePayment(request);
    }
}
