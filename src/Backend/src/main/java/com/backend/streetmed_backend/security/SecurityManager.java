package com.backend.streetmed_backend.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SecurityManager {
    private static final Logger logger = LoggerFactory.getLogger(SecurityManager.class);

    private final ECDHService ecdhService;
    private final EncryptionUtil encryptionUtil;

    // Store derived session keys
    private final Map<String, SecretKey> sessionKeys = new ConcurrentHashMap<>();

    @Autowired
    public SecurityManager(ECDHService ecdhService, EncryptionUtil encryptionUtil) {
        this.ecdhService = ecdhService;
        this.encryptionUtil = encryptionUtil;

        // You can enable logging for development/testing
        // EncryptionUtil.setLogEnabled(true);

        logger.info("SecurityManager initialized");
    }

    /**
     * Gets the secret key for the session
     */
    public SecretKey getSessionKey(String sessionId) {
        return sessionKeys.get(sessionId);
    }

    /**
     * Completes the handshake and derives a session key
     */
    public void completeHandshake(String sessionId, String clientPublicKey) {
        try {
            String sharedSecret = ecdhService.computeSharedSecret(sessionId, clientPublicKey);
            SecretKey key = encryptionUtil.deriveKey(sharedSecret);
            sessionKeys.put(sessionId, key);
            logger.info("Handshake completed and session key derived for session: {}", sessionId);
        } catch (Exception e) {
            logger.error("Failed to complete handshake: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Encrypts data for a specific session
     */
    public String encrypt(String sessionId, String data) {
        SecretKey key = sessionKeys.get(sessionId);
        if (key == null) {
            logger.error("No key found for session: {}", sessionId);
            throw new IllegalStateException("Session key not found: " + sessionId);
        }
        return encryptionUtil.encrypt(data, key);
    }

    /**
     * Decrypts data for a specific session
     */
    public String decrypt(String sessionId, String encryptedData) {
        SecretKey key = sessionKeys.get(sessionId);
        if (key == null) {
            logger.error("No key found for session: {}", sessionId);
            throw new IllegalStateException("Session key not found: " + sessionId);
        }
        return encryptionUtil.decrypt(encryptedData, key);
    }

    /**
     * Removes session data during cleanup
     */
    public void removeSession(String sessionId) {
        sessionKeys.remove(sessionId);
        ecdhService.removeKeyPair(sessionId);
        logger.info("Session data removed for session: {}", sessionId);
    }
}