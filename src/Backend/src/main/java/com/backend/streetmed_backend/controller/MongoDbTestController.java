package com.backend.streetmed_backend.controller;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class MongoDbTestController {

    private final MongoTemplate mongoTemplate;

    public MongoDbTestController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/mongodb/status")
    public ResponseEntity<String> checkMongoDbStatus() {
        try {
            String dbName = mongoTemplate.getDb().getName();
            return ResponseEntity.ok("MongoDB is running! Database: " + dbName);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("MongoDB Error: " + e.getMessage());
        }
    }
}