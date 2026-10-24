package com.zomatwo.order.dto;

import com.zomatwo.common.enums.OrderStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderResponse {
    private Long orderId;
    private String orderNumber;
    private OrderStatus status;
    private BigDecimal grandTotal;
    private String gatewayOrderId;
    private String currency;
    private String keyId;
}
