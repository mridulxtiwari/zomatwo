package com.zomatwo.order.client;

import com.zomatwo.common.dto.InitiatePaymentRequest;
import com.zomatwo.common.dto.InitiatePaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service", url = "${app.services.payment-url}")
public interface PaymentFeignClient {

    @PostMapping("/internal/v1/payments/initiate")
    InitiatePaymentResponse initiatePayment(@RequestBody InitiatePaymentRequest request);
}
