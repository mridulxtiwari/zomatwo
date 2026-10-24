package com.zomatwo.order.repository;

import com.zomatwo.common.enums.OrderStatus;
import com.zomatwo.order.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Order> findByRestaurantIdAndStatusInOrderByCreatedAtDesc(Long restaurantId, List<OrderStatus> statuses);
}
