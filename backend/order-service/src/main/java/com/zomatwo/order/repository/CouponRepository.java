package com.zomatwo.order.repository;

import com.zomatwo.order.domain.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCaseAndIsActiveTrue(String code);

    @Modifying
    @Query("UPDATE Coupon c SET c.currentUsageCount = c.currentUsageCount + 1 " +
           "WHERE c.code = :code AND c.currentUsageCount < c.maxUsageLimit")
    int incrementUsageCount(@Param("code") String code);
}
