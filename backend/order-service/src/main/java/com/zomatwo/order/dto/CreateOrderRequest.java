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
public class CreateOrderRequest {

    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    @NotNull(message = "Address ID is required")
    private Long addressId;

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<OrderItemValidationDto> items;

    private String couponCode;

    private String deliveryInstructions;
}
