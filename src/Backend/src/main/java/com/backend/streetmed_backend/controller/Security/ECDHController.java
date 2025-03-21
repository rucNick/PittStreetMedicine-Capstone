package com.backend.streetmed_backend.controller.Security;

import com.backend.streetmed_backend.security.ECDHService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Security", description = "APIs for security operations including key exchange")
@RestController
@RequestMapping("/api/security")
@CrossOrigin(origins = "http://localhost:3000")
public class ECDHController {

    // Add a logger
    private static final Logger logger = LoggerFactory.getLogger(ECDHController.class);

    private final ECDHService ecdhService;

    @Autowired
    public ECDHController(ECDHService ecdhService) {
        this.ecdhService = ecdhService;
        logger.info("ECDHController initialized");
    }

    @Operation(summary = "Initiate ECDH handshake",
            description = "Initiates the ECDH key exchange by generating a server key pair and returning the public key")
    @GetMapping("/initiate-handshake")
    public ResponseEntity<Map<String, String>> initiateHandshake() {
        logger.info("Received request to initiate ECDH handshake");

        String sessionId = UUID.randomUUID().toString();
        logger.info("Generated new session ID: {}", sessionId);

        logger.info("Generating server key pair for session: {}", sessionId);
        String serverPublicKey = ecdhService.generateKeyPair(sessionId);
        logger.info("Server key pair generated successfully for session: {}", sessionId);
        logger.debug("Server public key (base64): {}", serverPublicKey);

        Map<String, String> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("serverPublicKey", serverPublicKey);

        logger.info("ECDH handshake initiated successfully for session: {}", sessionId);
        logger.debug("Response: sessionId={}, publicKeyLength={}",
                sessionId, serverPublicKey.length());

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Complete ECDH handshake",
            description = "Completes the ECDH key exchange by computing the shared secret using the client's public key")
    @PostMapping("/complete-handshake")
    public ResponseEntity<?> completeHandshake(@RequestBody Map<String, String> request) {
        String sessionId = request.get("sessionId");
        String clientPublicKey = request.get("clientPublicKey");

        logger.info("Received request to complete ECDH handshake for session: {}", sessionId);
        logger.debug("Request parameters: sessionId={}, clientPublicKeyLength={}",
                sessionId, clientPublicKey != null ? clientPublicKey.length() : "null");

        if (sessionId == null || clientPublicKey == null) {
            logger.warn("Missing required parameters for session: {}", sessionId);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Missing required parameters");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        if (!ecdhService.hasKeyPair(sessionId)) {
            logger.warn("Invalid or expired session: {}", sessionId);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid or expired session");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        try {
            logger.info("Computing shared secret for session: {}", sessionId);
            String sharedSecret = ecdhService.computeSharedSecret(sessionId, clientPublicKey);
            logger.info("Shared secret computed successfully for session: {}", sessionId);

            if (logger.isDebugEnabled()) {
                // Print first few characters of the shared secret for debugging
                String secretPreview = sharedSecret.length() > 10
                        ? sharedSecret.substring(0, 10) + "..."
                        : sharedSecret;
                logger.debug("Shared secret preview for session {}: {}", sessionId, secretPreview);
            }

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Handshake completed successfully");

            // For development purposes, you might want to return the shared secret
            // In production, you would NOT return the shared secret to the client
            if (System.getProperty("dev.mode") != null) {
                logger.debug("DEV MODE: Including shared secret in response");
                response.put("sharedSecret", sharedSecret);
            }

            logger.info("ECDH handshake completed successfully for session: {}", sessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error completing handshake for session {}: {}", sessionId, e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error completing handshake: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}