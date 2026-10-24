package com.zomatwo.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAddressRequest(
    @NotBlank(message = "Label is required (e.g. Home, Work)")
    @Size(max = 30)
    String label,

    @NotBlank(message = "Full address is required")
    @Size(max = 300)
    String fullAddress,

    @Size(max = 150)
    String landmark,

    @NotNull(message = "Latitude is required")
    Double latitude,

    @NotNull(message = "Longitude is required")
    Double longitude,

    boolean isDefault
) {}
