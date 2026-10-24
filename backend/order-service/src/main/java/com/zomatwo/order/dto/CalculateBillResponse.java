package com.zomatwo.order.dto;

import com.zomatwo.common.dto.ValidateOrderItemsResponse.ValidatedItemDto;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculateBillResponse {
    private String restaurantName;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal deliveryFee;
    private BigDecimal platformFee;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;
    private String appliedCouponCode;
    private String couponMessage;
    private boolean couponValid;
    private List<ValidatedItemDto> items;
}
