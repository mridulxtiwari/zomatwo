package com.zomatwo.order.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "discount_percentage", nullable = false)
    private Integer discountPercentage;

    @Column(name = "max_discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal minOrderValue;

    @Column(name = "max_usage_limit", nullable = false)
    private Integer maxUsageLimit;

    @Column(name = "current_usage_count", nullable = false)
    private Integer currentUsageCount;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
