package com.backend.streetmed_backend.repository;

import com.backend.streetmed_backend.controller.entity.order_entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    // Change from findByOrderId to findByOrder_OrderId
    // This tells Spring to look for the orderId field in the Order entity
    List<OrderItem> findByOrder_OrderId(Integer orderId);
}