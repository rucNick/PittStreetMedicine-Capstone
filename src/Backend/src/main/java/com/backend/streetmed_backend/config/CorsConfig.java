package com.backend.streetmed_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    // cors.allowed-origins=http://localhost:3000
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Instead of using "*" for development when credentials are allowed,
        // explicitly list allowed origins.
        String[] origins = allowedOrigins.split(",");
        Arrays.stream(origins)
                .map(String::trim)
                .forEach(config::addAllowedOrigin);

        // Alternatively, you can allow all headers/methods:
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        // Allow credentials (cookies, authorization headers, etc.)
        config.setAllowCredentials(true);

        // Set the max age for the preflight request cache
        config.setMaxAge(3600L);

        // Apply CORS config to all endpoints
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
