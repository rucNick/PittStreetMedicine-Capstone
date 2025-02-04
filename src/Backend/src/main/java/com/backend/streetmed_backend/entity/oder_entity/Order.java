package com.backend.streetmed_backend.entity.oder_entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "status", nullable = false)
    private String status;  // "PENDING", "PROCESSING", "COMPLETED", "CANCELLED"

    @Column(name = "request_time", nullable = false)
    private LocalDateTime requestTime;

    @Column(name = "delivery_time")
    private LocalDateTime deliveryTime;

    @Column(name = "notes")
    private String notes;

    // Default constructor
    public Order() {}

    // Full constructor
    public Order(Integer orderId, Integer userId, String itemName, Integer quantity,
                 String status, LocalDateTime requestTime, LocalDateTime deliveryTime, String notes) {
        this.orderId = orderId;
        this.userId = userId;
        this.itemName = itemName;
        this.quantity = quantity;
        this.status = status;
        this.requestTime = requestTime;
        this.deliveryTime = deliveryTime;
        this.notes = notes;
    }

    // Getters and Setters
    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getRequestTime() {
        return requestTime;
    }

    public void setRequestTime(LocalDateTime requestTime) {
        this.requestTime = requestTime;
    }

    public LocalDateTime getDeliveryTime() {
        return deliveryTime;
    }

    public void setDeliveryTime(LocalDateTime deliveryTime) {
        this.deliveryTime = deliveryTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}