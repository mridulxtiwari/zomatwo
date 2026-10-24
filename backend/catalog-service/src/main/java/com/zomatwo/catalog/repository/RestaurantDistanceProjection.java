package com.zomatwo.catalog.repository;

import java.math.BigDecimal;
import java.time.Instant;

public interface RestaurantDistanceProjection {
    Long getId();
    Long getOwnerId();
    String getName();
    String getDescription();
    String getCuisineTypes();
    String getAddressLine();
    String getCity();
    Double getLatitude();
    Double getLongitude();
    Boolean getIsOpen();
    BigDecimal getAverageRating();
    Integer getTotalRatingsCount();
    Integer getCostForTwo();
    String getImageUrl();
    Double getDistanceKm();
}
