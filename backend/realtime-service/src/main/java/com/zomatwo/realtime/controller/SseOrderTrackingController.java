package com.zomatwo.realtime.controller;

import com.zomatwo.realtime.service.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/stream")
@RequiredArgsConstructor
@Slf4j
public class SseOrderTrackingController {

    private final SseEmitterRegistry sseEmitterRegistry;

    @GetMapping(value = "/orders/{orderId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamOrderUpdates(@PathVariable Long orderId) {
        log.info("Client subscribed to SSE live stream for orderId: {}", orderId);
        return sseEmitterRegistry.registerEmitter(orderId);
    }

    @PostMapping("/orders/{orderId}/broadcast")
    public org.springframework.http.ResponseEntity<Void> broadcastOrderUpdate(
        @PathVariable Long orderId,
        @RequestBody java.util.Map<String, Object> payload
    ) {
        log.info("Received direct broadcast update for orderId {}: {}", orderId, payload);
        sseEmitterRegistry.broadcastStatus(orderId, payload);
        return org.springframework.http.ResponseEntity.ok().build();
    }
}
