package com.zomatwo.catalog.controller;

import com.zomatwo.catalog.service.BatchValidationService;
import com.zomatwo.common.dto.ValidateOrderItemsRequest;
import com.zomatwo.common.dto.ValidateOrderItemsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/catalog")
@RequiredArgsConstructor
public class InternalCatalogController {

    private final BatchValidationService batchValidationService;

    @PostMapping("/validate-order-items")
    public ResponseEntity<ValidateOrderItemsResponse> validateOrderItems(
        @Valid @RequestBody ValidateOrderItemsRequest request
    ) {
        return ResponseEntity.ok(batchValidationService.validateOrderItems(request));
    }
}
