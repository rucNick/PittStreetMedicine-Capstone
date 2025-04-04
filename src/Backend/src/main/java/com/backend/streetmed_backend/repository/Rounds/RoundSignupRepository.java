package com.backend.streetmed_backend.repository.Rounds;

import com.backend.streetmed_backend.entity.rounds_entity.RoundSignup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoundSignupRepository extends JpaRepository<RoundSignup, Integer> {

    // Find all signups for a specific round
    List<RoundSignup> findByRoundId(Integer roundId);

    // Find all signups for a specific user
    List<RoundSignup> findByUserId(Integer userId);

    // Find a user's signup for a specific round
    Optional<RoundSignup> findByRoundIdAndUserId(Integer roundId, Integer userId);

    // Find signups by status for a round
    List<RoundSignup> findByRoundIdAndStatus(Integer roundId, String status);

    // Find confirmed signups for a round
    List<RoundSignup> findByRoundIdAndStatusOrderBySignupTimeAsc(Integer roundId, String status);

    // Count confirmed participants for a round (not including team lead or clinician)
    @Query("SELECT COUNT(rs) FROM RoundSignup rs WHERE rs.roundId = :roundId AND rs.status = 'CONFIRMED' AND rs.role = 'VOLUNTEER'")
    long countConfirmedVolunteersForRound(@Param("roundId") Integer roundId);

    // Find signups for a volunteer with role VOLUNTEER (not CLINICIAN or TEAM_LEAD)
    List<RoundSignup> findByUserIdAndRole(Integer userId, String role);

    // Find all signups for a round with specific status ordered by lottery number
    List<RoundSignup> findByRoundIdAndStatusOrderByLotteryNumberAsc(Integer roundId, String status);

    // Check if a user already signed up for a round with any role
    boolean existsByRoundIdAndUserId(Integer roundId, Integer userId);

    // Find all signups with waitlist status
    List<RoundSignup> findByStatusOrderBySignupTimeAsc(String status);

    // Delete all signups for a round
    void deleteByRoundId(Integer roundId);

    // Get clinician signup for a round if exists
    Optional<RoundSignup> findByRoundIdAndRole(Integer roundId, String role);

    // Get signups for a user with confirmed status
    List<RoundSignup> findByUserIdAndStatus(Integer userId, String status);
}