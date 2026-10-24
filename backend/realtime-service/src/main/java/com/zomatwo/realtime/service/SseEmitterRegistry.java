package com.zomatwo.realtime.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseEmitterRegistry {

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emittersByOrderId = new ConcurrentHashMap<>();

    /**
     * Registers a new Server-Sent Events client connection for a specific order.
     */
    public SseEmitter registerEmitter(Long orderId) {
        // 15-minute connection timeout (900,000 ms)
        SseEmitter emitter = new SseEmitter(900_000L);

        emittersByOrderId.computeIfAbsent(orderId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> {
            CopyOnWriteArrayList<SseEmitter> list = emittersByOrderId.get(orderId);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) {
                    emittersByOrderId.remove(orderId);
                }
            }
            log.debug("Cleaned up SSE emitter for orderId: {}", orderId);
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        // Send initial handshake message
        try {
            emitter.send(SseEmitter.event()
                .name("INIT")
                .data("{\"message\":\"SSE live tracking connected\",\"orderId\":" + orderId + "}"));
            log.info("Client connected to SSE tracking stream for order {}", orderId);
        } catch (IOException e) {
            cleanup.run();
        }

        return emitter;
    }

    /**
     * Broadcasts order status update to all connected clients listening to this order.
     */
    public void broadcastStatus(Long orderId, Object payload) {
        CopyOnWriteArrayList<SseEmitter> list = emittersByOrderId.get(orderId);
        if (list == null || list.isEmpty()) {
            log.debug("No active SSE listeners for orderId: {}", orderId);
            return;
        }

        log.info("Broadcasting status update to {} client(s) for orderId: {}", list.size(), orderId);

        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                    .name("ORDER_STATUS")
                    .data(payload));
            } catch (Exception e) {
                log.warn("Failed to send SSE event to emitter for order {}. Removing.", orderId);
                list.remove(emitter);
            }
        }
    }

    /**
     * Keep-alive ping comments every 15 seconds to prevent gateway & browser idle timeouts.
     */
    @Scheduled(fixedRate = 15000)
    public void sendHeartbeats() {
        if (emittersByOrderId.isEmpty()) {
            return;
        }

        emittersByOrderId.forEach((orderId, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("keep-alive"));
                } catch (Exception e) {
                    list.remove(emitter);
                }
            }
        });
    }
}
