package com.backend.streetmed_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_metadata")
public class UserMetadata {
    @Id
    private Integer userId;  // This will match the User's userId

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "last_active")
    private LocalDateTime lastActive;

    @Column(name = "is_active")
    private boolean isActive = true;

    // Default constructor
    public UserMetadata() {}

    // Constructor with userId (minimum required field)
    public UserMetadata(Integer userId) {
        this.userId = userId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Full constructor
    public UserMetadata(Integer userId, LocalDateTime createdAt, LocalDateTime updatedAt,
                        LocalDateTime lastLogin, LocalDateTime lastActive, boolean isActive) {
        this.userId = userId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastLogin = lastLogin;
        this.lastActive = lastActive;
        this.isActive = isActive;
    }

    // Getters and Setters
    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public LocalDateTime getLastActive() {
        return lastActive;
    }

    public void setLastActive(LocalDateTime lastActive) {
        this.lastActive = lastActive;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    // PreUpdate hook to update the updatedAt timestamp
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}