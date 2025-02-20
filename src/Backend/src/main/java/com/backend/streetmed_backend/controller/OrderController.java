package com.backend.streetmed_backend.controller;

import com.backend.streetmed_backend.entity.order_entity.Order;
import com.backend.streetmed_backend.entity.order_entity.OrderItem;
import com.backend.streetmed_backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * REST Controller for handling all order-related operations.
 */
@Tag(name = "Order Management", description = "APIs for managing orders, including creation, updates, and cancellation")
@CrossOrigin(origins = "http://localhost:3000")
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

    @Operation(summary = "Create a guest order",
            description = "Creates a new order for guest users without authentication")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = """
                {
                    "status": "success",
                    "message": "Guest order created successfully",
                    "orderId": 1,
                    "orderStatus": "PENDING"
                }
                """))),
            @ApiResponse(responseCode = "400", description = "Missing required fields or invalid input")
    })
    @PostMapping("/guest/create")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> createGuestOrder(
            @RequestBody @Schema(example = """
                {
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "john@example.com",
                    "phone": "412-555-0123",
                    "deliveryAddress": "123 Main St",
                    "notes": "Front door delivery",
                    "items": [
                        {
                            "itemName": "First Aid Kit",
                            "quantity": 1
                        }
                    ]
                }
                """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Validate required fields
                String firstName = (String) requestData.get("firstName");
                String lastName = (String) requestData.get("lastName");
                String deliveryAddress = (String) requestData.get("deliveryAddress");

                if (firstName == null || lastName == null || deliveryAddress == null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Missing required fields: firstName, lastName, and deliveryAddress are required");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                }

                // Create order
                Order order = new Order(Order.OrderType.GUEST);
                order.setUserId(-1);  // Use -1 to indicate guest order
                order.setStatus("PENDING");
                order.setRequestTime(LocalDateTime.now());
                order.setDeliveryAddress(deliveryAddress);
                order.setNotes(String.format("Guest Order - %s %s", firstName, lastName));

                // Add contact information to notes if provided
                StringBuilder additionalNotes = new StringBuilder();
                String email = (String) requestData.get("email");
                String phone = (String) requestData.get("phone");
                String userNotes = (String) requestData.get("notes");

                if (email != null) {
                    additionalNotes.append("Email: ").append(email).append("\n");
                }
                if (phone != null) {
                    additionalNotes.append("Phone: ").append(phone).append("\n");
                }
                if (userNotes != null) {
                    additionalNotes.append("Notes: ").append(userNotes);
                }

                order.setNotes(additionalNotes.toString());

                // Handle location if provided
                if (requestData.get("latitude") != null && requestData.get("longitude") != null) {
                    order.setLatitude(Double.valueOf(requestData.get("latitude").toString()));
                    order.setLongitude(Double.valueOf(requestData.get("longitude").toString()));
                }

                // Process order items
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> itemsData = (List<Map<String, Object>>) requestData.get("items");
                if (itemsData == null || itemsData.isEmpty()) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Order must contain at least one item");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                }

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
                response.put("message", "Guest order created successfully");
                response.put("orderId", savedOrder.getOrderId());
                response.put("orderStatus", savedOrder.getStatus());

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Create a new order",
              description = "Creates a new order for authenticated users")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = """
                {
                    "status": "success",
                    "message": "Order created successfully",
                    "orderId": 1,
                    "authenticated": true
                }
                """))),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping("/create")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> createOrder(
            @RequestBody @Schema(example = """
                {
                    "authenticated": true,
                    "userId": 1,
                    "deliveryAddress": "123 Main St",
                    "notes": "Front door delivery",
                    "items": [
                        {
                            "itemName": "First Aid Kit",
                            "quantity": 1
                        }
                    ]
                }
                """) Map<String, Object> requestData) {
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

                Order order = new Order(Order.OrderType.CLIENT);
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

    @Operation(summary = "Get all orders",
            description = "Retrieves all orders. Only accessible by volunteers.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = """
                {
                    "status": "success",
                    "orders": [
                        {
                            "orderId": 1,
                            "userId": 1,
                            "status": "PENDING",
                            "deliveryAddress": "123 Main St",
                            "notes": "Front door delivery",
                            "requestTime": "2024-02-19T10:30:00",
                            "orderItems": [
                                {
                                    "itemName": "First Aid Kit",
                                    "quantity": 1
                                }
                            ]
                        }
                    ],
                    "authenticated": true
                }
                """))),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Volunteer access only")
    })
    @GetMapping("/all")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getAllOrders(
            @RequestBody @Schema(example = """
                {
                    "authenticated": true,
                    "userId": 2,
                    "userRole": "VOLUNTEER"
                }
                """) Map<String, Object> requestData) {
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

    @Operation(summary = "Get user orders",
            description = "Retrieves orders for a specific user. Users can only view their own orders, volunteers can view any user's orders.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = """
                {
                    "status": "success",
                    "orders": [
                        {
                            "orderId": 1,
                            "status": "PENDING",
                            "deliveryAddress": "123 Main St",
                            "notes": "Front door delivery",
                            "requestTime": "2024-02-19T10:30:00",
                            "orderItems": [
                                {
                                    "itemName": "First Aid Kit",
                                    "quantity": 1
                                }
                            ]
                        }
                    ],
                    "authenticated": true
                }
                """))),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized access")
    })
    @GetMapping("/user/{targetUserId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getUserOrders(
            @Parameter(description = "ID of the user whose orders to retrieve")
            @PathVariable("targetUserId") Integer targetUserId,
            @Parameter(description = "Authentication status")
            @RequestParam("authenticated") boolean authenticated,
            @Parameter(description = "User role (CLIENT or VOLUNTEER)")
            @RequestParam("userRole") String userRole,
            @Parameter(description = "ID of the requesting user")
            @RequestParam("userId") Integer requestUserId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                //Boolean authenticated = (Boolean) requestData.get("authenticated");
                //String userRole = (String) requestData.get("userRole");
                //Integer requestUserId = (Integer) requestData.get("userId");
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

    @Operation(summary = "Update order status",
            description = "Updates the status of an order. Only accessible by volunteers.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order status updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = """
                {
                    "status": "success",
                    "message": "Order status updated successfully",
                    "orderStatus": "PROCESSING",
                    "authenticated": true
                }
                """))),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Volunteer access only")
    })
    @PutMapping("/{orderId}/status")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> updateOrderStatus(
            @Parameter(description = "ID of the order to update")
            @PathVariable("orderId") Integer orderId,
            @RequestBody @Schema(example = """
                {
                    "authenticated": true,
                    "userId": 2,
                    "userRole": "VOLUNTEER",
                    "status": "PROCESSING"
                }
                """) Map<String, Object> requestData) {
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

    @Operation(summary = "Cancel order",
            description = "Cancels an existing order. Users can only cancel their own orders, volunteers can cancel any order.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order cancelled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = """
                {
                    "status": "success",
                    "message": "Order cancelled successfully",
                    "authenticated": true
                }
                """))),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized to cancel this order")
    })
    @PostMapping("/{orderId}/cancel")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> cancelOrder(
            @Parameter(description = "ID of the order to cancel")
            @PathVariable("orderId") Integer orderId,
            @RequestBody @Schema(example = """
                {
                    "authenticated": true,
                    "userId": 1,
                    "userRole": "CLIENT"
                }
                """) Map<String, Object> requestData) {
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