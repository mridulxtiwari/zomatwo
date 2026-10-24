package com.zomatwo.order.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupon_redemptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponRedemption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "discount_applied", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountApplied;

    @CreationTimestamp
    @Column(name = "redeemed_at", nullable = false, updatable = false)
    private Instant redeemedAt;
}
