package com.zomatwo.identity.service;

import com.zomatwo.common.dto.CustomerAddressDto;
import com.zomatwo.identity.dto.CreateAddressRequest;
import com.zomatwo.identity.entity.CustomerAddress;
import com.zomatwo.identity.entity.User;
import com.zomatwo.identity.repository.CustomerAddressRepository;
import com.zomatwo.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressService {

    private final CustomerAddressRepository addressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CustomerAddressDto> getAddressesForUser(Long userId) {
        return addressRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public CustomerAddressDto saveAddress(Long userId, CreateAddressRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.isDefault()) {
            addressRepository.resetDefaultAddressForUser(userId);
        }

        CustomerAddress address = CustomerAddress.builder()
            .user(user)
            .label(request.label().trim())
            .fullAddress(request.fullAddress().trim())
            .landmark(request.landmark() != null ? request.landmark().trim() : null)
            .latitude(request.latitude())
            .longitude(request.longitude())
            .isDefault(request.isDefault())
            .build();

        address = addressRepository.save(address);
        log.info("Saved address {} for user {}", address.getId(), userId);
        return toDto(address);
    }

    @Transactional(readOnly = true)
    public CustomerAddressDto getAddressByIdAndUser(Long addressId, Long userId) {
        CustomerAddress address = addressRepository.findByIdAndUserId(addressId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery address not found"));
        return toDto(address);
    }

    private CustomerAddressDto toDto(CustomerAddress a) {
        return new CustomerAddressDto(
            a.getId(),
            a.getUser().getId(),
            a.getLabel(),
            a.getFullAddress(),
            a.getLandmark(),
            a.getLatitude(),
            a.getLongitude(),
            a.isDefault(),
            a.getCreatedAt()
        );
    }
}
