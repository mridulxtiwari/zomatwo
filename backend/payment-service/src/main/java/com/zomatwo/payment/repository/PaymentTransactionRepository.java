package com.zomatwo.payment.repository;

import com.zomatwo.payment.domain.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByGatewayOrderId(String gatewayOrderId);
    Optional<PaymentTransaction> findByOrderId(Long orderId);
}
