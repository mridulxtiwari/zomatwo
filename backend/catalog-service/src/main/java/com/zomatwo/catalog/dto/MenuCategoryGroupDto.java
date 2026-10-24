package com.zomatwo.catalog.dto;

import java.io.Serializable;
import java.util.List;

public record MenuCategoryGroupDto(
    String category,
    List<MenuItemDto> items
) implements Serializable {}
