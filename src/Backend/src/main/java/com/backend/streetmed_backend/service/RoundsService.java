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
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
@Transactional
public class RoundsService {
    private final RoundsRepository roundsRepository;
    private final RoundSignupRepository roundSignupRepository;
    private final UserRepository userRepository;
    private final VolunteerSubRoleRepository volunteerSubRoleRepository;
    private final EmailService emailService;
    private static final Logger logger = LoggerFactory.getLogger(RoundsService.class);

    @Autowired
    public RoundsService(RoundsRepository roundsRepository,
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
     * Create a new rounds schedule
     */
    public Rounds createRound(Rounds round) {
        // Validate required fields
        if (round.getStartTime() == null || round.getEndTime() == null ||
                round.getLocation() == null || round.getTitle() == null ||
                round.getMaxParticipants() == null) {
            throw new IllegalArgumentException("Missing required fields for creating a round");
        }

        // Set default values
        round.setCreatedAt(LocalDateTime.now());
        round.setUpdatedAt(LocalDateTime.now());
        round.setStatus("SCHEDULED");

        return roundsRepository.save(round);
    }

    /**
     * Update an existing rounds schedule
     */
    public Rounds updateRound(Integer roundId, Rounds updatedRound) {
        Rounds existingRound = roundsRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found with ID: " + roundId));

        // Update fields
        existingRound.setTitle(updatedRound.getTitle());
        existingRound.setDescription(updatedRound.getDescription());
        existingRound.setStartTime(updatedRound.getStartTime());
        existingRound.setEndTime(updatedRound.getEndTime());
        existingRound.setLocation(updatedRound.getLocation());
        existingRound.setMaxParticipants(updatedRound.getMaxParticipants());
        existingRound.setUpdatedAt(LocalDateTime.now());

        // Optional fields
        if (updatedRound.getTeamLeadId() != null) {
            existingRound.setTeamLeadId(updatedRound.getTeamLeadId());
        }
        if (updatedRound.getClinicianId() != null) {
            existingRound.setClinicianId(updatedRound.getClinicianId());
        }
        if (updatedRound.getStatus() != null) {
            existingRound.setStatus(updatedRound.getStatus());
        }

        return roundsRepository.save(existingRound);
    }

    /**
     * Get a round by ID
     */
    public Rounds getRound(Integer roundId) {
        return roundsRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found with ID: " + roundId));
    }

    /**
     * Get all scheduled rounds
     */
    public List<Rounds> getAllScheduledRounds() {
        return roundsRepository.findByStatus("SCHEDULED");
    }

    /**
     * Get upcoming rounds (those with start time in the future)
     */
    public List<Rounds> getUpcomingRounds() {
        return roundsRepository.findByStartTimeAfterAndStatusOrderByStartTimeAsc(
                LocalDateTime.now(), "SCHEDULED");
    }

    /**
     * Cancel a round
     */
    @Transactional
    public Rounds cancelRound(Integer roundId) {
        Rounds round = roundsRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found with ID: " + roundId));

        round.setStatus("CANCELED");
        round.setUpdatedAt(LocalDateTime.now());

        // Update all signups to canceled
        List<RoundSignup> signups = roundSignupRepository.findByRoundId(roundId);
        for (RoundSignup signup : signups) {
            signup.setStatus("CANCELED");
            signup.setUpdatedAt(LocalDateTime.now());
            roundSignupRepository.save(signup);

            // Notify user about cancellation
            try {
                User user = userRepository.findById(signup.getUserId()).orElse(null);
                if (user != null && user.getEmail() != null && emailService.isEmailServiceEnabled()) {
                    // Create a simple email notification
                    Map<String, Object> emailData = new HashMap<>();
                    emailData.put("roundTitle", round.getTitle());
                    emailData.put("startTime", round.getStartTime());
                    emailData.put("location", round.getLocation());
                    // Send email notification in a non-blocking way
                    CompletableFuture.runAsync(() -> {
                        try {
                            emailService.sendRoundCancellationEmail(user.getEmail(), emailData);
                        } catch (Exception e) {
                            logger.error("Failed to send round cancellation email to {}: {}", user.getEmail(), e.getMessage());
                        }
                    });
                }
            } catch (Exception e) {
                logger.error("Error notifying user {} about round cancellation: {}", signup.getUserId(), e.getMessage());
            }
        }

        return roundsRepository.save(round);
    }

    /**
     * Complete a round (mark as completed)
     */
    public Rounds completeRound(Integer roundId) {
        Rounds round = roundsRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found with ID: " + roundId));

        round.setStatus("COMPLETED");
        round.setUpdatedAt(LocalDateTime.now());
        return roundsRepository.save(round);
    }

    /**
     * Get rounds that need a team lead
     */
    public List<Rounds> getRoundsNeedingTeamLead() {
        return roundsRepository.findByTeamLeadIdIsNullAndStartTimeAfterOrderByStartTimeAsc(LocalDateTime.now());
    }

    /**
     * Get rounds that need a clinician
     */
    public List<Rounds> getRoundsNeedingClinician() {
        return roundsRepository.findByClinicianIdIsNullAndStartTimeAfterOrderByStartTimeAsc(LocalDateTime.now());
    }

    /**
     * Assign a team lead to a round
     */
    @Transactional
    public Rounds assignTeamLead(Integer roundId, Integer userId) {
        // Check if user exists and has TEAM_LEAD role
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        if (!"VOLUNTEER".equals(user.getRole())) {
            throw new RuntimeException("User must be a volunteer to be assigned as team lead");
        }

        // Check if user has TEAM_LEAD sub-role
        boolean isTeamLead = volunteerSubRoleRepository.existsByUserIdAndSubRole(
                userId, VolunteerSubRole.SubRoleType.TEAM_LEAD);

        if (!isTeamLead) {
            throw new RuntimeException("User must have TEAM_LEAD sub-role to be assigned as team lead");
        }

        Rounds round = roundsRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found with ID: " + roundId));

        // Update round with team lead ID
        round.setTeamLeadId(userId);
        round.setUpdatedAt(LocalDateTime.now());

        // Create a signup record for the team lead
        Optional<RoundSignup> existingSignup = roundSignupRepository.findByRoundIdAndUserId(roundId, userId);
        if (existingSignup.isPresent()) {
            RoundSignup signup = existingSignup.get();
            signup.setRole("TEAM_LEAD");
            signup.setStatus("CONFIRMED");
            signup.setUpdatedAt(LocalDateTime.now());
            roundSignupRepository.save(signup);
        } else {
            RoundSignup signup = new RoundSignup(roundId, userId, "TEAM_LEAD");
            signup.setStatus("CONFIRMED");
            roundSignupRepository.save(signup);
        }

        return roundsRepository.save(round);
    }

    /**
     * Assign a clinician to a round
     */
    @Transactional
    public Rounds assignClinician(Integer roundId, Integer userId) {
        // Check if user exists and has CLINICIAN role
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        if (!"VOLUNTEER".equals(user.getRole())) {
            throw new RuntimeException("User must be a volunteer to be assigned as clinician");
        }

        // Check if user has CLINICIAN sub-role
        boolean isClinician = volunteerSubRoleRepository.existsByUserIdAndSubRole(
                userId, VolunteerSubRole.SubRoleType.CLINICIAN);

        if (!isClinician) {
            throw new RuntimeException("User must have CLINICIAN sub-role to be assigned as clinician");
        }

        Rounds round = roundsRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found with ID: " + roundId));

        // Update round with clinician ID
        round.setClinicianId(userId);
        round.setUpdatedAt(LocalDateTime.now());

        // Create a signup record for the clinician
        Optional<RoundSignup> existingSignup = roundSignupRepository.findByRoundIdAndUserId(roundId, userId);
        if (existingSignup.isPresent()) {
            RoundSignup signup = existingSignup.get();
            signup.setRole("CLINICIAN");
            signup.setStatus("CONFIRMED");
            signup.setUpdatedAt(LocalDateTime.now());
            roundSignupRepository.save(signup);
        } else {
            RoundSignup signup = new RoundSignup(roundId, userId, "CLINICIAN");
            signup.setStatus("CONFIRMED");
            roundSignupRepository.save(signup);
        }

        return roundsRepository.save(round);
    }

    /**
     * Send reminders for rounds happening tomorrow
     * This would typically be called by a scheduled task
     */
    @Transactional(readOnly = true)
    public void sendRoundReminders() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime dayAfterTomorrow = tomorrow.plusDays(1);

        List<Rounds> tomorrowRounds = roundsRepository.findRoundsForNext7Days(tomorrow, dayAfterTomorrow);

        for (Rounds round : tomorrowRounds) {
            List<RoundSignup> confirmedSignups = roundSignupRepository.findByRoundIdAndStatusOrderBySignupTimeAsc(
                    round.getRoundId(), "CONFIRMED");

            for (RoundSignup signup : confirmedSignups) {
                try {
                    User user = userRepository.findById(signup.getUserId()).orElse(null);
                    if (user != null && user.getEmail() != null && emailService.isEmailServiceEnabled()) {
                        Map<String, Object> emailData = new HashMap<>();
                        emailData.put("roundTitle", round.getTitle());
                        emailData.put("startTime", round.getStartTime());
                        emailData.put("location", round.getLocation());
                        emailData.put("role", signup.getRole());

                        // Send email notification in a non-blocking way
                        CompletableFuture.runAsync(() -> {
                            try {
                                emailService.sendRoundReminderEmail(user.getEmail(), emailData);
                            } catch (Exception e) {
                                logger.error("Failed to send round reminder email to {}: {}",
                                        user.getEmail(), e.getMessage());
                            }
                        });
                    }
                } catch (Exception e) {
                    logger.error("Error sending reminder to user {} for round {}: {}",
                            signup.getUserId(), round.getRoundId(), e.getMessage());
                }
            }
        }
    }

    /**
     * Get rounds for a specific date range
     */
    public List<Rounds> getRoundsForDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return roundsRepository.findRoundsForNext7Days(startDate, endDate);
    }

    /**
     * Count upcoming rounds
     */
    public long countUpcomingRounds() {
        return roundsRepository.countUpcomingRounds(LocalDateTime.now());
    }

    /**
     * Get rounds by status
     */
    public List<Rounds> getRoundsByStatus(String status) {
        return roundsRepository.findByStatus(status);
    }

    /**
     * Get rounds where a user is team lead
     */
    public List<Rounds> getRoundsForTeamLead(Integer userId) {
        return roundsRepository.findByTeamLeadId(userId);
    }

    /**
     * Get rounds where a user is clinician
     */
    public List<Rounds> getRoundsForClinician(Integer userId) {
        return roundsRepository.findByClinicianId(userId);
    }
}