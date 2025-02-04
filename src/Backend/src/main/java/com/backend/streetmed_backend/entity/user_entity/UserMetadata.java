package com.backend.streetmed_backend.entity.user_entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_metadata")
public class UserMetadata {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    /**
     * This tells JPA:
     *  - We have a 1-to-1 link to User.
     */
    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;


    public UserMetadata() {
        // Required by JPA
    }

    /**
     * Minimal constructor that sets up the link to User.
     */
    public UserMetadata(User user) {
        this.user = user;
        // We'll rely on lifecycle hooks to set createdAt, updatedAt.
    }

    // Full constructor if needed
    public UserMetadata(User user, LocalDateTime createdAt, LocalDateTime updatedAt,
                        LocalDateTime lastLogin, boolean isActive) {
        this.user = user;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastLogin = lastLogin;
    }

    // --- Lifecycle Hooks ---
    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- Getters & Setters ---
    public Integer getUserId() {
        return userId;
    }

    // userId is implicitly mapped to user.userId; typically no direct setter needed.
    // But you can add one if you want.

    public User getUser() {
        return user;
    }
    public void setUser(User user) {
        this.user = user;
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
}
