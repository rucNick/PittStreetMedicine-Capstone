package com.backend.streetmed_backend.controller.Auth;

import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.security.SecurityManager;
import com.backend.streetmed_backend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    // Add the ObjectMapper for JSON processing
    private final ObjectMapper objectMapper;

    private final SecurityManager securityManager;

    @Autowired
    public AuthController(
            UserService userService,
            @Qualifier("authExecutor") Executor authExecutor,
            @Qualifier("readOnlyExecutor") Executor readOnlyExecutor,
            SecurityManager securityManager,  // Add this parameter
            ObjectMapper objectMapper) {  // Add this parameter
        this.userService = userService;
        this.authExecutor = authExecutor;
        this.readOnlyExecutor = readOnlyExecutor;
        this.securityManager = securityManager;
        this.objectMapper = objectMapper;

        logger.info("AuthController initialized with SecurityManager");
    }

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public CompletableFuture<ResponseEntity<?>> register(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @RequestBody String body) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Map<String, String> userData;
                // If a session ID is provided, assume the request body is encrypted text
                if (sessionId != null) {
                    logger.info("Received encrypted registration request for session: {}", sessionId);
                    String decryptedBody = securityManager.decrypt(sessionId, body);
                    userData = objectMapper.readValue(decryptedBody, Map.class);
                    logger.info("Decrypted registration request for user: {}", userData.get("username"));
                } else {
                    // For non-encrypted requests, parse the JSON string directly
                    userData = objectMapper.readValue(body, Map.class);
                }

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

                if (sessionId != null) {
                    // Encrypt the response if the request was encrypted
                    String encryptedResponse = securityManager.encrypt(sessionId, objectMapper.writeValueAsString(response));
                    return ResponseEntity.ok(encryptedResponse);
                } else {
                    return ResponseEntity.ok(response);
                }

            } catch (Exception e) {
                logger.error("Error processing registration: {}", e.getMessage(), e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                try {
                    if (sessionId != null) {
                        String encryptedError = securityManager.encrypt(sessionId, objectMapper.writeValueAsString(errorResponse));
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(encryptedError);
                    }
                } catch (Exception ex) {
                    logger.error("Error encrypting error response: {}", ex.getMessage(), ex);
                }
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        }, authExecutor);
    }

    @Operation(summary = "User login")
    @PostMapping("/login")
    public CompletableFuture<ResponseEntity<?>> login(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @RequestBody String body) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                Map<String, String> credentials;
                // If a session ID is provided, assume the request body is encrypted text
                if (sessionId != null) {
                    logger.info("Received encrypted login request for session: {}", sessionId);
                    String decryptedBody = securityManager.decrypt(sessionId, body);
                    credentials = objectMapper.readValue(decryptedBody, Map.class);
                    logger.info("Decrypted login request for user: {}", credentials.get("username"));
                } else {
                    // For non-encrypted requests, parse the JSON string directly
                    credentials = objectMapper.readValue(body, Map.class);
                }

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
                    CompletableFuture.runAsync(() -> userService.updateLastLogin(user.getUserId()), authExecutor);

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

                    if (sessionId != null) {
                        // Encrypt the response if the request was encrypted
                        String encryptedResponse = securityManager.encrypt(sessionId, objectMapper.writeValueAsString(response));
                        return ResponseEntity.ok(encryptedResponse);
                    } else {
                        return ResponseEntity.ok(response);
                    }
                } else {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Invalid credentials");
                    errorResponse.put("authenticated", false);

                    if (sessionId != null) {
                        String encryptedError = securityManager.encrypt(sessionId, objectMapper.writeValueAsString(errorResponse));
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(encryptedError);
                    } else {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                    }
                }
            } catch (Exception e) {
                logger.error("Error processing login: {}", e.getMessage(), e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", false);

                try {
                    if (sessionId != null) {
                        String encryptedError = securityManager.encrypt(sessionId, objectMapper.writeValueAsString(errorResponse));
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(encryptedError);
                    }
                } catch (Exception ex) {
                    logger.error("Error encrypting error response: {}", ex.getMessage(), ex);
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, readOnlyExecutor);
    }

    @Operation(summary = "Update username")
    @PutMapping("/update/username")
    public CompletableFuture<ResponseEntity<?>> updateUsername(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @RequestBody String body) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Map<String, String> updateData;
                // If a session ID is provided, assume the request body is encrypted text
                if (sessionId != null && !sessionId.isEmpty()) {
                    try {
                        logger.info("Received encrypted username update request for session: {}", sessionId);
                        String decryptedBody = securityManager.decrypt(sessionId, body);
                        updateData = objectMapper.readValue(decryptedBody, Map.class);
                        logger.info("Decrypted username update request");
                    } catch (IllegalStateException e) {
                        // If decryption fails due to missing session key, try to parse as JSON
                        logger.warn("Session key not found, trying to parse as regular JSON: {}", e.getMessage());
                        try {
                            updateData = objectMapper.readValue(body, Map.class);
                        } catch (Exception jsonEx) {
                            throw new RuntimeException("Failed to parse request as JSON after decryption failed", jsonEx);
                        }
                    }
                } else {
                    // For non-encrypted requests, parse the JSON string directly
                    updateData = objectMapper.readValue(body, Map.class);
                }

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

                    // Return encrypted response if original request was encrypted
                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        try {
                            String encryptedError = securityManager.encrypt(sessionId,
                                    objectMapper.writeValueAsString(errorResponse));
                            return ResponseEntity.status(HttpStatus.CONFLICT).body(encryptedError);
                        } catch (Exception e) {
                            logger.error("Error encrypting error response: {}", e.getMessage());
                            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
                        }
                    }
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
                }

                User updatedUser = userService.updateUsername(Integer.parseInt(userId), newUsername);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Username updated successfully");
                response.put("username", updatedUser.getUsername());

                // Return encrypted response if original request was encrypted
                if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                    try {
                        String encryptedResponse = securityManager.encrypt(sessionId,
                                objectMapper.writeValueAsString(response));
                        return ResponseEntity.ok(encryptedResponse);
                    } catch (Exception e) {
                        logger.error("Error encrypting response: {}", e.getMessage());
                        return ResponseEntity.ok(response);
                    }
                }
                return ResponseEntity.ok(response);

            } catch (Exception e) {
                logger.error("Error processing username update: {}", e.getMessage(), e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                try {
                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        String encryptedError = securityManager.encrypt(sessionId,
                                objectMapper.writeValueAsString(errorResponse));
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(encryptedError);
                    }
                } catch (Exception ex) {
                    logger.error("Error encrypting error response: {}", ex.getMessage(), ex);
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

    @Operation(summary = "Update phone number")
    @PutMapping("/update/phone")
    public CompletableFuture<ResponseEntity<?>> updatePhone(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @RequestBody String body) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Map<String, String> updateData;
                // If a session ID is provided, assume the request body is encrypted text
                if (sessionId != null && !sessionId.isEmpty()) {
                    try {
                        logger.info("Received encrypted phone update request for session: {}", sessionId);
                        String decryptedBody = securityManager.decrypt(sessionId, body);
                        updateData = objectMapper.readValue(decryptedBody, Map.class);
                        logger.info("Decrypted phone update request");
                    } catch (IllegalStateException e) {
                        // If decryption fails due to missing session key, try to parse as JSON
                        logger.warn("Session key not found, trying to parse as regular JSON: {}", e.getMessage());
                        try {
                            updateData = objectMapper.readValue(body, Map.class);
                        } catch (Exception jsonEx) {
                            throw new RuntimeException("Failed to parse request as JSON after decryption failed", jsonEx);
                        }
                    }
                } else {
                    // For non-encrypted requests, parse the JSON string directly
                    updateData = objectMapper.readValue(body, Map.class);
                }

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

                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        try {
                            String encryptedError = securityManager.encrypt(sessionId,
                                    objectMapper.writeValueAsString(errorResponse));
                            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(encryptedError);
                        } catch (Exception e) {
                            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                        }
                    }
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

                if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                    try {
                        String encryptedResponse = securityManager.encrypt(sessionId,
                                objectMapper.writeValueAsString(response));
                        return ResponseEntity.ok(encryptedResponse);
                    } catch (Exception e) {
                        logger.error("Error encrypting response: {}", e.getMessage());
                        return ResponseEntity.ok(response);
                    }
                }
                return ResponseEntity.ok(response);

            } catch (Exception e) {
                logger.error("Error processing phone update: {}", e.getMessage(), e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                try {
                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        String encryptedError = securityManager.encrypt(sessionId,
                                objectMapper.writeValueAsString(errorResponse));
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(encryptedError);
                    }
                } catch (Exception ex) {
                    logger.error("Error encrypting error response: {}", ex.getMessage(), ex);
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

    @Operation(summary = "Update password")
    @PutMapping("/update/password")
    public CompletableFuture<ResponseEntity<?>> updatePassword(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @RequestBody String body) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Map<String, String> updateData;
                // If a session ID is provided, assume the request body is encrypted text
                if (sessionId != null && !sessionId.isEmpty()) {
                    try {
                        logger.info("Received encrypted password update request for session: {}", sessionId);
                        String decryptedBody = securityManager.decrypt(sessionId, body);
                        updateData = objectMapper.readValue(decryptedBody, Map.class);
                        logger.info("Decrypted password update request");
                    } catch (IllegalStateException e) {
                        // If decryption fails due to missing session key, try to parse as JSON
                        logger.warn("Session key not found, trying to parse as regular JSON: {}", e.getMessage());
                        try {
                            updateData = objectMapper.readValue(body, Map.class);
                        } catch (Exception jsonEx) {
                            throw new RuntimeException("Failed to parse request as JSON after decryption failed", jsonEx);
                        }
                    }
                } else {
                    // For non-encrypted requests, parse the JSON string directly
                    updateData = objectMapper.readValue(body, Map.class);
                }

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

                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        try {
                            String encryptedError = securityManager.encrypt(sessionId,
                                    objectMapper.writeValueAsString(errorResponse));
                            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(encryptedError);
                        } catch (Exception e) {
                            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                        }
                    }
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                userService.updatePasswordWithVerification(Integer.parseInt(userId), currentPassword, newPassword);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Password updated successfully");

                if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                    try {
                        String encryptedResponse = securityManager.encrypt(sessionId,
                                objectMapper.writeValueAsString(response));
                        return ResponseEntity.ok(encryptedResponse);
                    } catch (Exception e) {
                        logger.error("Error encrypting response: {}", e.getMessage());
                        return ResponseEntity.ok(response);
                    }
                }
                return ResponseEntity.ok(response);

            } catch (Exception e) {
                logger.error("Error processing password update: {}", e.getMessage(), e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                try {
                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        String encryptedError = securityManager.encrypt(sessionId,
                                objectMapper.writeValueAsString(errorResponse));
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(encryptedError);
                    }
                } catch (Exception ex) {
                    logger.error("Error encrypting error response: {}", ex.getMessage(), ex);
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

    @Operation(summary = "Update email")
    @PutMapping("/update/email")
    public CompletableFuture<ResponseEntity<?>> updateEmail(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @RequestBody String body) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Map<String, String> updateData;
                // If a session ID is provided, assume the request body is encrypted text
                if (sessionId != null && !sessionId.isEmpty()) {
                    try {
                        logger.info("Received encrypted email update request for session: {}", sessionId);
                        String decryptedBody = securityManager.decrypt(sessionId, body);
                        updateData = objectMapper.readValue(decryptedBody, Map.class);
                        logger.info("Decrypted email update request");
                    } catch (IllegalStateException e) {
                        // If decryption fails due to missing session key, try to parse as JSON
                        logger.warn("Session key not found, trying to parse as regular JSON: {}", e.getMessage());
                        try {
                            updateData = objectMapper.readValue(body, Map.class);
                        } catch (Exception jsonEx) {
                            throw new RuntimeException("Failed to parse request as JSON after decryption failed", jsonEx);
                        }
                    }
                } else {
                    // For non-encrypted requests, parse the JSON string directly
                    updateData = objectMapper.readValue(body, Map.class);
                }

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

                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        try {
                            String encryptedError = securityManager.encrypt(sessionId,
                                    objectMapper.writeValueAsString(errorResponse));
                            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(encryptedError);
                        } catch (Exception e) {
                            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                        }
                    }
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                if (userService.findByEmail(newEmail) != null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Email already in use");

                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        try {
                            String encryptedError = securityManager.encrypt(sessionId,
                                    objectMapper.writeValueAsString(errorResponse));
                            return ResponseEntity.status(HttpStatus.CONFLICT).body(encryptedError);
                        } catch (Exception e) {
                            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
                        }
                    }
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
                }

                User updatedUser = userService.updateEmailWithVerification(Integer.parseInt(userId), currentPassword, newEmail);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Email updated successfully");
                response.put("email", updatedUser.getEmail());

                if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                    try {
                        String encryptedResponse = securityManager.encrypt(sessionId,
                                objectMapper.writeValueAsString(response));
                        return ResponseEntity.ok(encryptedResponse);
                    } catch (Exception e) {
                        logger.error("Error encrypting response: {}", e.getMessage());
                        return ResponseEntity.ok(response);
                    }
                }
                return ResponseEntity.ok(response);

            } catch (Exception e) {
                logger.error("Error processing email update: {}", e.getMessage(), e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                try {
                    if (sessionId != null && !sessionId.isEmpty() && securityManager.getSessionKey(sessionId) != null) {
                        String encryptedError = securityManager.encrypt(sessionId,
                                objectMapper.writeValueAsString(errorResponse));
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(encryptedError);
                    }
                } catch (Exception ex) {
                    logger.error("Error encrypting error response: {}", ex.getMessage(), ex);
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }
}