package com.backend.streetmed_backend.controller.Auth;

import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Tag(name = "Authentication", description = "APIs for user authentication and profile management")
@CrossOrigin(origins = "http://localhost:3000")
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

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> register(
            @Schema(example = """
                    {
                        "username": "johndoe",
                        "email": "john@example.com",
                        "password": "securepass123",
                        "phone": "412-555-0123"
                    }
                    """)
            @RequestBody Map<String, String> userData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
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

    @Operation(summary = "User login")
    @PostMapping("/login")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> login(
            @Schema(example = """
                    {
                        "username": "johndoe",
                        "password": "securepass123"
                    }
                    """)
            @RequestBody Map<String, String> credentials) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String usernameOrEmail = credentials.get("username");
                String password = credentials.get("password");

                if (usernameOrEmail == null || password == null) {
                    throw new RuntimeException("Missing credentials");
                }

                User user;
                if (usernameOrEmail.contains("@")) {
                    user = userService.findByEmail(usernameOrEmail);
                } else {
                    user = userService.findByUsername(usernameOrEmail);
                }

                if (user != null && userService.verifyUserPassword(password, user.getPassword())) {
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

    @Operation(summary = "Update username")
    @PutMapping("/update/username")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> updateUsername(
            @Schema(example = """
                    {
                        "userId": "123",
                        "newUsername": "newusername",
                        "authenticated": "true"
                    }
                    """)
            @RequestBody Map<String, String> updateData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String userId = updateData.get("userId");
                String newUsername = updateData.get("newUsername");
                String authStatus = updateData.get("authenticated");

                if (!"true".equals(authStatus)) {
                    throw new RuntimeException("Not authenticated");
                }

                if (userId == null || newUsername == null) {
                    throw new RuntimeException("Missing required fields");
                }

                if (userService.findByUsername(newUsername) != null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Username already taken");
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
                }

                User updatedUser = userService.updateUsername(Integer.parseInt(userId), newUsername);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Username updated successfully");
                response.put("username", updatedUser.getUsername());

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

    @Operation(summary = "Update phone number")
    @PutMapping("/update/phone")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> updatePhone(
            @Schema(example = """
                    {
                        "userId": "123",
                        "currentPassword": "securepass123",
                        "newPhone": "412-555-0124",
                        "authenticated": "true"
                    }
                    """)
            @RequestBody Map<String, String> updateData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String userId = updateData.get("userId");
                String currentPassword = updateData.get("currentPassword");
                String newPhone = updateData.get("newPhone");
                String authStatus = updateData.get("authenticated");

                if (!"true".equals(authStatus)) {
                    throw new RuntimeException("Not authenticated");
                }

                if (userId == null || currentPassword == null || newPhone == null) {
                    throw new RuntimeException("Missing required fields");
                }

                User user = userService.findById(Integer.parseInt(userId));
                if (user == null) {
                    throw new RuntimeException("User not found");
                }

                if (!userService.verifyUserPassword(currentPassword, user.getPassword())) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Current password is incorrect");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                User updatedUser = userService.updatePhoneWithVerification(
                        Integer.parseInt(userId),
                        currentPassword,
                        newPhone
                );

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Phone number updated successfully");
                response.put("phone", updatedUser.getPhone());

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

    @Operation(summary = "Update password")
    @PutMapping("/update/password")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> updatePassword(
            @Schema(example = """
                    {
                        "userId": "123",
                        "currentPassword": "oldpass123",
                        "newPassword": "newpass123",
                        "authenticated": "true"
                    }
                    """)
            @RequestBody Map<String, String> updateData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String userId = updateData.get("userId");
                String currentPassword = updateData.get("currentPassword");
                String newPassword = updateData.get("newPassword");
                String authStatus = updateData.get("authenticated");

                if (!"true".equals(authStatus)) {
                    throw new RuntimeException("Not authenticated");
                }

                if (userId == null || currentPassword == null || newPassword == null) {
                    throw new RuntimeException("Missing required fields");
                }

                User user = userService.findById(Integer.parseInt(userId));
                if (user == null) {
                    throw new RuntimeException("User not found");
                }

                if (!userService.verifyUserPassword(currentPassword, user.getPassword())) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Current password is incorrect");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                userService.updatePasswordWithVerification(Integer.parseInt(userId), currentPassword, newPassword);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Password updated successfully");

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

    @Operation(summary = "Update email")
    @PutMapping("/update/email")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> updateEmail(
            @Schema(example = """
                    {
                        "userId": "123",
                        "currentPassword": "securepass123",
                        "newEmail": "newemail@example.com",
                        "authenticated": "true"
                    }
                    """)
            @RequestBody Map<String, String> updateData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String userId = updateData.get("userId");
                String currentPassword = updateData.get("currentPassword");
                String newEmail = updateData.get("newEmail");
                String authStatus = updateData.get("authenticated");

                if (!"true".equals(authStatus)) {
                    throw new RuntimeException("Not authenticated");
                }

                if (userId == null || currentPassword == null || newEmail == null) {
                    throw new RuntimeException("Missing required fields");
                }

                User user = userService.findById(Integer.parseInt(userId));
                if (user == null) {
                    throw new RuntimeException("User not found");
                }

                if (!userService.verifyUserPassword(currentPassword, user.getPassword())) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Current password is incorrect");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                if (userService.findByEmail(newEmail) != null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Email already in use");
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
                }

                User updatedUser = userService.updateEmailWithVerification(Integer.parseInt(userId), currentPassword, newEmail);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Email updated successfully");
                response.put("email", updatedUser.getEmail());

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

}