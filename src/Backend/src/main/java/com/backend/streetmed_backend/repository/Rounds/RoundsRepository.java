package com.backend.streetmed_backend.repository.Rounds;

import com.backend.streetmed_backend.entity.rounds_entity.Rounds;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RoundsRepository extends JpaRepository<Rounds, Integer> {

    // Find upcoming rounds (start time is in the future)
    List<Rounds> findByStartTimeAfterAndStatusOrderByStartTimeAsc(LocalDateTime now, String status);

    // Find rounds where a specific user is a team lead
    List<Rounds> findByTeamLeadId(Integer teamLeadId);

    // Find rounds where a specific user is a clinician
    List<Rounds> findByClinicianId(Integer clinicianId);

    // Find rounds by status
    List<Rounds> findByStatus(String status);

    // Find rounds that need a team lead (team_lead_id is null)
    List<Rounds> findByTeamLeadIdIsNullAndStartTimeAfterOrderByStartTimeAsc(LocalDateTime now);

    // Find rounds that need a clinician (clinician_id is null)
    List<Rounds> findByClinicianIdIsNullAndStartTimeAfterOrderByStartTimeAsc(LocalDateTime now);

    // Count upcoming rounds
    @Query("SELECT COUNT(r) FROM Rounds r WHERE r.startTime > ?1 AND r.status = 'SCHEDULED'")
    long countUpcomingRounds(LocalDateTime now);

    // Find rounds for the next 7 days
    @Query("SELECT r FROM Rounds r WHERE r.startTime BETWEEN ?1 AND ?2 AND r.status = 'SCHEDULED' ORDER BY r.startTime ASC")
    List<Rounds> findRoundsForNext7Days(LocalDateTime start, LocalDateTime end);
}