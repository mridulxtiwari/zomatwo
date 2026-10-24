package com.zomatwo.runner.client;

import com.zomatwo.catalog.service.BatchValidationService;
import com.zomatwo.common.dto.ValidateOrderItemsRequest;
import com.zomatwo.common.dto.ValidateOrderItemsResponse;
import com.zomatwo.order.client.CatalogFeignClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Direct in-memory replacement for CatalogFeignClient in single-JVM Unified Runner mode.
 * Eliminates HTTP serialization and network overhead by directly invoking BatchValidationService.
 */
@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class LocalCatalogClient implements CatalogFeignClient {

    private final BatchValidationService batchValidationService;

    @Override
    public ValidateOrderItemsResponse validateOrderItems(ValidateOrderItemsRequest request) {
        log.debug("In-memory dispatch: validateOrderItems for restaurant {}", request.restaurantId());
        return batchValidationService.validateOrderItems(request);
    }
}
