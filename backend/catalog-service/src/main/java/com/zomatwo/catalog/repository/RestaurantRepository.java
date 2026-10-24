package com.zomatwo.catalog.repository;

import com.zomatwo.catalog.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    Optional<Restaurant> findByIdAndActiveTrue(Long id);

    /**
     * High-speed geospatial query combining Bounding-Box filtering via idx_restaurants_lat_lng
     * and exact Haversine spherical distance calculation.
     */
    @Query(value = """
        SELECT r.id AS id,
               r.owner_id AS ownerId,
               r.name AS name,
               r.description AS description,
               r.cuisine_types AS cuisineTypes,
               r.address_line AS addressLine,
               r.city AS city,
               r.latitude AS latitude,
               r.longitude AS longitude,
               r.is_open AS isOpen,
               r.average_rating AS averageRating,
               r.total_ratings_count AS totalRatingsCount,
               r.cost_for_two AS costForTwo,
               r.image_url AS imageUrl,
               (6371 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:userLat)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(:userLng)) +
                        sin(radians(:userLat)) * sin(radians(r.latitude))
                    ))
               )) AS distanceKm
        FROM restaurants r
        WHERE r.is_active = true
          AND r.latitude BETWEEN :minLat AND :maxLat
          AND r.longitude BETWEEN :minLng AND :maxLng
          AND (:cuisine IS NULL OR LOWER(r.cuisine_types) LIKE LOWER(CONCAT('%', :cuisine, '%')))
          AND (:minRating IS NULL OR r.average_rating >= :minRating)
          AND (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(:userLat)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(:userLng)) +
                    sin(radians(:userLat)) * sin(radians(r.latitude))
                ))
          )) <= :radiusKm
        ORDER BY r.is_open DESC, distanceKm ASC
        """,
        countQuery = """
        SELECT count(r.id)
        FROM restaurants r
        WHERE r.is_active = true
          AND r.latitude BETWEEN :minLat AND :maxLat
          AND r.longitude BETWEEN :minLng AND :maxLng
          AND (:cuisine IS NULL OR LOWER(r.cuisine_types) LIKE LOWER(CONCAT('%', :cuisine, '%')))
          AND (:minRating IS NULL OR r.average_rating >= :minRating)
          AND (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(:userLat)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(:userLng)) +
                    sin(radians(:userLat)) * sin(radians(r.latitude))
                ))
          )) <= :radiusKm
        """,
        nativeQuery = true)
    Page<RestaurantDistanceProjection> findNearbyRestaurants(
        @Param("userLat") double userLat,
        @Param("userLng") double userLng,
        @Param("minLat") double minLat,
        @Param("maxLat") double maxLat,
        @Param("minLng") double minLng,
        @Param("maxLng") double maxLng,
        @Param("radiusKm") double radiusKm,
        @Param("cuisine") String cuisine,
        @Param("minRating") BigDecimal minRating,
        Pageable pageable
    );
}
