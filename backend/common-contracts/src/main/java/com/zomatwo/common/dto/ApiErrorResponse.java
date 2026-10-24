package com.zomatwo.common.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Standard RFC 7807 ProblemDetail error response shape.
 */
public record ApiErrorResponse(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    Map<String, String> fieldErrors,
    Instant timestamp
) {
    public static ApiErrorResponse of(String title, int status, String detail, String instance) {
        return new ApiErrorResponse(
            "about:blank",
            title,
            status,
            detail,
            instance,
            null,
            Instant.now()
        );
    }

    public static ApiErrorResponse withFieldErrors(String title, int status, String detail, String instance, Map<String, String> errors) {
        return new ApiErrorResponse(
            "about:blank",
            title,
            status,
            detail,
            instance,
            errors,
            Instant.now()
        );
    }
}
