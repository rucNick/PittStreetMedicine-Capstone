package com.backend.streetmed_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final Executor emailExecutor;

    @Value("${email.service.enabled:false}")
    private boolean emailServiceEnabled;

    // Store OTP codes with expiration timestamps
    private final Map<String, OtpData> otpMap = new HashMap<>();

    private static class OtpData {
        private final String otp;
        private final long expirationTime;

        public OtpData(String otp, long expirationTime) {
            this.otp = otp;
            this.expirationTime = expirationTime;
        }

        public String getOtp() {
            return otp;
        }

        public long getExpirationTime() {
            return expirationTime;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expirationTime;
        }
    }

    @Autowired
    public EmailService(JavaMailSender mailSender,
                        @Qualifier("emailExecutor") Executor emailExecutor) {
        this.mailSender = mailSender;
        this.emailExecutor = emailExecutor;
    }

    // 1. Password Recovery - Generate and send OTP
    public String sendPasswordRecoveryEmail(String email) {
        // Generate a 6-digit OTP
        String otp = generateOtp();

        // Store OTP with 15-minute expiration
        long expirationTime = System.currentTimeMillis() + (15 * 60 * 1000);
        otpMap.put(email, new OtpData(otp, expirationTime));

        if (emailServiceEnabled) {
            CompletableFuture.runAsync(() -> {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(email);
                    message.setSubject("StreetMed@Pitt Password Recovery");
                    message.setText("Your password recovery code is: " + otp + "\n\n" +
                            "This code will expire in 15 minutes. If you did not request this code, please ignore this email.");

                    mailSender.send(message);
                    logger.info("Password recovery email sent to: {}", email);
                } catch (Exception e) {
                    logger.error("Failed to send password recovery email to {}: {}", email, e.getMessage());
                }
            }, emailExecutor);
        } else {
            logger.info("Email service is disabled. Would have sent password recovery OTP: {} to: {}", otp, email);
        }

        return otp;
    }

    // 2. New User Creation - Send credentials
    public void sendNewUserCredentials(String email, String username, String password) {
        if (emailServiceEnabled) {
            CompletableFuture.runAsync(() -> {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(email);
                    message.setSubject("Welcome to StreetMed - Your Account Details");
                    message.setText("Hello " + username + ",\n\n" +
                            "Your account on StreetMed has been created by an administrator.\n\n" +
                            "Your login credentials are:\n" +
                            "Username: " + username + "\n" +
                            "Password: " + password + "\n\n" +
                            "Please log in and change your password at your earliest convenience for security reasons.\n\n" +
                            "Best regards,\n" +
                            "StreetMed@Pitt Team");

                    mailSender.send(message);
                    logger.info("User credentials email sent to: {}", email);
                } catch (Exception e) {
                    logger.error("Failed to send user credentials email to {}: {}", email, e.getMessage());
                }
            }, emailExecutor);
        } else {
            logger.info("Email service is disabled. Would have sent credentials for user: {} to: {}", username, email);
        }
    }

    // 3. Volunteer Application Approval
    public void sendVolunteerApprovalEmail(String email, String firstName, String lastName) {
        if (emailServiceEnabled) {
            CompletableFuture.runAsync(() -> {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(email);
                    message.setSubject("StreetMed Volunteer Application Approved");
                    message.setText("Dear " + firstName + " " + lastName + ",\n\n" +
                            "We are pleased to inform you that your application to volunteer with StreetMed has been approved!\n\n" +
                            "Your login credentials are:\n" +
                            "Username: " + email + "\n" +
                            "Password: streetmed@pitt\n\n" +
                            "Please log in and change your password at your earliest convenience for security reasons.\n\n" +
                            "Thank you for joining our team. We look forward to working with you!\n\n" +
                            "Best regards,\n" +
                            "StreetMed@Pitt Team");

                    mailSender.send(message);
                    logger.info("Volunteer approval email sent to: {}", email);
                } catch (Exception e) {
                    logger.error("Failed to send volunteer approval email to {}: {}", email, e.getMessage());
                }
            }, emailExecutor);
        } else {
            logger.info("Email service is disabled. Would have sent volunteer approval email to: {} ({} {})",
                    email, firstName, lastName);
        }
    }

    // Verify OTP
    public boolean verifyOtp(String email, String otp) {
        OtpData otpData = otpMap.get(email);

        if (otpData == null || otpData.isExpired()) {
            return false;
        }

        boolean isValid = otpData.getOtp().equals(otp);

        // Remove OTP after verification (whether successful or not)
        if (isValid || otpData.isExpired()) {
            otpMap.remove(email);
        }

        return isValid;
    }

    // Helper method to generate a 6-digit OTP
    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // Generates a 6-digit number
        return String.valueOf(otp);
    }

    // Check if email service is enabled
    public boolean isEmailServiceEnabled() {
        return emailServiceEnabled;
    }

    // Set email service status
    public void setEmailServiceEnabled(boolean enabled) {
        this.emailServiceEnabled = enabled;
        logger.info("Email service status set to: {}", enabled ? "enabled" : "disabled");
    }
}