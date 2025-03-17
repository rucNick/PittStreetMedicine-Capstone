package com.backend.streetmed_backend.controller.Auth;

import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.service.EmailService;
import com.backend.streetmed_backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
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

import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Tag(name = "Password Recovery", description = "APIs for password recovery and reset")
@RestController
@RequestMapping("/api/auth/password")
@CrossOrigin(origins = "http://localhost:3000")
public class PasswordRecoveryController {

    private final UserService userService;
    private final EmailService emailService;
    private final Executor authExecutor;

    @Autowired
    public PasswordRecoveryController(
            UserService userService,
            EmailService emailService,
            @Qualifier("authExecutor") Executor authExecutor) {
        this.userService = userService;
        this.emailService = emailService;
        this.authExecutor = authExecutor;
    }

    @Operation(summary = "Request password reset",
            description = "Sends a password recovery code to the user's email address")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recovery code sent successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = """
                    {
                        "status": "success",
                        "message": "Recovery code sent to your email"
                    }
                    """))),
            @ApiResponse(responseCode = "400", description = "Missing email"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/request-reset")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> requestPasswordReset(
            @RequestBody @Schema(example = """
                    {
                        "email": "user@example.com"
                    }
                    """) Map<String, String> request) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                String email = request.get("email");

                if (email == null || email.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "status", "error",
                            "message", "Email is required"
                    ));
                }

                User user = userService.findByEmail(email);
                if (user == null) {
                    // Don't reveal that the email doesn't exist for security reasons
                    return ResponseEntity.ok(Map.of(
                            "status", "success",
                            "message", "If your email is registered, you will receive a recovery code"
                    ));
                }

                emailService.sendPasswordRecoveryEmail(email);

                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Recovery code sent to your email"
                ));

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

    @Operation(summary = "Verify OTP and reset password",
            description = "Verifies the one-time password (OTP) and resets the user's password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = """
                    {
                        "status": "success",
                        "message": "Password reset successfully"
                    }
                    """))),
            @ApiResponse(responseCode = "400", description = "Missing required fields or invalid OTP"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/verify-reset")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> verifyAndResetPassword(
            @RequestBody @Schema(example = """
                    {
                        "email": "user@example.com",
                        "otp": "123456",
                        "newPassword": "newSecurePassword123"
                    }
                    """) Map<String, String> request) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                String email = request.get("email");
                String otp = request.get("otp");
                String newPassword = request.get("newPassword");

                if (email == null || otp == null || newPassword == null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Email, OTP, and new password are required");
                    return ResponseEntity.badRequest().body(errorResponse);
                }

                User user = userService.findByEmail(email);
                if (user == null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "User not found");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                boolean isValidOtp = emailService.verifyOtp(email, otp);
                if (!isValidOtp) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Invalid or expired OTP");
                    return ResponseEntity.badRequest().body(errorResponse);
                }

                userService.updatePassword(user.getUserId(), newPassword);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Password reset successfully");
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