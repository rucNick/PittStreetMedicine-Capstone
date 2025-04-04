package com.backend.streetmed_backend.service;

import com.backend.streetmed_backend.entity.rounds_entity.Rounds;
import com.backend.streetmed_backend.entity.rounds_entity.RoundSignup;
import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.entity.user_entity.VolunteerSubRole;
import com.backend.streetmed_backend.repository.Rounds.RoundsRepository;
import com.backend.streetmed_backend.repository.Rounds.RoundSignupRepository;
import com.backend.streetmed_backend.repository.User.UserRepository;
import com.backend.streetmed_backend.repository.User.VolunteerSubRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
@Transactional
public class RoundSignupService {
    private final RoundsRepository roundsRepository;
    private final RoundSignupRepository roundSignupRepository;
    private final UserRepository userRepository;
    private final VolunteerSubRoleRepository volunteerSubRoleRepository;
    private final EmailService emailService;
    private final Random random = new Random();
    private static final Logger logger = LoggerFactory.getLogger(RoundSignupService.class);

    @Autowired
    public RoundSignupService(RoundsRepository roundsRepository,
                              RoundSignupRepository roundSignupRepository,
                              UserRepository userRepository,
                              VolunteerSubRoleRepository volunteerSubRoleRepository,
                              EmailService emailService) {
        this.roundsRepository = roundsRepository;
        this.roundSignupRepository = roundSignupRepository;
        this.userRepository = userRepository;
        this.volunteerSubRoleRepository = volunteerSubRoleRepository;
        this.emailService = emailService;
    }

    /**
     * Volunteer signup for a round
     */
    @Transactional
    public RoundSignup signupForRound(Integer roundId, Integer userId, String requestedRole) {
        Rounds round = roundsRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is a volunteer
        if (!"VOLUNTEER".equals(user.getRole())) {
            throw new RuntimeException("Only volunteers can sign up for rounds");
        }

        // Check if the round is in the future
        if (round.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot sign up for past rounds");
        }

        // Check if the round is scheduled (not canceled)
        if (!"SCHEDULED".equals(round.getStatus())) {
            throw new RuntimeException("Cannot sign up for " + round.getStatus().toLowerCase() + " rounds");
        }

        // Check if user already signed up for this round
        if (roundSignupRepository.existsByRoundIdAndUserId(roundId, userId)) {
            throw new RuntimeException("You have already signed up for this round");
        }

        // Determine role and validate it
        String role = determineUserRole(userId, requestedRole);

        RoundSignup signup = new RoundSignup(roundId, userId, role);
        signup.setSignupTime(LocalDateTime.now());

        // Special handling for TEAM_LEAD and CLINICIAN roles
        if ("TEAM_LEAD".equals(role)) {
            handleTeamLeadSignup(round, userId, signup);
        } else if ("CLINICIAN".equals(role)) {
            handleClinicianSignup(round, userId, signup);
        } else {
            // Regular volunteer signup
            handleRegularVolunteerSignup(round, signup);
        }

        RoundSignup savedSignup = roundSignupRepository.save(signup);

        // Send confirmation email
        if (emailService.isEmailServiceEnabled() && user.getEmail() != null) {
            String status = savedSignup.getStatus();
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("roundTitle", round.getTitle());
            emailData.put("startTime", round.getStartTime());
            emailData.put("location", round.getLocation());
            emailData.put("status", status);

            // Send email notification in a non-blocking way
            CompletableFuture.runAsync(() -> {
                try {
                    emailService.sendRoundSignupConfirmationEmail(user.getEmail(), emailData);
                } catch (Exception e) {
                    logger.error("Failed to send signup confirmation email to {}: {}", user.getEmail(), e.getMessage());
                }
            });
        }

        return savedSignup;
    }

