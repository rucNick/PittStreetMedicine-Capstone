package com.backend.streetmed_backend.service;

import com.backend.streetmed_backend.entity.CargoItem;
import com.backend.streetmed_backend.entity.order_entity.Order;
import com.backend.streetmed_backend.entity.order_entity.OrderItem;
import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.repository.Order.OrderRepository;
import com.backend.streetmed_backend.repository.User.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CargoItemService cargoItemService;
    private static final int GUEST_USER_ID = -1;

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        UserRepository userRepository,
                        CargoItemService cargoItemService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.cargoItemService = cargoItemService;
    }

    /**
     * Creates a new order and reserves the associated inventory items.
     *
     * @param order The order to create
     * @param items The items in the order
     * @return The saved order
     */
    @Transactional
    public Order createOrder(Order order, List<OrderItem> items) {
        if (order.getUserId() != GUEST_USER_ID) {
            validateUser(order.getUserId());
        }

        order.setRequestTime(LocalDateTime.now());
        order.setStatus("PENDING");

        if (items.isEmpty()) {
            throw new RuntimeException("Order must contain at least one item");
        }

        // Reserve inventory items (decrement quantities temporarily)
        Map<String, Integer> itemQuantityMap = new HashMap<>();
        for (OrderItem item : items) {
            String itemName = item.getItemName();
            int quantity = item.getQuantity();

            // Aggregate quantities for items that might appear multiple times
            itemQuantityMap.put(itemName,
                    itemQuantityMap.getOrDefault(itemName, 0) + quantity);
        }

        // Check inventory availability and reserve items
        for (Map.Entry<String, Integer> entry : itemQuantityMap.entrySet()) {
            String itemName = entry.getKey();
            int requestedQuantity = entry.getValue();

            // Find the cargo item by name
            List<CargoItem> matchingItems = cargoItemService.searchItems(itemName);
            if (matchingItems.isEmpty()) {
                throw new RuntimeException("Item not found: " + itemName);
            }

            // Use the first matching item (assuming item names are unique)
            CargoItem cargoItem = matchingItems.get(0);

            // Check if there's enough inventory
            if (!cargoItem.isAvailableInQuantity(requestedQuantity)) {
                throw new RuntimeException("Insufficient quantity available for: " + itemName);
            }

            // Reserve the inventory (temporarily reduce quantity)
            cargoItemService.reserveItems(cargoItem.getId(), requestedQuantity);
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

    /**
     * Updates the status of an order.
     * If status is COMPLETED, the inventory reduction is made permanent.
     * If status is CANCELLED, reserved inventory is released.
     *
     * @param orderId Order ID
     * @param status New status
     * @param userId User ID making the change
     * @param userRole Role of user making the change
     * @return Updated order
     */
    @Transactional
    public Order updateOrderStatus(Integer orderId, String status, Integer userId, String userRole) {
        if (!"VOLUNTEER".equals(userRole)) {
            throw new RuntimeException("Only volunteers can update order status");
        }

        Order order = getOrder(orderId, userId, userRole);
        String oldStatus = order.getStatus();
        order.setStatus(status);

        // Handle inventory based on status change
        if (status.equals("COMPLETED") && !oldStatus.equals("COMPLETED")) {
            // Order is now complete - inventory has already been reserved,
            // no additional action needed as reservation is permanent
            order.setDeliveryTime(LocalDateTime.now());
        } else if (status.equals("CANCELLED") && !oldStatus.equals("CANCELLED")) {
            // Order is cancelled - release the reserved inventory
            releaseReservedInventory(order);
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

    /**
     * Cancels an order and releases any reserved inventory.
     *
     * @param orderId Order ID
     * @param userId User ID making the request
     * @param userRole Role of user making the request
     */
    @Transactional
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

        // Don't release inventory if order was already COMPLETED
        if (!order.getStatus().equals("COMPLETED")) {
            // Release the reserved inventory
            releaseReservedInventory(order);
        }

        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    /**
     * Releases inventory that was reserved for an order.
     * Used when an order is cancelled.
     *
     * @param order The order containing items to release
     */
    private void releaseReservedInventory(Order order) {
        // Get all items in the order
        List<OrderItem> orderItems = order.getOrderItems();

        // Group items by name and sum quantities
        Map<String, Integer> itemQuantityMap = new HashMap<>();
        for (OrderItem item : orderItems) {
            String itemName = item.getItemName();
            int quantity = item.getQuantity();

            itemQuantityMap.put(itemName,
                    itemQuantityMap.getOrDefault(itemName, 0) + quantity);
        }

        // Restore quantities to inventory
        for (Map.Entry<String, Integer> entry : itemQuantityMap.entrySet()) {
            String itemName = entry.getKey();
            int quantity = entry.getValue();

            // Find the cargo item by name
            List<CargoItem> matchingItems = cargoItemService.searchItems(itemName);
            if (!matchingItems.isEmpty()) {
                CargoItem cargoItem = matchingItems.get(0);

                // Restore the quantity (add back to inventory)
                cargoItemService.updateQuantity(
                        cargoItem.getId(),
                        cargoItem.getQuantity() + quantity
                );
            }
        }
    }

    private void validateUser(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
    }
}