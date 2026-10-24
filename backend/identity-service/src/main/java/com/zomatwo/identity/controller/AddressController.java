package com.zomatwo.identity.controller;

import com.zomatwo.common.dto.CustomerAddressDto;
import com.zomatwo.identity.dto.CreateAddressRequest;
import com.zomatwo.identity.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<List<CustomerAddressDto>> getMyAddresses(
        @RequestHeader("X-User-Id") Long userId
    ) {
        return ResponseEntity.ok(addressService.getAddressesForUser(userId));
    }

    @PostMapping
    public ResponseEntity<CustomerAddressDto> createAddress(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateAddressRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.saveAddress(userId, request));
    }
}