    /**
     * Determine the appropriate role for a user
     */
    private String determineUserRole(Integer userId, String requestedRole) {
        if (requestedRole == null || requestedRole.isEmpty()) {
            return "VOLUNTEER";
        }

        switch (requestedRole.toUpperCase()) {
            case "TEAM_LEAD":
                if (!volunteerSubRoleRepository.existsByUserIdAndSubRole(userId, VolunteerSubRole.SubRoleType.TEAM_LEAD)) {
                    throw new RuntimeException("User does not have TEAM_LEAD privileges");
                }
                return "TEAM_LEAD";
            case "CLINICIAN":
                if (!volunteerSubRoleRepository.existsByUserIdAndSubRole(userId, VolunteerSubRole.SubRoleType.CLINICIAN)) {
                    throw new RuntimeException("User does not have CLINICIAN privileges");
                }
                return "CLINICIAN";
            default:
                return "VOLUNTEER";
        }
    }

    /**
     * Handle signup for Team Lead role
     */
    private void handleTeamLeadSignup(Rounds round, Integer userId, RoundSignup signup) {
        // If already has a team lead, reject
        if (round.getTeamLeadId() != null) {
            throw new RuntimeException("This round already has a team lead assigned");
        }

        // Assign user as team lead
        round.setTeamLeadId(userId);
        roundsRepository.save(round);

        // Confirm signup immediately
        signup.setStatus("CONFIRMED");
    }

    /**
     * Handle signup for Clinician role
     */
    private void handleClinicianSignup(Rounds round, Integer userId, RoundSignup signup) {
        // If already has a clinician, reject
        if (round.getClinicianId() != null) {
            throw new RuntimeException("This round already has a clinician assigned");
        }

        // Assign user as clinician
        round.setClinicianId(userId);
        roundsRepository.save(round);

        // Confirm signup immediately
        signup.setStatus("CONFIRMED");
    }

    /**
     * Handle signup for regular volunteer
     */
    private void handleRegularVolunteerSignup(Rounds round, RoundSignup signup) {
        // Count existing confirmed participants
        long confirmedParticipants = roundSignupRepository.countConfirmedVolunteersForRound(round.getRoundId());

        // Check if there's space available
        if (confirmedParticipants < round.getMaxParticipants()) {
            // Space available, confirm immediately
            signup.setStatus("CONFIRMED");
        } else {
            // No space, add to waitlist with lottery number
            signup.setStatus("WAITLISTED");
            signup.setLotteryNumber(generateLotteryNumber());
        }
    }

    /**
     * Generate a random lottery number for the waitlist
     */
    private Integer generateLotteryNumber() {
        return random.nextInt(10000);
    }

    /**
     * Run the lottery to fill available slots
     */
    @Transactional
    public List<RoundSignup> runLotteryForRound(Integer roundId) {
        Rounds round = roundsRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found"));

        // Calculate available slots
        long confirmedParticipants = roundSignupRepository.countConfirmedVolunteersForRound(roundId);
        int availableSlots = round.getMaxParticipants() - (int)confirmedParticipants;

        if (availableSlots <= 0) {
            return Collections.emptyList();
        }

        // Get waitlisted signups ordered by lottery number
        List<RoundSignup> waitlistedSignups = roundSignupRepository.findByRoundIdAndStatusOrderByLotteryNumberAsc(roundId, "WAITLISTED");

        List<RoundSignup> selectedSignups = new ArrayList<>();

        // Move volunteers from waitlist to confirmed
        for (int i = 0; i < Math.min(availableSlots, waitlistedSignups.size()); i++) {
            RoundSignup signup = waitlistedSignups.get(i);
            signup.setStatus("CONFIRMED");
            signup.setUpdatedAt(LocalDateTime.now());
            roundSignupRepository.save(signup);
            selectedSignups.add(signup);

            // Send confirmation email
            try {
                User user = userRepository.findById(signup.getUserId()).orElse(null);
                if (user != null && user.getEmail() != null && emailService.isEmailServiceEnabled()) {
                    Map<String, Object> emailData = new HashMap<>();
                    emailData.put("roundTitle", round.getTitle());
                    emailData.put("startTime", round.getStartTime());
                    emailData.put("location", round.getLocation());

                    // Send email notification in a non-blocking way
                    CompletableFuture.runAsync(() -> {
                        try {
                            emailService.sendLotteryWinEmail(user.getEmail(), emailData);
                        } catch (Exception e) {
                            logger.error("Failed to send lottery win email to {}: {}", user.getEmail(), e.getMessage());
                        }
                    });
                }
            } catch (Exception e) {
                logger.error("Error notifying user {} about lottery selection: {}", signup.getUserId(), e.getMessage());
            }
        }

        return selectedSignups;
    }

