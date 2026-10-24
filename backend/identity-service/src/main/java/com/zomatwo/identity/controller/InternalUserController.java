package com.zomatwo.identity.controller;

import com.zomatwo.common.dto.CustomerAddressDto;
import com.zomatwo.identity.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final AddressService addressService;

    @GetMapping("/{userId}/addresses/{addressId}")
    public ResponseEntity<CustomerAddressDto> getInternalAddress(
        @PathVariable Long userId,
        @PathVariable Long addressId
    ) {
        return ResponseEntity.ok(addressService.getAddressByIdAndUser(addressId, userId));
    }
}
