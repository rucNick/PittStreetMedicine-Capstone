package com.backend.streetmed_backend.controller;

import com.backend.streetmed_backend.entity.order_entity.Order;
import com.backend.streetmed_backend.entity.order_entity.OrderItem;
import com.backend.streetmed_backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * REST Controller for handling all order-related operations.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;
    private final Executor asyncExecutor;

    @Autowired
    public OrderController(OrderService orderService,
                           @Qualifier("authExecutor") Executor asyncExecutor) {
        this.orderService = orderService;
        this.asyncExecutor = asyncExecutor;
    }

    /**
     * Creates a new order.
     * Request body example:
     * {
     *   "authenticated": true,
     *   "userId": 1,
     *   "deliveryAddress": "123 Main St",
     *   "notes": "Front door delivery",
     *   "items": [
     *     {
     *       "itemName": "First Aid Kit",
     *       "quantity": 1
     *     }
     *   ]
     * }
     */
    @PostMapping("/create")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> createOrder(
            @RequestBody Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Integer userId = (Integer) requestData.get("userId");
                Boolean authenticated = (Boolean) requestData.get("authenticated");

                if (!Boolean.TRUE.equals(authenticated) || userId == null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                Order order = new Order();
                order.setUserId(userId);
                order.setNotes((String) requestData.get("notes"));
                order.setDeliveryAddress((String) requestData.get("deliveryAddress"));

                if (requestData.get("latitude") != null && requestData.get("longitude") != null) {
                    order.setLatitude(Double.valueOf(requestData.get("latitude").toString()));
                    order.setLongitude(Double.valueOf(requestData.get("longitude").toString()));
                }

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> itemsData = (List<Map<String, Object>>) requestData.get("items");
                List<OrderItem> orderItems = itemsData.stream()
                        .map(itemData -> {
                            OrderItem item = new OrderItem();
                            item.setItemName((String) itemData.get("itemName"));
                            item.setQuantity((Integer) itemData.get("quantity"));
                            return item;
                        })
                        .toList();

                Order savedOrder = orderService.createOrder(order, orderItems);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Order created successfully");
                response.put("orderId", savedOrder.getOrderId());
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", false);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    /**
     * Gets all orders (Volunteer only)
     * Request body example:
     * {
     *   "authenticated": true,
     *   "userId": 2,
     *   "userRole": "VOLUNTEER"
     * }
     */
    @GetMapping("/all")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getAllOrders(
            @RequestBody Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String userRole = (String) requestData.get("userRole");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                if (!"VOLUNTEER".equals(userRole)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Only volunteers can view all orders");
                    errorResponse.put("authenticated", true);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                List<Order> orders = orderService.getAllOrders();
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("orders", orders);
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    /**
     * Gets orders for a specific user.
     * Request body example:
     * {
     *   "authenticated": true,
     *   "userId": 1,
     *   "userRole": "CLIENT"
     * }
     */
    @GetMapping("/user/{targetUserId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getUserOrders(
            @PathVariable("targetUserId") Integer targetUserId,
            @RequestBody Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String userRole = (String) requestData.get("userRole");
                Integer requestUserId = (Integer) requestData.get("userId");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                if (!"VOLUNTEER".equals(userRole) && !targetUserId.equals(requestUserId)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Unauthorized access");
                    errorResponse.put("authenticated", true);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                List<Order> orders = orderService.getUserOrders(targetUserId, userRole);
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("orders", orders);
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    /**
     * Updates order status (Volunteer only)
     * Request body example:
     * {
     *   "authenticated": true,
     *   "userId": 2,
     *   "userRole": "VOLUNTEER",
     *   "status": "PROCESSING"
     * }
     */
    @PutMapping("/{orderId}/status")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> updateOrderStatus(
            @PathVariable("orderId") Integer orderId,
            @RequestBody Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String userRole = (String) requestData.get("userRole");
                Integer userId = (Integer) requestData.get("userId");
                String newStatus = (String) requestData.get("status");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                if (!"VOLUNTEER".equals(userRole)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Only volunteers can update order status");
                    errorResponse.put("authenticated", true);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                Order updatedOrder = orderService.updateOrderStatus(orderId, newStatus, userId, userRole);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Order status updated successfully");
                response.put("orderStatus", updatedOrder.getStatus());
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    /**
     * Cancels an order
     * Request body example:
     * {
     *   "authenticated": true,
     *   "userId": 1,
     *   "userRole": "CLIENT"
     * }
     */
    @PostMapping("/{orderId}/cancel")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> cancelOrder(
            @PathVariable("orderId") Integer orderId,
            @RequestBody Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String userRole = (String) requestData.get("userRole");
                Integer userId = (Integer) requestData.get("userId");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                orderService.cancelOrder(orderId, userId, userRole);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Order cancelled successfully");
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }
}