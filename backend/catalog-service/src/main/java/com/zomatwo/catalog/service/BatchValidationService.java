package com.zomatwo.catalog.service;

import com.zomatwo.catalog.entity.MenuItem;
import com.zomatwo.catalog.entity.Restaurant;
import com.zomatwo.catalog.repository.MenuItemRepository;
import com.zomatwo.catalog.repository.RestaurantRepository;
import com.zomatwo.common.dto.OrderItemValidationDto;
import com.zomatwo.common.dto.ValidateOrderItemsRequest;
import com.zomatwo.common.dto.ValidateOrderItemsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchValidationService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    @Transactional(readOnly = true)
    public ValidateOrderItemsResponse validateOrderItems(ValidateOrderItemsRequest request) {
        Restaurant restaurant = restaurantRepository.findByIdAndActiveTrue(request.restaurantId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        if (!restaurant.isOpen()) {
            return new ValidateOrderItemsResponse(
                false,
                restaurant.getName(),
                restaurant.getAddressLine(),
                false,
                List.of()
            );
        }

        List<Long> itemIds = request.items().stream()
            .map(OrderItemValidationDto::menuItemId)
            .toList();

        Map<Long, MenuItem> itemMap = menuItemRepository.findByIdInAndActiveTrue(itemIds).stream()
            .filter(item -> item.getRestaurant().getId().equals(restaurant.getId()))
            .collect(Collectors.toMap(MenuItem::getId, Function.identity()));

        boolean allAvailable = true;
        List<ValidateOrderItemsResponse.ValidatedItemDto> validatedList = new ArrayList<>();

        for (OrderItemValidationDto reqItem : request.items()) {
            MenuItem item = itemMap.get(reqItem.menuItemId());

            if (item == null || !item.isAvailable()) {
                allAvailable = false;
                validatedList.add(new ValidateOrderItemsResponse.ValidatedItemDto(
                    reqItem.menuItemId(),
                    item != null ? item.getName() : "Unknown Item",
                    item != null && item.isVeg(),
                    item != null ? item.getPrice() : BigDecimal.ZERO,
                    false,
                    reqItem.quantity(),
                    BigDecimal.ZERO
                ));
            } else {
                BigDecimal subtotal = item.getPrice().multiply(BigDecimal.valueOf(reqItem.quantity()));
                validatedList.add(new ValidateOrderItemsResponse.ValidatedItemDto(
                    item.getId(),
                    item.getName(),
                    item.isVeg(),
                    item.getPrice(),
                    true,
                    reqItem.quantity(),
                    subtotal
                ));
            }
        }

        return new ValidateOrderItemsResponse(
            true,
            restaurant.getName(),
            restaurant.getAddressLine(),
            allAvailable,
            validatedList
        );
    }
}
