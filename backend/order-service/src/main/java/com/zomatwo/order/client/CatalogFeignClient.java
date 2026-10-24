package com.zomatwo.order.client;

import com.zomatwo.common.dto.ValidateOrderItemsRequest;
import com.zomatwo.common.dto.ValidateOrderItemsResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "catalog-service", url = "${app.services.catalog-url}")
public interface CatalogFeignClient {

    @PostMapping("/internal/v1/catalog/validate-order-items")
    ValidateOrderItemsResponse validateOrderItems(@RequestBody ValidateOrderItemsRequest request);
}
