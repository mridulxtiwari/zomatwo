package com.zomatwo.payment.controller;

import com.zomatwo.common.dto.InitiatePaymentRequest;
import com.zomatwo.common.dto.InitiatePaymentResponse;
import com.zomatwo.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/payments")
@RequiredArgsConstructor
public class InternalPaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<InitiatePaymentResponse> initiatePayment(
        @RequestBody @Valid InitiatePaymentRequest request
    ) {
        InitiatePaymentResponse response = paymentService.initiatePayment(request);
        return ResponseEntity.ok(response);
    }
}
