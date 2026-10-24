package com.zomatwo.order.controller;

import com.zomatwo.order.dto.*;
import com.zomatwo.order.service.BillCalculationService;
import com.zomatwo.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final BillCalculationService billCalculationService;

    @PostMapping("/calculate-bill")
    public ResponseEntity<CalculateBillResponse> calculateBill(
        @RequestBody @Valid CalculateBillRequest request,
        @RequestHeader(value = "X-User-Id", required = false) Long customerId
    ) {
        CalculateBillResponse response = billCalculationService.calculateBill(request, customerId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<CreateOrderResponse> placeOrder(
        @RequestBody @Valid CreateOrderRequest request,
        @RequestHeader(value = "X-User-Id", defaultValue = "1") Long customerId,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        log.info("Received placeOrder request from customer {} with idempotencyKey {}", customerId, idempotencyKey);
        CreateOrderResponse response = orderService.createOrder(request, customerId, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDto> getOrderById(@PathVariable Long orderId) {
        OrderResponseDto order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/customer/me")
    public ResponseEntity<List<OrderResponseDto>> getMyOrders(
        @RequestHeader(value = "X-User-Id", defaultValue = "1") Long customerId
    ) {
        List<OrderResponseDto> orders = orderService.getOrdersByCustomer(customerId);
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<OrderResponseDto> confirmOrderPayment(
        @PathVariable Long orderId,
        @RequestParam(defaultValue = "mock_pay_success") String paymentId
    ) {
        log.info("Confirming payment for order {} with paymentId {}", orderId, paymentId);
        orderService.confirmPayment(orderId, paymentId);
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }
}
