package com.zomatwo.order.controller;

import com.zomatwo.common.enums.OrderStatus;
import com.zomatwo.order.dto.OrderResponseDto;
import com.zomatwo.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/partner")
@RequiredArgsConstructor
@Slf4j
public class PartnerOrderController {

    private final OrderService orderService;

    @GetMapping("/restaurants/{restaurantId}/orders")
    public ResponseEntity<List<OrderResponseDto>> getActiveOrders(@PathVariable Long restaurantId) {
        List<OrderResponseDto> orders = orderService.getActiveOrdersForRestaurant(restaurantId);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
        @PathVariable Long orderId,
        @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status field is required"));
        }

        OrderStatus targetStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        orderService.updateOrderStatus(orderId, targetStatus);
        return ResponseEntity.ok(Map.of(
            "orderId", orderId,
            "status", targetStatus,
            "message", "Order status updated successfully"
        ));
    }
}
