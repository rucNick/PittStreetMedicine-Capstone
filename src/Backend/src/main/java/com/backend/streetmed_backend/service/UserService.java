package com.backend.streetmed_backend.service;


import com.backend.streetmed_backend.entity.user_entity.User;
import com.backend.streetmed_backend.entity.user_entity.UserMetadata;
import com.backend.streetmed_backend.repository.UserMetadataRepository;
import com.backend.streetmed_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final UserMetadataRepository metadataRepository;

    @Autowired
    public UserService(UserRepository userRepository, UserMetadataRepository metadataRepository) {
        this.userRepository = userRepository;
        this.metadataRepository = metadataRepository;
    }

    @Transactional
    public User createUser(User user) {
        validateNewUser(user);

        // Create new user
        User newUser = new User();
        newUser.setUsername(user.getUsername());
        newUser.setEmail(user.getEmail());
        newUser.setPassword(user.getPassword());
        newUser.setPhone(user.getPhone());
        newUser.setRole(user.getRole());

        // Create metadata
        UserMetadata metadata = new UserMetadata();
        newUser.setMetadata(metadata); // This sets up the bidirectional relationship

        // Save user (this will cascade to metadata due to CascadeType.ALL)
        return userRepository.saveAndFlush(newUser);
    }

    @Transactional
    public void updateLastLogin(Integer userId) {
        userRepository.findById(userId).ifPresent(user -> {
            UserMetadata metadata = user.getMetadata();
            if (metadata != null) {
                metadata.setLastLogin(LocalDateTime.now());
            }
        });
    }

    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElse(null);
    }

    private void validateNewUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(User user) {
        if (!userRepository.existsById(user.getUserId())) {
            throw new RuntimeException("User not found");
        }
        return userRepository.save(user);
    }

    public void deleteUser(Integer userId) {
        userRepository.deleteById(userId);
    }

}