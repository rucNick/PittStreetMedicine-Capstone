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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Tag(name = "Volunteer Rounds Management", description = "APIs for volunteers to view and sign up for street medicine rounds")
@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/rounds")
public class VolunteerRoundsController {
    private final RoundsService roundsService;
    private final RoundSignupService roundSignupService;
    private final Executor asyncExecutor;

    @Autowired
    public VolunteerRoundsController(RoundsService roundsService,
                                     RoundSignupService roundSignupService,
                                     @Qualifier("authExecutor") Executor asyncExecutor) {
        this.roundsService = roundsService;
        this.roundSignupService = roundSignupService;
        this.asyncExecutor = asyncExecutor;
    }

    @Operation(summary = "Get all upcoming rounds",
            description = "Retrieves all upcoming rounds with basic information for frontend display.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rounds retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @GetMapping("/all")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getAllUpcomingRounds(
            @RequestParam("authenticated") Boolean authenticated,
            @RequestParam("userId") Integer userId,
            @RequestParam("userRole") String userRole) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                List<Rounds> upcomingRounds = roundsService.getUpcomingRounds();
                List<Map<String, Object>> roundsWithAvailability = new ArrayList<>();

                for (Rounds round : upcomingRounds) {
                    Map<String, Object> roundInfo = new HashMap<>();
                    roundInfo.put("roundId", round.getRoundId());
                    roundInfo.put("title", round.getTitle());
                    roundInfo.put("description", round.getDescription());
                    roundInfo.put("startTime", round.getStartTime());
                    roundInfo.put("endTime", round.getEndTime());
                    roundInfo.put("location", round.getLocation());
                    roundInfo.put("status", round.getStatus());

                    // Check if round has available slots
                    long confirmedVolunteers = roundSignupService.countConfirmedVolunteersForRound(round.getRoundId());
                    int availableSlots = round.getMaxParticipants() - (int)confirmedVolunteers;
                    boolean openForSignup = availableSlots > 0;

                    roundInfo.put("totalSlots", round.getMaxParticipants());
                    roundInfo.put("confirmedVolunteers", confirmedVolunteers);
                    roundInfo.put("availableSlots", availableSlots);
                    roundInfo.put("openForSignup", openForSignup);

                    // Check if this user has already signed up
                    boolean userSignedUp = roundSignupService.isUserSignedUp(round.getRoundId(), userId);
                    roundInfo.put("userSignedUp", userSignedUp);

                    // Check if user is team lead or clinician for this round
                    boolean isTeamLead = false;
                    boolean isClinician = false;

                    if (userSignedUp) {
                        // Get user's signup for this round
                        RoundSignup signup = roundSignupService.findByRoundIdAndUserId(round.getRoundId(), userId)
                                .orElse(null);

                        if (signup != null) {
                            isTeamLead = "TEAM_LEAD".equals(signup.getRole());
                            isClinician = "CLINICIAN".equals(signup.getRole());
                        }
                    }

                    roundInfo.put("isTeamLead", isTeamLead);
                    roundInfo.put("isClinician", isClinician);

                    roundsWithAvailability.add(roundInfo);
                }

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("rounds", roundsWithAvailability);
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Get round details",
            description = "Retrieves details for a specific round including availability.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Round details retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "404", description = "Round not found")
    })
    @GetMapping("/{roundId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getRoundDetails(
            @PathVariable Integer roundId,
            @RequestParam("authenticated") Boolean authenticated,
            @RequestParam("userId") Integer userId,
            @RequestParam("userRole") String userRole) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                // Get round details from service
                Map<String, Object> roundDetails = roundsService.getRoundWithDetails(roundId);

                // Get participant counts
                Rounds round = roundsService.getRound(roundId);
                long confirmedVolunteers = roundSignupService.countConfirmedVolunteersForRound(roundId);
                int availableSlots = round.getMaxParticipants() - (int)confirmedVolunteers;

                roundDetails.put("confirmedVolunteers", confirmedVolunteers);
                roundDetails.put("availableSlots", availableSlots);
                roundDetails.put("openForSignup", availableSlots > 0);

                // Check if this user has already signed up
                boolean userSignedUp = roundSignupService.isUserSignedUp(roundId, userId);
                roundDetails.put("userSignedUp", userSignedUp);

                // If user is signed up, get signup details
                if (userSignedUp) {
                    Map<String, Object> signupDetails = roundSignupService.getUserSignupDetails(roundId, userId);
                    roundDetails.put("signupDetails", signupDetails);
                }

                // Check if team lead and clinician roles are filled
                roundDetails.put("hasTeamLead", roundSignupService.hasTeamLead(roundId));
                roundDetails.put("hasClinician", roundSignupService.hasClinician(roundId));

                // Check if user is team lead or clinician for this round
                boolean isTeamLead = false;
                boolean isClinician = false;

                if (userSignedUp) {
                    // Get user's signup for this round
                    RoundSignup signup = roundSignupService.findByRoundIdAndUserId(roundId, userId)
                            .orElse(null);

                    if (signup != null) {
                        isTeamLead = "TEAM_LEAD".equals(signup.getRole());
                        isClinician = "CLINICIAN".equals(signup.getRole());
                    }
                }

                roundDetails.put("isTeamLead", isTeamLead);
                roundDetails.put("isClinician", isClinician);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("round", roundDetails);
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Get my rounds",
            description = "Retrieves all rounds that the volunteer has signed up for.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rounds retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @GetMapping("/my-rounds")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getMyRounds(
            @RequestParam("authenticated") Boolean authenticated,
            @RequestParam("userId") Integer userId,
            @RequestParam("userRole") String userRole) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                // Validate the user is a volunteer
                if (!"VOLUNTEER".equals(userRole)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "User must be a volunteer to view rounds");
                    errorResponse.put("authenticated", true);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                List<Map<String, Object>> myRounds = roundSignupService.getVolunteerSignups(userId);

                // Split into upcoming and past rounds
                List<Map<String, Object>> upcomingRounds = new ArrayList<>();
                List<Map<String, Object>> pastRounds = new ArrayList<>();

                LocalDateTime now = LocalDateTime.now();
                for (Map<String, Object> roundInfo : myRounds) {
                    Object startTimeObj = roundInfo.get("startTime");
                    if (startTimeObj instanceof LocalDateTime) {
                        LocalDateTime startTime = (LocalDateTime) startTimeObj;
                        if (startTime.isAfter(now)) {
                            upcomingRounds.add(roundInfo);
                        } else {
                            pastRounds.add(roundInfo);
                        }
                    }
                }

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("upcomingRounds", upcomingRounds);
                response.put("pastRounds", pastRounds);
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Sign up for a round",
            description = "Allows a volunteer to sign up for a round. If the round is full, they will be added to the waitlist.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signed up successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "404", description = "Round not found")
    })
    @PostMapping("/{roundId}/signup")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> signupForRound(
            @PathVariable Integer roundId,
            @RequestBody @Schema(example = """
            {
                "authenticated": true,
                "userId": 1,
                "userRole": "VOLUNTEER",
                "requestedRole": "VOLUNTEER"
            }
            """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                Integer userId = (Integer) requestData.get("userId");
                String userRole = (String) requestData.get("userRole");
                String requestedRole = (String) requestData.get("requestedRole");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                // Validate the user is a volunteer
                if (!"VOLUNTEER".equals(userRole)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "User must be a volunteer to sign up for rounds");
                    errorResponse.put("authenticated", true);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                // Sign up for the round
                RoundSignup signup = roundSignupService.signupForRound(roundId, userId, requestedRole);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Signup successful");
                response.put("signupId", signup.getSignupId());
                response.put("signupStatus", signup.getStatus());
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                } else if (e.getMessage().contains("already signed up")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }

    @Operation(summary = "Cancel signup for a round",
            description = "Allows a volunteer to cancel their signup for a round. Must be at least 24 hours before the round start time.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signup cancelled successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "400", description = "Cannot cancel less than 24 hours before"),
            @ApiResponse(responseCode = "404", description = "Signup not found")
    })
    @PostMapping("/signup/{signupId}/cancel")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> cancelSignup(
            @PathVariable Integer signupId,
            @RequestBody @Schema(example = """
            {
                "authenticated": true,
                "userId": 1,
                "userRole": "VOLUNTEER"
            }
            """) Map<String, Object> requestData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Boolean authenticated = (Boolean) requestData.get("authenticated");
                Integer userId = (Integer) requestData.get("userId");
                String userRole = (String) requestData.get("userRole");

                if (!Boolean.TRUE.equals(authenticated)) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Not authenticated");
                    errorResponse.put("authenticated", false);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                }

                // Cancel the signup
                roundSignupService.cancelSignup(signupId, userId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Signup cancelled successfully");
                response.put("authenticated", true);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("authenticated", true);

                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                } else if (e.getMessage().contains("24 hours")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                } else if (e.getMessage().contains("Unauthorized")) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }, asyncExecutor);
    }
}