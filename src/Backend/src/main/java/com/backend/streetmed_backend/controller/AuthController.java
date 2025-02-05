package com.backend.streetmed_backend.controller;

import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final Executor authExecutor;
    private final Executor readOnlyExecutor;

    @Autowired
    public AuthController(
            UserService userService,
            @Qualifier("authExecutor") Executor authExecutor,
            @Qualifier("readOnlyExecutor") Executor readOnlyExecutor) {
        this.userService = userService;
        this.authExecutor = authExecutor;
        this.readOnlyExecutor = readOnlyExecutor;
    }

    @PostMapping("/register")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> register(
            @RequestBody Map<String, String> userData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Pre-validate to avoid database contention
                if (userData.get("username") == null || userData.get("email") == null ||
                        userData.get("password") == null) {
                    throw new RuntimeException("Missing required fields");
                }

                User newUser = new User();
                newUser.setUsername(userData.get("username"));
                newUser.setEmail(userData.get("email"));
                newUser.setPassword(userData.get("password"));
                if (userData.containsKey("phone") && userData.get("phone") != null &&
                        !userData.get("phone").trim().isEmpty()) {
                    newUser.setPhone(userData.get("phone"));
                }
                newUser.setRole("CLIENT");

                User savedUser = userService.createUser(newUser);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "User registered successfully");
                response.put("userId", savedUser.getUserId());

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        }, authExecutor);
    }

    @PostMapping("/login")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> login(
            @RequestBody Map<String, String> credentials) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String username = credentials.get("username");
                String password = credentials.get("password");

                if (username == null || password == null) {
                    throw new RuntimeException("Missing credentials");
                }

                User user = userService.findByUsername(username);

                if (user != null && password.equals(user.getPassword())) {
                    // Handle last login update separately to avoid write contention
                    CompletableFuture.runAsync(() ->
                                    userService.updateLastLogin(user.getUserId()),
                            authExecutor
                    );

                    Map<String, Object> response = new HashMap<>();
                    response.put("status", "success");
                    response.put("message", "Login successful");
                    response.put("userId", user.getUserId());
                    response.put("role", user.getRole());
                    response.put("authenticated", true);
                    response.put("username", user.getUsername());
                    if (user.getEmail() != null) {
                        response.put("email", user.getEmail());
                    }

                    return ResponseEntity.ok(response);
                } else {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Invalid credentials");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", false);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, readOnlyExecutor);
    }

    @GetMapping("/users")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getAllUsers(
            @RequestHeader("Admin-Username") String adminUsername,
            @RequestHeader("Authentication-Status") String authStatus) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!"true".equals(authStatus)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                User admin = userService.findByUsername(adminUsername);
                if (admin == null || !"ADMIN".equals(admin.getRole())) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Unauthorized access");
                    errorResponse.put("authenticated", true);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                List<User> allUsers = userService.getAllUsers();
                List<Map<String, String>> clientUsers = new ArrayList<>();
                List<Map<String, String>> volunteerUsers = new ArrayList<>();
                List<Map<String, String>> adminUsers = new ArrayList<>();

                for (User user : allUsers) {
                    Map<String, String> userInfo = new HashMap<>();
                    userInfo.put("username", user.getUsername());
                    userInfo.put("role", user.getRole());
                    switch (user.getRole()) {
                        case "CLIENT" -> clientUsers.add(userInfo);
                        case "VOLUNTEER" -> volunteerUsers.add(userInfo);
                        case "ADMIN" -> adminUsers.add(userInfo);
                    }
                }

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("authenticated", true);
                response.put("data", Map.of(
                        "clients", clientUsers,
                        "volunteers", volunteerUsers,
                        "admins", adminUsers
                ));

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, readOnlyExecutor);
    }

    @DeleteMapping("/delete")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> deleteUser(
            @RequestBody Map<String, String> deleteRequest) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String isAuthenticatedStr = deleteRequest.get("authenticated");
                if (!"true".equals(isAuthenticatedStr)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                String adminUsername = deleteRequest.get("adminUsername");
                String userToDelete = deleteRequest.get("username");

                User admin = userService.findByUsername(adminUsername);
                if (admin == null || !"ADMIN".equals(admin.getRole())) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Unauthorized access");
                    errorResponse.put("authenticated", true);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                User userToBeDeleted = userService.findByUsername(userToDelete);
                if (userToBeDeleted == null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "User not found");
                    errorResponse.put("authenticated", true);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                userService.deleteUser(userToBeDeleted.getUserId());

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "User deleted successfully");
                response.put("authenticated", true);

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }
}