package com.backend.streetmed_backend.service;

import com.backend.streetmed_backend.entity.order_entity.Order;
import com.backend.streetmed_backend.entity.order_entity.OrderItem;
import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.repository.Order.OrderRepository;
import com.backend.streetmed_backend.repository.User.UserRepository;
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
    private static final int GUEST_USER_ID = -1;

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    public Order createOrder(Order order, List<OrderItem> items) {
        if (order.getUserId() != GUEST_USER_ID) {
            validateUser(order.getUserId());
        }

        order.setRequestTime(LocalDateTime.now());
        order.setStatus("PENDING");

        if (items.isEmpty()) {
            throw new RuntimeException("Order must contain at least one item");
        }

        // Set summary information
        order.setItemName(items.size() + " items"); // e.g. "3 items"
        order.setQuantity(items.stream()
                .mapToInt(OrderItem::getQuantity)
                .sum()); // Total quantity

        // Set up bidirectional relationship
        for (OrderItem item : items) {
            order.addOrderItem(item);
        }

        return orderRepository.save(order);
    }

    public Order getOrder(Integer orderId, Integer userId, String userRole) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Allow access to guest orders for volunteers only
        if (order.getUserId() == GUEST_USER_ID) {
            if (!"VOLUNTEER".equals(userRole)) {
                throw new RuntimeException("Unauthorized access to order");
            }
            return order;
        }

        // For regular orders: only allow volunteers to view any order, clients can only view their own orders
        if (!"VOLUNTEER".equals(userRole) && !order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to order");
        }

        return order;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        // Initialize the collections
        orders.forEach(order -> order.getOrderItems().size()); // Force initialization
        return orders;
    }

    @Transactional(readOnly = true)
    public List<Order> getUserOrders(Integer userId, String userRole) {
        List<Order> orders;
        if ("VOLUNTEER".equals(userRole)) {
            orders = orderRepository.findAll();
        } else {
            orders = orderRepository.findByUserId(userId);
        }
        orders.forEach(order -> order.getOrderItems().size()); // Force initialization
        return orders;
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

        // Only volunteers can cancel guest orders
        if (order.getUserId() == GUEST_USER_ID) {
            if (!"VOLUNTEER".equals(userRole)) {
                throw new RuntimeException("Unauthorized to cancel this order");
            }
        } else if (!"VOLUNTEER".equals(userRole) && !order.getUserId().equals(userId)) {
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