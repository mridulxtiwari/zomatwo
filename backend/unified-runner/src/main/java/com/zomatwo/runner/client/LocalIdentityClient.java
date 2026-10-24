package com.zomatwo.runner.client;

import com.zomatwo.common.dto.CustomerAddressDto;
import com.zomatwo.identity.service.AddressService;
import com.zomatwo.order.client.IdentityFeignClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Direct in-memory replacement for IdentityFeignClient in single-JVM Unified Runner mode.
 * Eliminates HTTP serialization and network overhead by directly invoking AddressService.
 */
@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class LocalIdentityClient implements IdentityFeignClient {

    private final AddressService addressService;

    @Override
    public CustomerAddressDto getAddress(Long userId, Long addressId) {
        log.debug("In-memory dispatch: getAddress userId={}, addressId={}", userId, addressId);
        return addressService.getAddressByIdAndUser(addressId, userId);
    }
}
