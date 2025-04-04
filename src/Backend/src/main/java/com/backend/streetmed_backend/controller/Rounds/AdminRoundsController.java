package com.backend.streetmed_backend.controller.Rounds;

import com.backend.streetmed_backend.entity.rounds_entity.Rounds;
import com.backend.streetmed_backend.entity.rounds_entity.RoundSignup;
import com.backend.streetmed_backend.service.RoundsService;
import com.backend.streetmed_backend.service.RoundSignupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Tag(name = "Admin Rounds Management", description = "APIs for administrators to manage street medicine rounds")
@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/admin/rounds")
public class AdminRoundsController {
    private final RoundsService roundsService;
    private final RoundSignupService roundSignupService;
    private final Executor asyncExecutor;

    @Autowired
    public AdminRoundsController(RoundsService roundsService,
                                 RoundSignupService roundSignupService,
                                 @Qualifier("authExecutor") Executor asyncExecutor) {
        this.roundsService = roundsService;
        this.roundSignupService = roundSignupService;
        this.asyncExecutor = asyncExecutor;
    }

    @Operation(summary = "Create a new rounds schedule",
            description = "Creates a new rounds schedule with the provided details. Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Round created successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping("/create")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> createRound(
            @RequestBody @Schema(example = """
            {
                "authenticated": true,
                "adminUsername": "admin",
                "title": "Downtown Outreach",
                "description": "Medical outreach in downtown area",
                "startTime": "2024-04-15T18:00:00",
                "endTime": "2024-04-15T21:00:00",
                "location": "Market Square",
                "maxParticipants": 5
            }
            """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String adminUsername = (String) requestData.get("adminUsername");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                // Create a new round object
                Rounds round = new Rounds();
                round.setTitle((String) requestData.get("title"));
                round.setDescription((String) requestData.get("description"));

                // Parse dates
                String startTimeStr = (String) requestData.get("startTime");
                String endTimeStr = (String) requestData.get("endTime");
                if (startTimeStr == null || endTimeStr == null) {
                    throw new IllegalArgumentException("Start time and end time are required");
                }

                round.setStartTime(java.time.LocalDateTime.parse(startTimeStr));
                round.setEndTime(java.time.LocalDateTime.parse(endTimeStr));

                round.setLocation((String) requestData.get("location"));
                round.setMaxParticipants((Integer) requestData.get("maxParticipants"));

                // Optional fields
                if (requestData.containsKey("teamLeadId")) {
                    round.setTeamLeadId((Integer) requestData.get("teamLeadId"));
                }
                if (requestData.containsKey("clinicianId")) {
                    round.setClinicianId((Integer) requestData.get("clinicianId"));
                }

                Rounds savedRound = roundsService.createRound(round);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Round created successfully");
                response.put("roundId", savedRound.getRoundId());

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Update a rounds schedule",
            description = "Updates an existing rounds schedule. Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Round updated successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only"),
            @ApiResponse(responseCode = "404", description = "Round not found")
    })
    @PutMapping("/{roundId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> updateRound(
            @PathVariable Integer roundId,
            @RequestBody @Schema(example = """
            {
                "authenticated": true,
                "adminUsername": "admin",
                "title": "Updated Downtown Outreach",
                "description": "Updated description",
                "startTime": "2024-04-15T19:00:00",
                "endTime": "2024-04-15T22:00:00",
                "location": "Updated location",
                "maxParticipants": 6,
                "status": "SCHEDULED"
            }
            """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String adminUsername = (String) requestData.get("adminUsername");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                // Fetch current round
                Rounds existingRound = roundsService.getRound(roundId);

                // Update round fields
                if (requestData.containsKey("title")) {
                    existingRound.setTitle((String) requestData.get("title"));
                }
                if (requestData.containsKey("description")) {
                    existingRound.setDescription((String) requestData.get("description"));
                }
                if (requestData.containsKey("startTime")) {
                    existingRound.setStartTime(java.time.LocalDateTime.parse((String) requestData.get("startTime")));
                }
                if (requestData.containsKey("endTime")) {
                    existingRound.setEndTime(java.time.LocalDateTime.parse((String) requestData.get("endTime")));
                }
                if (requestData.containsKey("location")) {
                    existingRound.setLocation((String) requestData.get("location"));
                }
                if (requestData.containsKey("maxParticipants")) {
                    existingRound.setMaxParticipants((Integer) requestData.get("maxParticipants"));
                }
                if (requestData.containsKey("teamLeadId")) {
                    existingRound.setTeamLeadId((Integer) requestData.get("teamLeadId"));
                }
                if (requestData.containsKey("clinicianId")) {
                    existingRound.setClinicianId((Integer) requestData.get("clinicianId"));
                }
                if (requestData.containsKey("status")) {
                    existingRound.setStatus((String) requestData.get("status"));
                }

                Rounds updatedRound = roundsService.updateRound(roundId, existingRound);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Round updated successfully");
                response.put("roundId", updatedRound.getRoundId());

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Cancel a round",
            description = "Cancels an existing round and notifies all participants. Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Round cancelled successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only"),
            @ApiResponse(responseCode = "404", description = "Round not found")
    })
    @PostMapping("/{roundId}/cancel")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> cancelRound(
            @PathVariable Integer roundId,
            @RequestBody @Schema(example = """
            {
                "authenticated": true,
                "adminUsername": "admin"
            }
            """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String adminUsername = (String) requestData.get("adminUsername");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                Rounds cancelledRound = roundsService.cancelRound(roundId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Round cancelled successfully");
                response.put("roundId", cancelledRound.getRoundId());

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Get all rounds",
            description = "Retrieves all rounds. Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rounds retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only")
    })
    @GetMapping("/all")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getAllRounds(
            @RequestParam("authenticated") Boolean authenticated,
            @RequestParam("adminUsername") String adminUsername) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                List<Rounds> allRounds = roundsService.getAllScheduledRounds();

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("rounds", allRounds);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Get upcoming rounds",
            description = "Retrieves all upcoming rounds (those with start time in the future). Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rounds retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only")
    })
    @GetMapping("/upcoming")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getUpcomingRounds(
            @RequestParam("authenticated") Boolean authenticated,
            @RequestParam("adminUsername") String adminUsername) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                List<Rounds> upcomingRounds = roundsService.getUpcomingRounds();

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("rounds", upcomingRounds);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Get round details",
            description = "Retrieves details for a specific round including all signups. Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Round details retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only"),
            @ApiResponse(responseCode = "404", description = "Round not found")
    })
    @GetMapping("/{roundId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getRoundDetails(
            @PathVariable Integer roundId,
            @RequestParam("authenticated") Boolean authenticated,
            @RequestParam("adminUsername") String adminUsername) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                Rounds round = roundsService.getRound(roundId);
                List<Map<String, Object>> signups = roundSignupService.getAllSignupsForRound(roundId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("round", round);
                response.put("signups", signups);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Run lottery for a round",
            description = "Runs the lottery to fill available slots from the waitlist. Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lottery run successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only"),
            @ApiResponse(responseCode = "404", description = "Round not found")
    })
    @PostMapping("/{roundId}/lottery")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> runLottery(
            @PathVariable Integer roundId,
            @RequestBody @Schema(example = """
            {
                "authenticated": true,
                "adminUsername": "admin"
            }
            """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String adminUsername = (String) requestData.get("adminUsername");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                List<RoundSignup> selectedSignups = roundSignupService.runLotteryForRound(roundId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Lottery run successfully");
                response.put("selectedVolunteers", selectedSignups.size());

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Confirm a waitlisted volunteer",
            description = "Manually confirms a waitlisted volunteer for a round. Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Volunteer confirmed successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only"),
            @ApiResponse(responseCode = "404", description = "Signup not found")
    })
    @PostMapping("/signup/{signupId}/confirm")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> confirmSignup(
            @PathVariable Integer signupId,
            @RequestBody @Schema(example = """
            {
                "authenticated": true,
                "adminUsername": "admin",
                "adminId": 1
            }
            """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String adminUsername = (String) requestData.get("adminUsername");
                Integer adminId = (Integer) requestData.get("adminId");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                RoundSignup confirmedSignup = roundSignupService.adminConfirmSignup(signupId, adminId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Volunteer confirmed successfully");
                response.put("signupId", confirmedSignup.getSignupId());
                response.put("status", confirmedSignup.getStatus());

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Reject a volunteer signup",
            description = "Rejects a volunteer signup for a round. Only accessible by administrators.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Volunteer rejected successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Unauthorized - Admin access only"),
            @ApiResponse(responseCode = "404", description = "Signup not found")
    })
    @PostMapping("/signup/{signupId}/reject")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> rejectSignup(
            @PathVariable Integer signupId,
            @RequestBody @Schema(example = """
            {
                "authenticated": true,
                "adminUsername": "admin",
                "adminId": 1
            }
            """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                String adminUsername = (String) requestData.get("adminUsername");
                Integer adminId = (Integer) requestData.get("adminId");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                RoundSignup rejectedSignup = roundSignupService.adminRejectSignup(signupId, adminId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Volunteer rejected successfully");
                response.put("signupId", rejectedSignup.getSignupId());
                response.put("status", rejectedSignup.getStatus());

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }
}