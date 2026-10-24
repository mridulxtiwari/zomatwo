package com.zomatwo.catalog.service;

import com.zomatwo.catalog.dto.CreateMenuItemRequest;
import com.zomatwo.catalog.dto.CreateRestaurantRequest;
import com.zomatwo.catalog.dto.MenuItemDto;
import com.zomatwo.catalog.dto.RestaurantSummaryDto;
import com.zomatwo.catalog.entity.MenuItem;
import com.zomatwo.catalog.entity.Restaurant;
import com.zomatwo.catalog.repository.MenuItemRepository;
import com.zomatwo.catalog.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartnerCatalogService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    @Transactional
    public RestaurantSummaryDto createRestaurant(Long ownerId, CreateRestaurantRequest request) {
        Restaurant restaurant = Restaurant.builder()
            .ownerId(ownerId)
            .name(request.name().trim())
            .description(request.description() != null ? request.description().trim() : null)
            .cuisineTypes(request.cuisineTypes().trim())
            .addressLine(request.addressLine().trim())
            .city(request.city().trim())
            .latitude(request.latitude())
            .longitude(request.longitude())
            .costForTwo(request.costForTwo())
            .imageUrl(request.imageUrl())
            .open(true)
            .active(true)
            .averageRating(BigDecimal.ZERO)
            .totalRatingsCount(0)
            .build();

        restaurant = restaurantRepository.save(restaurant);
        log.info("Restaurant created by owner {}: {}", ownerId, restaurant.getId());

        return new RestaurantSummaryDto(
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
    }

    @Transactional
    @CacheEvict(value = "menus", key = "#restaurantId")
    public MenuItemDto addMenuItem(Long ownerId, Long restaurantId, CreateMenuItemRequest request) {
        Restaurant restaurant = restaurantRepository.findByIdAndActiveTrue(restaurantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        if (!restaurant.getOwnerId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this restaurant");
        }

        MenuItem item = MenuItem.builder()
            .restaurant(restaurant)
            .name(request.name().trim())
            .description(request.description() != null ? request.description().trim() : null)
            .price(request.price())
            .category(request.category().trim())
            .veg(request.isVeg())
            .available(true)
            .active(true)
            .imageUrl(request.imageUrl())
            .build();

        item = menuItemRepository.save(item);
        log.info("Added menu item {} to restaurant {} and evicted Redis cache", item.getId(), restaurantId);

        return new MenuItemDto(
            item.getId(),
            item.getName(),
            item.getDescription(),
            item.getPrice(),
            item.getCategory(),
            item.isVeg(),
            item.isAvailable(),
            item.getImageUrl()
        );
    }

    @Transactional
    public MenuItemDto toggleAvailability(Long ownerId, Long itemId, boolean isAvailable) {
        MenuItem item = menuItemRepository.findById(itemId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

        if (!item.getRestaurant().getOwnerId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own the restaurant for this item");
        }

        item.setAvailable(isAvailable);
        menuItemRepository.save(item);

        // Evict cached menu for this restaurant
        evictMenuCache(item.getRestaurant().getId());
        log.info("Toggled availability for item {} to {}. Redis cache evicted.", itemId, isAvailable);

        return new MenuItemDto(
            item.getId(),
            item.getName(),
            item.getDescription(),
            item.getPrice(),
            item.getCategory(),
            item.isVeg(),
            item.isAvailable(),
            item.getImageUrl()
        );
    }

    @CacheEvict(value = "menus", key = "#restaurantId")
    public void evictMenuCache(Long restaurantId) {
        log.debug("Evicted Redis menu cache for restaurantId: {}", restaurantId);
    }
}
