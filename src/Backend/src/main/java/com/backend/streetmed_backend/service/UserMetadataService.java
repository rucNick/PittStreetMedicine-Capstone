package com.backend.streetmed_backend.service;

import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.entity.user_entity.UserMetadata;
import com.backend.streetmed_backend.repository.UserMetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class UserMetadataService {

    private final UserMetadataRepository metadataRepository;

    @Autowired
    public UserMetadataService(UserMetadataRepository metadataRepository) {
        this.metadataRepository = metadataRepository;
    }

    /**
     * Create a metadata record for a given user.
     * This sets up the one-to-one relationship via shared PK (userId).
     */
    public UserMetadata createMetadata(User user) {
        // Check if metadata already exists
        if (metadataRepository.existsById(user.getUserId())) {
            throw new RuntimeException(
                    "Metadata already exists for userId " + user.getUserId());
        }

        UserMetadata metadata = new UserMetadata(user);
        // The 'prePersist' in the entity will handle createdAt, updatedAt, etc.
        return metadataRepository.save(metadata);
    }

    public Optional<UserMetadata> getMetadataByUserId(Integer userId) {
        return metadataRepository.findById(userId);
    }

    /**
     * Update lastLogin to 'now' for a given userId
     */
    public void updateLastLogin(Integer userId) {
        metadataRepository.findById(userId).ifPresent(metadata -> {
            metadata.setLastLogin(LocalDateTime.now());
            metadataRepository.save(metadata);
            // triggers @PreUpdate for updatedAt
        });
    }
}
