package com.zomatwo.catalog.controller;

import com.zomatwo.catalog.dto.*;
import com.zomatwo.catalog.service.PartnerCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/partner/catalog")
@RequiredArgsConstructor
public class PartnerCatalogController {

    private final PartnerCatalogService partnerCatalogService;

    @PostMapping("/restaurants")
    public ResponseEntity<RestaurantSummaryDto> createRestaurant(
        @RequestHeader("X-User-Id") Long ownerId,
        @Valid @RequestBody CreateRestaurantRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            partnerCatalogService.createRestaurant(ownerId, request)
        );
    }

    @PostMapping("/restaurants/{id}/items")
    public ResponseEntity<MenuItemDto> addMenuItem(
        @RequestHeader("X-User-Id") Long ownerId,
        @PathVariable Long id,
        @Valid @RequestBody CreateMenuItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            partnerCatalogService.addMenuItem(ownerId, id, request)
        );
    }

    @PatchMapping("/items/{id}/availability")
    public ResponseEntity<MenuItemDto> toggleItemAvailability(
        @RequestHeader("X-User-Id") Long ownerId,
        @PathVariable Long id,
        @Valid @RequestBody ToggleAvailabilityRequest request
    ) {
        return ResponseEntity.ok(
            partnerCatalogService.toggleAvailability(ownerId, id, request.isAvailable())
        );
    }
}
