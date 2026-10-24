package com.zomatwo.catalog.repository;

import com.zomatwo.catalog.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByRestaurantIdAndActiveTrueOrderByCategoryAscNameAsc(Long restaurantId);
    List<MenuItem> findByIdInAndActiveTrue(List<Long> ids);
    Optional<MenuItem> findByIdAndRestaurantIdAndActiveTrue(Long id, Long restaurantId);
}
