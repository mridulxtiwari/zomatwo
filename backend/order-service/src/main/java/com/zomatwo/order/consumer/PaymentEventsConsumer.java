package com.zomatwo.order.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zomatwo.common.enums.OrderStatus;
import com.zomatwo.common.events.PaymentFailedEvent;
import com.zomatwo.common.events.PaymentSucceededEvent;
import com.zomatwo.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventsConsumer {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${app.kafka.topics.payment-events:payment-events}", groupId = "order-payment-events-group")
    public void handlePaymentEvent(String payload) {
        log.info("Order service received event from payment-events: {}", payload);
        try {
            if (payload.contains("gatewayPaymentId") || payload.contains("PaymentSucceededEvent")) {
                PaymentSucceededEvent event = objectMapper.readValue(payload, PaymentSucceededEvent.class);
                log.info("Processing PaymentSucceededEvent for order {}", event.orderId());
                orderService.confirmPayment(event.orderId(), event.gatewayPaymentId());
            } else if (payload.contains("failureReason") || payload.contains("PaymentFailedEvent")) {
                PaymentFailedEvent event = objectMapper.readValue(payload, PaymentFailedEvent.class);
                log.info("Processing PaymentFailedEvent for order {}. Cancelling order.", event.orderId());
                orderService.updateOrderStatus(event.orderId(), OrderStatus.CANCELLED);
            }
        } catch (Exception e) {
            log.error("Failed to deserialize and process payment event", e);
        }
    }
}
