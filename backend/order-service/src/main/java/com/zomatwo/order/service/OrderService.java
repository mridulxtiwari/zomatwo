package com.zomatwo.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zomatwo.common.dto.CustomerAddressDto;
import com.zomatwo.common.dto.InitiatePaymentRequest;
import com.zomatwo.common.dto.InitiatePaymentResponse;
import com.zomatwo.common.dto.ValidateOrderItemsResponse.ValidatedItemDto;
import com.zomatwo.common.enums.OrderStatus;
import com.zomatwo.common.events.OrderCreatedEvent;
import com.zomatwo.common.events.OrderStatusChangedEvent;
import com.zomatwo.order.client.IdentityFeignClient;
import com.zomatwo.order.client.PaymentFeignClient;
import com.zomatwo.order.domain.*;
import com.zomatwo.order.dto.*;
import com.zomatwo.order.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final BillCalculationService billCalculationService;
    private final IdentityFeignClient identityFeignClient;
    private final PaymentFeignClient paymentFeignClient;
    private final ObjectMapper objectMapper;

    /**
     * Places an order within a clean database transaction, atomically writing to orders
     * and outbox_events tables.
     */
    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request, Long customerId, String idempotencyKey) {
        // 1. Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Idempotent request detected for key {}. Returning existing order {}", idempotencyKey, existing.get().getId());
                Order o = existing.get();
                return CreateOrderResponse.builder()
                    .orderId(o.getId())
                    .orderNumber(o.getOrderNumber())
                    .status(o.getStatus())
                    .grandTotal(o.getGrandTotal())
                    .gatewayOrderId("order_" + o.getOrderNumber().replace("-", "").substring(0, 14))
                    .currency("INR")
                    .keyId("rzp_test_mockKey")
                    .build();
            }
        }

        // 2. Fetch and serialize customer delivery address
        String addressJson;
        try {
            CustomerAddressDto addressDto = identityFeignClient.getAddress(customerId, request.getAddressId());
            addressJson = objectMapper.writeValueAsString(addressDto);
        } catch (Exception e) {
            log.warn("Could not fetch address via Feign for user {} address {}. Using fallback string.", customerId, request.getAddressId());
            addressJson = "{\"addressId\":" + request.getAddressId() + ",\"customerId\":" + customerId + "}";
        }

        // 3. Bill Calculation and item validation
        CalculateBillResponse bill = billCalculationService.calculateBill(
            CalculateBillRequest.builder()
                .restaurantId(request.getRestaurantId())
                .items(request.getItems())
                .couponCode(request.getCouponCode())
                .build(),
            customerId
        );

        // 4. Create Order Entity
        String orderNumber = UUID.randomUUID().toString();
        Order order = Order.builder()
            .orderNumber(orderNumber)
            .customerId(customerId)
            .restaurantId(request.getRestaurantId())
            .restaurantName(bill.getRestaurantName())
            .totalAmount(bill.getSubtotal())
            .discountAmount(bill.getDiscountAmount())
            .taxAmount(bill.getTaxAmount())
            .deliveryFee(bill.getDeliveryFee())
            .platformFee(bill.getPlatformFee())
            .grandTotal(bill.getGrandTotal())
            .status(OrderStatus.PAYMENT_PENDING)
            .deliveryAddressJson(addressJson)
            .deliveryInstructions(request.getDeliveryInstructions())
            .idempotencyKey(idempotencyKey)
            .build();

        // 5. Add Order Line Items
        for (ValidatedItemDto itemDto : bill.getItems()) {
            OrderItem orderItem = OrderItem.builder()
                .menuItemId(itemDto.menuItemId())
                .itemName(itemDto.name())
                .price(itemDto.price())
                .quantity(itemDto.quantity())
                .subtotal(itemDto.subtotal())
                .build();
            order.addItem(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        // 6. Atomic coupon redemption
        if (bill.isCouponValid() && bill.getAppliedCouponCode() != null) {
            couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(bill.getAppliedCouponCode()).ifPresent(coupon -> {
                couponRepository.incrementUsageCount(coupon.getCode());
                CouponRedemption redemption = CouponRedemption.builder()
                    .coupon(coupon)
                    .customerId(customerId)
                    .order(savedOrder)
                    .discountApplied(bill.getDiscountAmount())
                    .build();
                couponRedemptionRepository.save(redemption);
            });
        }

        // 7. Initiate payment transaction via PaymentFeignClient
        String gatewayOrderId = "order_" + orderNumber.replace("-", "").substring(0, 14);
        String keyId = "rzp_test_zomatwoKey123";
        try {
            InitiatePaymentResponse paymentResponse = paymentFeignClient.initiatePayment(new InitiatePaymentRequest(
                savedOrder.getId(),
                savedOrder.getCustomerId(),
                savedOrder.getGrandTotal(),
                "INR"
            ));
            if (paymentResponse != null && paymentResponse.gatewayOrderId() != null) {
                gatewayOrderId = paymentResponse.gatewayOrderId();
                if (paymentResponse.keyId() != null) {
                    keyId = paymentResponse.keyId();
                }
            }
        } catch (Exception e) {
            log.warn("Payment initiation via Feign client failed, using fallback gateway order id: {}", e.getMessage());
        }

        // 8. Write OrderCreatedEvent to Transactional Outbox
        try {
            OrderCreatedEvent createdEvent = new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getCustomerId(),
                savedOrder.getRestaurantId(),
                savedOrder.getGrandTotal(),
                gatewayOrderId,
                Instant.now()
            );

            OutboxEvent outbox = OutboxEvent.builder()
                .aggregateType("ORDER")
                .aggregateId(savedOrder.getId().toString())
                .eventType("OrderCreatedEvent")
                .payload(objectMapper.writeValueAsString(createdEvent))
                .status("PENDING")
                .build();

            outboxEventRepository.save(outbox);
        } catch (Exception e) {
            log.error("Failed to serialize OrderCreatedEvent for outbox", e);
            throw new RuntimeException("Could not record order outbox event", e);
        }

        return CreateOrderResponse.builder()
            .orderId(savedOrder.getId())
            .orderNumber(savedOrder.getOrderNumber())
            .status(savedOrder.getStatus())
            .grandTotal(savedOrder.getGrandTotal())
            .gatewayOrderId(gatewayOrderId)
            .currency("INR")
            .keyId(keyId)
            .build();
    }

    /**
     * Transition order status when payment confirmation arrives
     */
    @Transactional
    public void confirmPayment(Long orderId, String paymentId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        if (!previousStatus.canTransitionTo(OrderStatus.CONFIRMED)) {
            log.warn("Cannot transition order {} from {} to CONFIRMED", orderId, previousStatus);
            return;
        }

        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentId(paymentId);
        orderRepository.save(order);

        // Record status change event to outbox
        recordStatusChangedEvent(order, previousStatus, OrderStatus.CONFIRMED);
    }

    /**
     * Update order lifecycle status (e.g. from partner portal or delivery fleet)
     */
    @Transactional
    public void updateOrderStatus(Long orderId, OrderStatus targetStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        if (!previousStatus.canTransitionTo(targetStatus)) {
            throw new IllegalStateException("Illegal status transition from " + previousStatus + " to " + targetStatus);
        }

        order.setStatus(targetStatus);
        orderRepository.save(order);

        recordStatusChangedEvent(order, previousStatus, targetStatus);
    }

    private void recordStatusChangedEvent(Order order, OrderStatus previous, OrderStatus current) {
        try {
            OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                order.getId(),
                order.getCustomerId(),
                order.getRestaurantId(),
                previous,
                current,
                Instant.now()
            );

            OutboxEvent outbox = OutboxEvent.builder()
                .aggregateType("ORDER")
                .aggregateId(order.getId().toString())
                .eventType("OrderStatusChangedEvent")
                .payload(objectMapper.writeValueAsString(event))
                .status("PENDING")
                .build();

            outboxEventRepository.save(outbox);

            // Resilient push directly to realtime-service SSE broadcast
            pushStatusToRealtimeService(order.getId(), current.name());
        } catch (Exception e) {
            log.error("Failed to serialize OrderStatusChangedEvent", e);
        }
    }

    private void pushStatusToRealtimeService(Long orderId, String status) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String json = String.format("{\"orderId\":%d,\"currentStatus\":\"%s\",\"status\":\"%s\"}", orderId, status, status);
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("http://localhost:8085/api/v1/stream/orders/" + orderId + "/broadcast"))
                .header("Content-Type", "application/json")
                .timeout(java.time.Duration.ofMillis(1500))
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json))
                .build();
            client.sendAsync(req, java.net.http.HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            log.debug("Realtime SSE direct broadcast push skipped: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));
        return mapToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getActiveOrdersForRestaurant(Long restaurantId) {
        List<OrderStatus> activeStatuses = List.of(
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.OUT_FOR_DELIVERY
        );
        return orderRepository.findByRestaurantIdAndStatusInOrderByCreatedAtDesc(restaurantId, activeStatuses).stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    private OrderResponseDto mapToDto(Order order) {
        List<OrderResponseDto.OrderItemDto> itemDtos = order.getItems().stream()
            .map(i -> OrderResponseDto.OrderItemDto.builder()
                .id(i.getId())
                .menuItemId(i.getMenuItemId())
                .itemName(i.getItemName())
                .price(i.getPrice())
                .quantity(i.getQuantity())
                .subtotal(i.getSubtotal())
                .build())
            .collect(Collectors.toList());

        return OrderResponseDto.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .customerId(order.getCustomerId())
            .restaurantId(order.getRestaurantId())
            .restaurantName(order.getRestaurantName())
            .totalAmount(order.getTotalAmount())
            .discountAmount(order.getDiscountAmount())
            .taxAmount(order.getTaxAmount())
            .deliveryFee(order.getDeliveryFee())
            .platformFee(order.getPlatformFee())
            .grandTotal(order.getGrandTotal())
            .status(order.getStatus())
            .deliveryAddressJson(order.getDeliveryAddressJson())
            .deliveryInstructions(order.getDeliveryInstructions())
            .paymentId(order.getPaymentId())
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .items(itemDtos)
            .build();
    }
}
