package com.zomatwo.payment.controller;

import com.zomatwo.payment.dto.VerifyPaymentRequest;
import com.zomatwo.payment.dto.VerifyPaymentResponse;
import com.zomatwo.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PublicPaymentController {

    private final PaymentService paymentService;

    @PostMapping("/verify")
    public ResponseEntity<VerifyPaymentResponse> verifyPayment(
        @RequestBody @Valid VerifyPaymentRequest request
    ) {
        VerifyPaymentResponse response = paymentService.verifyPayment(request);
        return ResponseEntity.ok(response);
    }
}
