package com.backend.streetmed_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
public class DatabaseInitializer {

    @Bean
    CommandLineRunner initDatabase(MongoTemplate mongoTemplate) {
        return args -> {
            if (!mongoTemplate.collectionExists("cargoImages")) {
                mongoTemplate.createCollection("cargoImages");
                System.out.println("Created cargoImages collection");
            }
            System.out.println("MongoDB is initialized!");
        };
    }
}