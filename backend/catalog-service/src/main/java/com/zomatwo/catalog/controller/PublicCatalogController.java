package com.zomatwo.catalog.controller;

import com.zomatwo.catalog.dto.RestaurantDetailDto;
import com.zomatwo.catalog.dto.RestaurantSummaryDto;
import com.zomatwo.catalog.service.MenuService;
import com.zomatwo.catalog.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
public class PublicCatalogController {

    private final RestaurantService restaurantService;
    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<Page<RestaurantSummaryDto>> getNearbyRestaurants(
        @RequestParam(defaultValue = "18.5514") double lat, // Default Kharadi, Pune
        @RequestParam(defaultValue = "73.9352") double lng,
        @RequestParam(defaultValue = "10.0") double radiusKm,
        @RequestParam(required = false) String cuisine,
        @RequestParam(required = false) BigDecimal minRating,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(restaurantService.getNearbyRestaurants(
            lat, lng, radiusKm, cuisine, minRating, page, size
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantDetailDto> getRestaurantMenu(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getRestaurantMenu(id));
    }
}
