package com.zomatwo.realtime.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zomatwo.common.events.OrderStatusChangedEvent;
import com.zomatwo.realtime.service.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaOrderEventsListener {

    private final SseEmitterRegistry sseEmitterRegistry;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${app.kafka.topics.order-events:order-events}", groupId = "realtime-order-consumer")
    public void onOrderEvent(String payload) {
        log.info("Realtime service received Kafka event: {}", payload);
        try {
            if (payload.contains("OrderStatusChangedEvent") || payload.contains("currentStatus")) {
                OrderStatusChangedEvent event = objectMapper.readValue(payload, OrderStatusChangedEvent.class);
                log.info("Broadcasting OrderStatusChangedEvent for order {} -> {}", event.orderId(), event.currentStatus());
                sseEmitterRegistry.broadcastStatus(event.orderId(), event);
            }
        } catch (Exception e) {
            log.warn("Could not deserialize event payload on order-events: {}", e.getMessage());
        }
    }
}