    /**
     * Cancel a signup (volunteer wants to quit)
     */
    @Transactional
    public void cancelSignup(Integer signupId, Integer userId) {
        RoundSignup signup = roundSignupRepository.findById(signupId)
                .orElseThrow(() -> new RuntimeException("Signup not found"));

        // Verify the signup belongs to the user
        if (!signup.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to cancel this signup");
        }

        Rounds round = roundsRepository.findById(signup.getRoundId())
                .orElseThrow(() -> new RuntimeException("Round not found"));

        // Check if cancellation is allowed (must be at least 24 hours before round)
        LocalDateTime now = LocalDateTime.now();
        if (ChronoUnit.HOURS.between(now, round.getStartTime()) < 24) {
            throw new RuntimeException("Cannot cancel signup less than 24 hours before the round");
        }

        // Handle special roles
        if ("TEAM_LEAD".equals(signup.getRole())) {
            round.setTeamLeadId(null);
            roundsRepository.save(round);
        } else if ("CLINICIAN".equals(signup.getRole())) {
            round.setClinicianId(null);
            roundsRepository.save(round);
        }

        // Delete the signup
        roundSignupRepository.delete(signup);

        // If this was a confirmed regular volunteer, run lottery to fill the spot
        if ("CONFIRMED".equals(signup.getStatus()) && "VOLUNTEER".equals(signup.getRole())) {
            runLotteryForRound(signup.getRoundId());
        }
    }

