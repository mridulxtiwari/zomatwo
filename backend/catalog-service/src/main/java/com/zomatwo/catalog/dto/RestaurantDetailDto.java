package com.zomatwo.catalog.dto;

import java.io.Serializable;
import java.util.List;

public record RestaurantDetailDto(
    RestaurantSummaryDto restaurant,
    List<MenuCategoryGroupDto> categories
) implements Serializable {}
