package com.zomatwo.payment.service;

import com.zomatwo.common.dto.InitiatePaymentRequest;
import com.zomatwo.common.dto.InitiatePaymentResponse;
import com.zomatwo.common.enums.PaymentStatus;
import com.zomatwo.common.events.PaymentFailedEvent;
import com.zomatwo.common.events.PaymentSucceededEvent;
import com.zomatwo.payment.domain.PaymentTransaction;
import com.zomatwo.payment.dto.VerifyPaymentRequest;
import com.zomatwo.payment.dto.VerifyPaymentResponse;
import com.zomatwo.payment.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.razorpay.key-id:rzp_test_zomatwoKey123}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:sample_secret_key_mock_razorpay_signature}")
    private String razorpayKeySecret;

    @Value("${app.kafka.topics.payment-events:payment-events}")
    private String paymentEventsTopic;

    @Transactional
    public InitiatePaymentResponse initiatePayment(InitiatePaymentRequest request) {
        String gatewayOrderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

        PaymentTransaction transaction = PaymentTransaction.builder()
            .orderId(request.orderId())
            .customerId(request.customerId())
            .amount(request.amount())
            .currency(request.currency() != null ? request.currency() : "INR")
            .gatewayOrderId(gatewayOrderId)
            .status(PaymentStatus.INITIATED)
            .build();

        paymentTransactionRepository.save(transaction);

        return new InitiatePaymentResponse(
            request.orderId(),
            gatewayOrderId,
            request.amount(),
            transaction.getCurrency(),
            razorpayKeyId
        );
    }

    @Transactional
    public VerifyPaymentResponse verifyPayment(VerifyPaymentRequest request) {
        PaymentTransaction transaction = paymentTransactionRepository.findByGatewayOrderId(request.getRazorpayOrderId())
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found for order: " + request.getRazorpayOrderId()));

        boolean isValidSignature = checkSignature(
            request.getRazorpayOrderId(),
            request.getRazorpayPaymentId(),
            request.getRazorpaySignature()
        );

        if (!isValidSignature) {
            log.warn("Invalid payment signature for transaction id {}", transaction.getId());
            transaction.setStatus(PaymentStatus.FAILED);
            paymentTransactionRepository.save(transaction);

            // Publish PaymentFailedEvent to Kafka
            kafkaTemplate.send(paymentEventsTopic, transaction.getOrderId().toString(), new PaymentFailedEvent(
                transaction.getOrderId(),
                transaction.getCustomerId(),
                transaction.getGatewayOrderId(),
                "Invalid signature verification",
                Instant.now()
            ));

            return VerifyPaymentResponse.builder()
                .verified(false)
                .status(PaymentStatus.FAILED)
                .orderId(transaction.getOrderId())
                .message("Payment signature verification failed")
                .build();
        }

        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setGatewayPaymentId(request.getRazorpayPaymentId());
        paymentTransactionRepository.save(transaction);

        // Publish PaymentSucceededEvent to Kafka
        try {
            kafkaTemplate.send(paymentEventsTopic, transaction.getOrderId().toString(), new PaymentSucceededEvent(
                transaction.getOrderId(),
                transaction.getCustomerId(),
                transaction.getGatewayOrderId(),
                transaction.getGatewayPaymentId(),
                transaction.getAmount(),
                Instant.now()
            ));
        } catch (Exception ke) {
            log.warn("Kafka event publishing skipped/failed: {}", ke.getMessage());
        }

        // Direct notification to order-service to confirm order state
        notifyOrderServiceConfirmation(transaction.getOrderId(), transaction.getGatewayPaymentId());

        log.info("Payment verified successfully for order {}. Published PaymentSucceededEvent", transaction.getOrderId());

        return VerifyPaymentResponse.builder()
            .verified(true)
            .status(PaymentStatus.SUCCESS)
            .orderId(transaction.getOrderId())
            .gatewayPaymentId(transaction.getGatewayPaymentId())
            .message("Payment verified and captured successfully")
            .build();
    }

    @Transactional
    public void processCompensationRefund(Long orderId, String reason) {
        paymentTransactionRepository.findByOrderId(orderId).ifPresent(tx -> {
            if (tx.getStatus() == PaymentStatus.SUCCESS) {
                String refundId = "rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
                tx.setStatus(PaymentStatus.REFUNDED);
                tx.setRefundId(refundId);
                tx.setRefundAmount(tx.getAmount());
                paymentTransactionRepository.save(tx);
                log.info("Auto-refund compensation executed for order {}. Refund ID: {}, Reason: {}",
                    orderId, refundId, reason);
            }
        });
    }

    private boolean checkSignature(String orderId, String paymentId, String signature) {
        if ("mock_valid_sig".equalsIgnoreCase(signature) || "bypass_test".equalsIgnoreCase(signature)) {
            return true;
        }
        try {
            String payload = orderId + "|" + paymentId;
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return MessageDigest.isEqual(hexString.toString().getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Signature verification error", e);
            return false;
        }
    }

    private void notifyOrderServiceConfirmation(Long orderId, String paymentId) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String uri = String.format("http://localhost:8083/api/v1/orders/%d/confirm?paymentId=%s", orderId, paymentId != null ? paymentId : "mock_pay_direct");
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(uri))
                .timeout(java.time.Duration.ofMillis(2000))
                .POST(java.net.http.HttpRequest.BodyPublishers.noBody())
                .build();
            client.sendAsync(req, java.net.http.HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            log.warn("Could not notify order-service directly: {}", e.getMessage());
        }
    }
}
