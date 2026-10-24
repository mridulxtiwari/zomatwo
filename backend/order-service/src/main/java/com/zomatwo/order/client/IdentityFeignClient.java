package com.zomatwo.order.client;

import com.zomatwo.common.dto.CustomerAddressDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", url = "${app.services.identity-url}")
public interface IdentityFeignClient {

    @GetMapping("/internal/v1/users/{userId}/addresses/{addressId}")
    CustomerAddressDto getAddress(
        @PathVariable("userId") Long userId,
        @PathVariable("addressId") Long addressId
    );
}
