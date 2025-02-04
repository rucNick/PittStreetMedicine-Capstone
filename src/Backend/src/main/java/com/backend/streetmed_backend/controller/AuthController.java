package com.backend.streetmed_backend.controller;

import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> userData) {
        try {
            User newUser = new User();
            newUser.setUsername(userData.get("username"));
            newUser.setEmail(userData.get("email"));
            newUser.setPassword(userData.get("password"));
            if (userData.containsKey("phone") && userData.get("phone") != null && !userData.get("phone").trim().isEmpty()) {
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
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");

            User user = userService.findByUsername(username);

            if (user != null && password.equals(user.getPassword())) {
                userService.updateLastLogin(user.getUserId());

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Login successful");
                response.put("userId", user.getUserId());
                response.put("role", user.getRole());
                response.put("authenticated", true);  // Set to true on successful login
                response.put("username", user.getUsername());  // Added username for convenience
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
    }

    //--------------------------------------------admin endpoints-------------------------------------------------------
    // DELETE endpoint updated to check the "authenticated" field in the request body.
    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, Object>> deleteUser(@RequestBody Map<String, String> deleteRequest) {
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

            // Verify admin privileges
            User admin = userService.findByUsername(adminUsername);
            if (admin == null || !"ADMIN".equals(admin.getRole())) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", "Unauthorized access");
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            // Find and delete user
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
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestHeader("Admin-Username") String adminUsername,
            @RequestHeader("Authentication-Status") String authStatus) {
        try {
            // Check authentication
            if (!"true".equals(authStatus)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", "Not authenticated");
                errorResponse.put("authenticated", false);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            // Verify admin privileges
            User admin = userService.findByUsername(adminUsername);
            if (admin == null || !"ADMIN".equals(admin.getRole())) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", "Unauthorized access");
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            // Get all users and filter them by role
            List<User> allUsers = userService.getAllUsers();

            List<Map<String, String>> clientUsers = new ArrayList<>();
            List<Map<String, String>> volunteerUsers = new ArrayList<>();
            List<Map<String, String>> adminUsers = new ArrayList<>();

            for (User user : allUsers) {
                Map<String, String> userInfo = new HashMap<>();
                userInfo.put("username", user.getUsername());
                userInfo.put("role", user.getRole());
                switch (user.getRole()) {
                    case "CLIENT":
                        clientUsers.add(userInfo);
                        break;
                    case "VOLUNTEER":
                        volunteerUsers.add(userInfo);
                        break;
                    case "ADMIN":
                        adminUsers.add(userInfo);
                        break;
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
    }
}