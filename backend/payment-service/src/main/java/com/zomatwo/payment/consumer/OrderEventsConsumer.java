package com.zomatwo.payment.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zomatwo.common.events.OrderCancelledEvent;
import com.zomatwo.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventsConsumer {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${app.kafka.topics.order-events:order-events}", groupId = "payment-order-consumer")
    public void handleOrderEvent(String payload) {
        try {
            if (payload.contains("OrderCancelledEvent") || payload.contains("refundRequired")) {
                OrderCancelledEvent event = objectMapper.readValue(payload, OrderCancelledEvent.class);
                if (event.refundRequired()) {
                    log.info("Received OrderCancelledEvent for order {}. Triggering auto-refund.", event.orderId());
                    paymentService.processCompensationRefund(event.orderId(), event.reason());
                }
            }
        } catch (Exception e) {
            log.debug("Event received on order-events is not a cancellable refund event or parse skipped: {}", e.getMessage());
        }
    }
}