    /**
     * Get all signups for a round
     */
    public List<Map<String, Object>> getAllSignupsForRound(Integer roundId) {
        List<RoundSignup> signups = roundSignupRepository.findByRoundId(roundId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (RoundSignup signup : signups) {
            Map<String, Object> signupData = new HashMap<>();
            signupData.put("signupId", signup.getSignupId());
            signupData.put("userId", signup.getUserId());
            signupData.put("role", signup.getRole());
            signupData.put("status", signup.getStatus());
            signupData.put("signupTime", signup.getSignupTime());

            // Fetch user details
            try {
                User user = userRepository.findById(signup.getUserId()).orElse(null);
                if (user != null) {
                    signupData.put("username", user.getUsername());
                    signupData.put("email", user.getEmail());
                    signupData.put("phone", user.getPhone());
                    if (user.getMetadata() != null) {
                        signupData.put("firstName", user.getMetadata().getFirstName());
                        signupData.put("lastName", user.getMetadata().getLastName());
                    }
                }
            } catch (Exception e) {
                logger.error("Error fetching user details for signup {}: {}", signup.getSignupId(), e.getMessage());
            }

            result.add(signupData);
        }

        return result;
    }

    /**
     * Get all rounds a volunteer has signed up for
     */
    public List<Map<String, Object>> getVolunteerSignups(Integer userId) {
        List<RoundSignup> signups = roundSignupRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (RoundSignup signup : signups) {
            Map<String, Object> signupData = new HashMap<>();
            signupData.put("signupId", signup.getSignupId());
            signupData.put("roundId", signup.getRoundId());
            signupData.put("role", signup.getRole());
            signupData.put("status", signup.getStatus());
            signupData.put("signupTime", signup.getSignupTime());

            // Fetch round details
            try {
                Rounds round = roundsRepository.findById(signup.getRoundId()).orElse(null);
                if (round != null) {
                    signupData.put("roundTitle", round.getTitle());
                    signupData.put("startTime", round.getStartTime());
                    signupData.put("endTime", round.getEndTime());
                    signupData.put("location", round.getLocation());
                    signupData.put("roundStatus", round.getStatus());
                }
            } catch (Exception e) {
                logger.error("Error fetching round details for signup {}: {}", signup.getSignupId(), e.getMessage());
            }

            result.add(signupData);
        }

        return result;
    }

    /**
     * Admin override to confirm a waitlisted volunteer
     */
    @Transactional
    public RoundSignup adminConfirmSignup(Integer signupId, Integer adminId) {
        // Verify admin
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (!"ADMIN".equals(admin.getRole())) {
            throw new RuntimeException("Only admins can perform this operation");
        }

        RoundSignup signup = roundSignupRepository.findById(signupId)
                .orElseThrow(() -> new RuntimeException("Signup not found"));

        // Check if signup is waitlisted
        if (!"WAITLISTED".equals(signup.getStatus())) {
            throw new RuntimeException("Can only confirm waitlisted signups");
        }

        // Confirm the signup
        signup.setStatus("CONFIRMED");
        signup.setUpdatedAt(LocalDateTime.now());

        return roundSignupRepository.save(signup);
    }

    /**
     * Admin override to reject a waitlisted or confirmed volunteer
     */
    @Transactional
    public RoundSignup adminRejectSignup(Integer signupId, Integer adminId) {
        // Verify admin
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (!"ADMIN".equals(admin.getRole())) {
            throw new RuntimeException("Only admins can perform this operation");
        }

        RoundSignup signup = roundSignupRepository.findById(signupId)
                .orElseThrow(() -> new RuntimeException("Signup not found"));

        // Reject the signup
        signup.setStatus("REJECTED");
        signup.setUpdatedAt(LocalDateTime.now());

        return roundSignupRepository.save(signup);
    }

    /**
     * Get confirmed signups for a round
     */
    public List<RoundSignup> getConfirmedSignups(Integer roundId) {
        return roundSignupRepository.findByRoundIdAndStatusOrderBySignupTimeAsc(roundId, "CONFIRMED");
    }

    /**
     * Get waitlisted signups for a round
     */
    public List<RoundSignup> getWaitlistedSignups(Integer roundId) {
        return roundSignupRepository.findByRoundIdAndStatusOrderByLotteryNumberAsc(roundId, "WAITLISTED");
    }

    /**
     * Check if a user has already signed up for a round
     */
    public boolean isUserSignedUp(Integer roundId, Integer userId) {
        return roundSignupRepository.existsByRoundIdAndUserId(roundId, userId);
    }

    /**
     * Get participant counts for a round
     */
    public Map<String, Object> getParticipantCounts(Integer roundId) {
        Map<String, Object> counts = new HashMap<>();

        // Count confirmed volunteers
        long confirmedVolunteers = roundSignupRepository.countConfirmedVolunteersForRound(roundId);

        // Count waitlisted volunteers
        List<RoundSignup> waitlisted = roundSignupRepository.findByRoundIdAndStatusOrderByLotteryNumberAsc(roundId, "WAITLISTED");

        counts.put("confirmedCount", confirmedVolunteers);
        counts.put("waitlistedCount", waitlisted.size());

        // Check if team lead and clinician are assigned
        Rounds round = roundsRepository.findById(roundId).orElse(null);
        if (round != null) {
            counts.put("hasTeamLead", round.getTeamLeadId() != null);
            counts.put("hasClinician", round.getClinicianId() != null);
            counts.put("maxParticipants", round.getMaxParticipants());
            counts.put("availableSlots", round.getMaxParticipants() - confirmedVolunteers);
        }

        return counts;
    }

    /**
     * Check if a volunteer has the team lead role
     */
    public boolean hasTeamLeadRole(Integer userId) {
        return volunteerSubRoleRepository.existsByUserIdAndSubRole(userId, VolunteerSubRole.SubRoleType.TEAM_LEAD);
    }

    /**
     * Check if a volunteer has the clinician role
     */
    public boolean hasClinicianRole(Integer userId) {
        return volunteerSubRoleRepository.existsByUserIdAndSubRole(userId, VolunteerSubRole.SubRoleType.CLINICIAN);
    }
}