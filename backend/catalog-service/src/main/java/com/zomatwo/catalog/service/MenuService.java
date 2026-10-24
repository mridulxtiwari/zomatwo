package com.zomatwo.catalog.service;

import com.zomatwo.catalog.dto.MenuCategoryGroupDto;
import com.zomatwo.catalog.dto.MenuItemDto;
import com.zomatwo.catalog.dto.RestaurantDetailDto;
import com.zomatwo.catalog.dto.RestaurantSummaryDto;
import com.zomatwo.catalog.entity.MenuItem;
import com.zomatwo.catalog.entity.Restaurant;
import com.zomatwo.catalog.repository.MenuItemRepository;
import com.zomatwo.catalog.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    /**
     * Retrieves restaurant details and categorized menu with Redis caching (key: menus::{id}).
     */
    @Cacheable(value = "menus", key = "#restaurantId")
    @Transactional(readOnly = true)
    public RestaurantDetailDto getRestaurantMenu(Long restaurantId) {
        log.info("Redis cache miss for restaurantId: {}. Querying database...", restaurantId);

        Restaurant restaurant = restaurantRepository.findByIdAndActiveTrue(restaurantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        List<MenuItem> items = menuItemRepository.findByRestaurantIdAndActiveTrueOrderByCategoryAscNameAsc(restaurantId);

        // Group items by category maintaining insertion order
        Map<String, List<MenuItemDto>> grouped = new LinkedHashMap<>();
        for (MenuItem item : items) {
            grouped.computeIfAbsent(item.getCategory(), k -> new ArrayList<>())
                .add(new MenuItemDto(
                    item.getId(),
                    item.getName(),
                    item.getDescription(),
                    item.getPrice(),
                    item.getCategory(),
                    item.isVeg(),
                    item.isAvailable(),
                    item.getImageUrl()
                ));
        }

        List<MenuCategoryGroupDto> categories = grouped.entrySet().stream()
            .map(e -> new MenuCategoryGroupDto(e.getKey(), e.getValue()))
            .toList();

        RestaurantSummaryDto summary = new RestaurantSummaryDto(
            restaurant.getId(),
            restaurant.getOwnerId(),
            restaurant.getName(),
            restaurant.getDescription(),
            restaurant.getCuisineTypes(),
            restaurant.getAddressLine(),
            restaurant.getCity(),
            restaurant.getLatitude(),
            restaurant.getLongitude(),
            restaurant.isOpen(),
            restaurant.getAverageRating(),
            restaurant.getTotalRatingsCount(),
            restaurant.getCostForTwo(),
            restaurant.getImageUrl(),
            0.0
        );

        return new RestaurantDetailDto(summary, categories);
    }
}
