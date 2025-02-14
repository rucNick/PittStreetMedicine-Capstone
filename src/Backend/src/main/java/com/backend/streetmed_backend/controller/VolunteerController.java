package com.backend.streetmed_backend.controller;

import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.entity.user_entity.UserMetadata;
import com.backend.streetmed_backend.entity.user_entity.VolunteerApplication;
import com.backend.streetmed_backend.service.VolunteerApplicationService;
import com.backend.streetmed_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/volunteer")
public class VolunteerController {
    private final VolunteerApplicationService volunteerApplicationService;
    private final UserService userService;
    private final Executor authExecutor;
    private final Executor readOnlyExecutor;
    private static final String INITIAL_PASSWORD = "streetmed@pitt";

    @Autowired
    public VolunteerController(
            VolunteerApplicationService volunteerApplicationService,
            UserService userService,
            @Qualifier("authExecutor") Executor authExecutor,
            @Qualifier("readOnlyExecutor") Executor readOnlyExecutor) {
        this.volunteerApplicationService = volunteerApplicationService;
        this.userService = userService;
        this.authExecutor = authExecutor;
        this.readOnlyExecutor = readOnlyExecutor;
    }

    @PostMapping("/apply")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> submitApplication(
            @RequestBody Map<String, String> applicationData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Validate required fields
                if (applicationData.get("firstName") == null || applicationData.get("lastName") == null ||
                        applicationData.get("email") == null || applicationData.get("phone") == null) {
                    throw new RuntimeException("Missing required fields");
                }

                // Check if application already exists
                if (volunteerApplicationService.existsByEmail(applicationData.get("email"))) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "An application with this email already exists");
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
                }

                VolunteerApplication application = new VolunteerApplication(
                        applicationData.get("firstName"),
                        applicationData.get("lastName"),
                        applicationData.get("email"),
                        applicationData.get("phone")
                );

                // Set notes if provided in the application
                if (applicationData.containsKey("notes") && applicationData.get("notes") != null) {
                    application.setNotes(applicationData.get("notes"));
                }

                VolunteerApplication savedApplication = volunteerApplicationService.submitApplication(application);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Application submitted successfully");
                response.put("applicationId", savedApplication.getApplicationId());

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        }, authExecutor);
    }

    @GetMapping("/applications")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getAllApplications(
            @RequestHeader("Admin-Username") String adminUsername,
            @RequestHeader("Authentication-Status") String authStatus) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!"true".equals(authStatus)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                User admin = userService.findByUsername(adminUsername);
                if (admin == null || !"ADMIN".equals(admin.getRole())) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Unauthorized access");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                List<VolunteerApplication> applications = volunteerApplicationService.getAllApplications();
                Map<String, List<Map<String, Object>>> groupedApplications = new HashMap<>();
                groupedApplications.put("pending", new ArrayList<>());
                groupedApplications.put("approved", new ArrayList<>());
                groupedApplications.put("rejected", new ArrayList<>());

                for (VolunteerApplication app : applications) {
                    Map<String, Object> appInfo = new HashMap<>();
                    appInfo.put("applicationId", app.getApplicationId());
                    appInfo.put("firstName", app.getFirstName());
                    appInfo.put("lastName", app.getLastName());
                    appInfo.put("email", app.getEmail());
                    appInfo.put("phone", app.getPhone());
                    appInfo.put("status", app.getStatus());
                    appInfo.put("notes", app.getNotes());
                    appInfo.put("submissionDate", app.getSubmissionDate());

                    switch (app.getStatus()) {
                        case PENDING -> groupedApplications.get("pending").add(appInfo);
                        case APPROVED -> groupedApplications.get("approved").add(appInfo);
                        case REJECTED -> groupedApplications.get("rejected").add(appInfo);
                    }
                }

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("data", groupedApplications);

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, readOnlyExecutor);
    }

    @GetMapping("/pending")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getPendingApplications(
            @RequestHeader("Admin-Username") String adminUsername,
            @RequestHeader("Authentication-Status") String authStatus) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!"true".equals(authStatus)) {
                    throw new RuntimeException("Not authenticated");
                }

                User admin = userService.findByUsername(adminUsername);
                if (admin == null || !"ADMIN".equals(admin.getRole())) {
                    throw new RuntimeException("Unauthorized access");
                }

                List<VolunteerApplication> pendingApplications = volunteerApplicationService.getPendingApplications();
                List<Map<String, Object>> applicationList = new ArrayList<>();

                for (VolunteerApplication app : pendingApplications) {
                    Map<String, Object> appInfo = new HashMap<>();
                    appInfo.put("applicationId", app.getApplicationId());
                    appInfo.put("firstName", app.getFirstName());
                    appInfo.put("lastName", app.getLastName());
                    appInfo.put("email", app.getEmail());
                    appInfo.put("phone", app.getPhone());
                    appInfo.put("notes", app.getNotes());
                    appInfo.put("submissionDate", app.getSubmissionDate());
                    applicationList.add(appInfo);
                }

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("data", applicationList);

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, readOnlyExecutor);
    }

    @GetMapping("/application/status/{email}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> checkApplicationStatus(
            @PathVariable String email) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Optional<VolunteerApplication> applicationOpt = volunteerApplicationService.findByEmail(email);

                if (applicationOpt.isEmpty()) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "No application found for this email");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                VolunteerApplication application = applicationOpt.get();
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("applicationId", application.getApplicationId());
                response.put("firstName", application.getFirstName());
                response.put("lastName", application.getLastName());
                response.put("email", application.getEmail());
                response.put("phone", application.getPhone());
                response.put("applicationStatus", application.getStatus());
                response.put("notes", application.getNotes());
                response.put("submissionDate", application.getSubmissionDate());

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, readOnlyExecutor);
    }

    @PostMapping("/approve")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> approveApplication(
            @RequestBody Map<String, String> approvalData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String adminUsername = approvalData.get("adminUsername");
                String authStatus = approvalData.get("authenticated");
                String applicationId = approvalData.get("applicationId");

                if (adminUsername == null || authStatus == null || applicationId == null) {
                    throw new RuntimeException("Missing required fields");
                }

                if (!"true".equals(authStatus)) {
                    throw new RuntimeException("Not authenticated");
                }

                User admin = userService.findByUsername(adminUsername);
                if (admin == null || !"ADMIN".equals(admin.getRole())) {
                    throw new RuntimeException("Unauthorized access");
                }

                Optional<VolunteerApplication> applicationOpt = volunteerApplicationService
                        .getApplicationById(Integer.parseInt(applicationId));
                if (applicationOpt.isEmpty()) {
                    throw new RuntimeException("Application not found");
                }

                VolunteerApplication application = applicationOpt.get();

                // Create new user account for the volunteer
                User newVolunteer = new User();
                newVolunteer.setUsername(application.getEmail());
                newVolunteer.setEmail(application.getEmail());
                newVolunteer.setPassword(INITIAL_PASSWORD);
                newVolunteer.setPhone(application.getPhone());
                newVolunteer.setRole("VOLUNTEER");

                // Create and properly set up metadata with all required fields
                UserMetadata metadata = new UserMetadata();
                metadata.setFirstName(application.getFirstName());
                metadata.setLastName(application.getLastName());
                metadata.setCreatedAt(LocalDateTime.now());  // Explicitly set creation time
                metadata.setLastLogin(LocalDateTime.now());  // Set initial last login
                metadata.setUser(newVolunteer);  // Set up bidirectional relationship

                newVolunteer.setMetadata(metadata);  // This will handle the bidirectional relationship

                User savedVolunteer = userService.createUser(newVolunteer);

                // Approve the application and link it to the new user
                VolunteerApplication approvedApplication = volunteerApplicationService
                        .approveApplication(Integer.parseInt(applicationId), savedVolunteer);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Application approved and volunteer account created");
                response.put("applicationId", approvedApplication.getApplicationId());
                response.put("userId", savedVolunteer.getUserId());
                response.put("initialPassword", INITIAL_PASSWORD);

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, authExecutor);
    }

    @PostMapping("/reject")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> rejectApplication(
            @RequestBody Map<String, String> rejectData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String adminUsername = rejectData.get("adminUsername");
                String authStatus = rejectData.get("authenticated");
                String applicationId = rejectData.get("applicationId");

                if (adminUsername == null || authStatus == null || applicationId == null) {
                    throw new RuntimeException("Missing required fields");
                }

                if (!"true".equals(authStatus)) {
                    throw new RuntimeException("Not authenticated");
                }

                User admin = userService.findByUsername(adminUsername);
                if (admin == null || !"ADMIN".equals(admin.getRole())) {
                    throw new RuntimeException("Unauthorized access");
                }

                VolunteerApplication rejectedApplication = volunteerApplicationService
                        .rejectApplication(Integer.parseInt(applicationId));

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Application rejected");
                response.put("applicationId", rejectedApplication.getApplicationId());

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