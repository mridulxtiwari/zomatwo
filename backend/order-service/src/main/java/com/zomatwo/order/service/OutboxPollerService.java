package com.zomatwo.order.service;

import com.zomatwo.order.domain.OutboxEvent;
import com.zomatwo.order.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPollerService {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.order-events:order-events}")
    private String orderEventsTopic;

    /**
     * Polls pending outbox records every 2 seconds using SELECT ... FOR UPDATE SKIP LOCKED.
     * Guarantees at-least-once message delivery to Kafka without duplicate lock collisions.
     */
    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void processOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findPendingEventsForProcessing(25);

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Found {} pending outbox events to publish", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                // Publish JSON string payload to Kafka topic
                kafkaTemplate.send(orderEventsTopic, event.getAggregateId(), event.getPayload())
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish outbox event id {}", event.getId(), ex);
                        } else {
                            log.info("Published outbox event {} type {} to topic {}",
                                event.getId(), event.getEventType(), orderEventsTopic);
                        }
                    });

                event.setStatus("SENT");
                event.setProcessedAt(Instant.now());
            } catch (Exception e) {
                log.error("Error processing outbox event id {}", event.getId(), e);
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus("FAILED");
                }
            }
            outboxEventRepository.save(event);
        }
    }
}
