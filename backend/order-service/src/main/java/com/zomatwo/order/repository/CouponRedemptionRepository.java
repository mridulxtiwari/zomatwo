package com.zomatwo.order.repository;

import com.zomatwo.order.domain.CouponRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponRedemptionRepository extends JpaRepository<CouponRedemption, Long> {
    boolean existsByCouponIdAndCustomerId(Long couponId, Long customerId);
}
