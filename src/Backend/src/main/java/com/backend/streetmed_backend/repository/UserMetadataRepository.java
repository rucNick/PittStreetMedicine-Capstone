package com.backend.streetmed_backend.repository;

import com.backend.streetmed_backend.controller.entity.user_entity.UserMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserMetadataRepository extends JpaRepository<UserMetadata, Integer> {
}