package com.zomatwo.catalog.service;

import com.zomatwo.catalog.dto.RestaurantSummaryDto;
import com.zomatwo.catalog.repository.RestaurantDistanceProjection;
import com.zomatwo.catalog.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public Page<RestaurantSummaryDto> getNearbyRestaurants(
        double userLat,
        double userLng,
        double radiusKm,
        String cuisine,
        BigDecimal minRating,
        int page,
        int size
    ) {
        // Compute geographic bounding box (1 deg latitude ~ 111 km)
        double deltaLat = radiusKm / 111.0;
        double deltaLng = radiusKm / (111.0 * Math.cos(Math.toRadians(userLat)));

        double minLat = userLat - deltaLat;
        double maxLat = userLat + deltaLat;
        double minLng = userLng - deltaLng;
        double maxLng = userLng + deltaLng;

        Pageable pageable = PageRequest.of(page, size);

        Page<RestaurantDistanceProjection> results = restaurantRepository.findNearbyRestaurants(
            userLat, userLng, minLat, maxLat, minLng, maxLng, radiusKm,
            (cuisine != null && !cuisine.isBlank()) ? cuisine.trim() : null,
            minRating, pageable
        );

        return results.map(this::toSummaryDto);
    }

    private RestaurantSummaryDto toSummaryDto(RestaurantDistanceProjection p) {
        return new RestaurantSummaryDto(
            p.getId(),
            p.getOwnerId(),
            p.getName(),
            p.getDescription(),
            p.getCuisineTypes(),
            p.getAddressLine(),
            p.getCity(),
            p.getLatitude(),
            p.getLongitude(),
            Boolean.TRUE.equals(p.getIsOpen()),
            p.getAverageRating(),
            p.getTotalRatingsCount() != null ? p.getTotalRatingsCount() : 0,
            p.getCostForTwo() != null ? p.getCostForTwo() : 500,
            p.getImageUrl(),
            p.getDistanceKm() != null ? Math.round(p.getDistanceKm() * 10.0) / 10.0 : 0.0
        );
    }
}
