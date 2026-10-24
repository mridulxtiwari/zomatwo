package com.zomatwo.catalog.dto;

import jakarta.validation.constraints.NotNull;

public record ToggleAvailabilityRequest(
    @NotNull Boolean isAvailable
) {}
