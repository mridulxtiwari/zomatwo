package com.zomatwo.order.dto;

import com.zomatwo.common.dto.OrderItemValidationDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculateBillRequest {

    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    @NotEmpty(message = "Order items must not be empty")
    @Valid
    private List<OrderItemValidationDto> items;

    private String couponCode;
}
