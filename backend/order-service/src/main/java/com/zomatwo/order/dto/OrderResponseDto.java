package com.zomatwo.order.dto;

import com.zomatwo.common.enums.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDto {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private Long restaurantId;
    private String restaurantName;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal deliveryFee;
    private BigDecimal platformFee;
    private BigDecimal grandTotal;
    private OrderStatus status;
    private String deliveryAddressJson;
    private String deliveryInstructions;
    private String paymentId;
    private Instant createdAt;
    private Instant updatedAt;
    private List<OrderItemDto> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDto {
        private Long id;
        private Long menuItemId;
        private String itemName;
        private BigDecimal price;
        private Integer quantity;
        private BigDecimal subtotal;
    }
}
