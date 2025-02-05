package com.backend.streetmed_backend.service;

import com.backend.streetmed_backend.entity.order_entity.Order;
import com.backend.streetmed_backend.entity.order_entity.OrderItem;
import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.repository.OrderRepository;
import com.backend.streetmed_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    public Order createOrder(Order order, List<OrderItem> items) {
        validateUser(order.getUserId());

        // Set initial order values
        order.setRequestTime(LocalDateTime.now());
        order.setStatus("PENDING");

        // Set the first item's details to order (since schema requires it)
        if (!items.isEmpty()) {
            OrderItem firstItem = items.get(0);
            order.setItemName(firstItem.getItemName());
            order.setQuantity(firstItem.getQuantity());
        } else {
            throw new RuntimeException("Order must contain at least one item");
        }

        // Set up bidirectional relationship
        items.forEach(order::addOrderItem);

        // Save and return order (cascade will save items)
        return orderRepository.save(order);
    }

    public Order getOrder(Integer orderId, Integer userId, String userRole) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Only allow volunteers to view any order, clients can only view their own orders
        if (!"VOLUNTEER".equals(userRole) && !order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to order");
        }

        return order;
    }

    public List<Order> getUserOrders(Integer userId, String userRole) {
        if ("VOLUNTEER".equals(userRole)) {
            return orderRepository.findAll();
        }
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
    }

    public Order updateOrderStatus(Integer orderId, String status, Integer userId, String userRole) {
        if (!"VOLUNTEER".equals(userRole)) {
            throw new RuntimeException("Only volunteers can update order status");
        }

        Order order = getOrder(orderId, userId, userRole);
        order.setStatus(status);
        if (status.equals("COMPLETED")) {
            order.setDeliveryTime(LocalDateTime.now());
        }
        return orderRepository.save(order);
    }

    public Order assignVolunteer(Integer orderId, Integer volunteerId, String userRole) {
        if (!"VOLUNTEER".equals(userRole)) {
            throw new RuntimeException("Only volunteers can be assigned to orders");
        }

        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new RuntimeException("Volunteer not found"));

        if (!"VOLUNTEER".equals(volunteer.getRole())) {
            throw new RuntimeException("User is not a volunteer");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setVolunteerId(volunteerId);
        order.setStatus("PROCESSING");
        return orderRepository.save(order);
    }

    public void cancelOrder(Integer orderId, Integer userId, String userRole) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!"VOLUNTEER".equals(userRole) && !order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to cancel this order");
        }

        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    private void validateUser(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
    }


}