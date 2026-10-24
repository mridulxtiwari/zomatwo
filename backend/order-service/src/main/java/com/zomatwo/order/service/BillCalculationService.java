package com.zomatwo.order.service;

import com.zomatwo.common.dto.OrderItemValidationDto;
import com.zomatwo.common.dto.ValidateOrderItemsRequest;
import com.zomatwo.common.dto.ValidateOrderItemsResponse;
import com.zomatwo.order.client.CatalogFeignClient;
import com.zomatwo.order.domain.Coupon;
import com.zomatwo.order.dto.CalculateBillRequest;
import com.zomatwo.order.dto.CalculateBillResponse;
import com.zomatwo.order.repository.CouponRedemptionRepository;
import com.zomatwo.order.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillCalculationService {

    private final CatalogFeignClient catalogFeignClient;
    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;

    public CalculateBillResponse calculateBill(CalculateBillRequest request, Long customerId) {
        // 1. Validate items against catalog service
        ValidateOrderItemsResponse validation = catalogFeignClient.validateOrderItems(
            new ValidateOrderItemsRequest(request.getRestaurantId(), request.getItems())
        );

        if (!validation.restaurantOpen()) {
            throw new IllegalStateException("Restaurant is currently closed for online orders.");
        }

        if (!validation.allAvailable()) {
            throw new IllegalStateException("One or more selected dishes are currently unavailable.");
        }

        // 2. Compute item subtotal
        BigDecimal subtotal = validation.validatedItems().stream()
            .map(ValidateOrderItemsResponse.ValidatedItemDto::subtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Delivery fee (Free above ₹499, otherwise ₹35)
        BigDecimal deliveryFee = subtotal.compareTo(new BigDecimal("499.00")) >= 0
            ? BigDecimal.ZERO
            : new BigDecimal("35.00");

        // 4. Platform fee (₹6 flat)
        BigDecimal platformFee = new BigDecimal("6.00");

        // 5. 5% GST on food subtotal
        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);

        // 6. Evaluate coupon discount
        BigDecimal discountAmount = BigDecimal.ZERO;
        String couponMessage = null;
        boolean couponValid = false;
        String appliedCouponCode = null;

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            String code = request.getCouponCode().trim().toUpperCase();
            Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(code);

            if (couponOpt.isEmpty()) {
                couponMessage = "Invalid or inactive promo code.";
            } else {
                Coupon coupon = couponOpt.get();

                if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(Instant.now())) {
                    couponMessage = "This coupon code has expired.";
                } else if (coupon.getCurrentUsageCount() >= coupon.getMaxUsageLimit()) {
                    couponMessage = "Coupon usage limit reached.";
                } else if (customerId != null && couponRedemptionRepository.existsByCouponIdAndCustomerId(coupon.getId(), customerId)) {
                    couponMessage = "You have already used this coupon code.";
                } else if (subtotal.compareTo(coupon.getMinOrderValue()) < 0) {
                    couponMessage = "Minimum order value of ₹" + coupon.getMinOrderValue() + " required.";
                } else {
                    // Valid coupon - calculate discount
                    BigDecimal calculatedDiscount = subtotal
                        .multiply(BigDecimal.valueOf(coupon.getDiscountPercentage()))
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                    discountAmount = calculatedDiscount.min(coupon.getMaxDiscountAmount());
                    couponValid = true;
                    appliedCouponCode = code;
                    couponMessage = "Coupon applied! You saved ₹" + discountAmount;
                }
            }
        }

        // 7. Grand total = subtotal - discount + delivery + platform + taxes
        BigDecimal grandTotal = subtotal
            .subtract(discountAmount)
            .add(deliveryFee)
            .add(platformFee)
            .add(taxAmount)
            .max(BigDecimal.ZERO)
            .setScale(2, RoundingMode.HALF_UP);

        return CalculateBillResponse.builder()
            .restaurantName(validation.restaurantName())
            .subtotal(subtotal)
            .discountAmount(discountAmount)
            .deliveryFee(deliveryFee)
            .platformFee(platformFee)
            .taxAmount(taxAmount)
            .grandTotal(grandTotal)
            .appliedCouponCode(appliedCouponCode)
            .couponMessage(couponMessage)
            .couponValid(couponValid)
            .items(validation.validatedItems())
            .build();
    }
}
