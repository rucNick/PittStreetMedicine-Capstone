package com.backend.streetmed_backend.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1) // Execute right after OptionsRequestFilter
public class RequestCorsFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(RequestCorsFilter.class);

    private final Set<String> allowedOrigins = new HashSet<>();

    public RequestCorsFilter(@Value("${cors.allowed-origins}") String configuredOrigins) {
        if (configuredOrigins != null && !configuredOrigins.isEmpty()) {
            allowedOrigins.addAll(Arrays.asList(configuredOrigins.split(",")));
            logger.info("RequestCorsFilter initialized with allowed origins: {}", allowedOrigins);
        }
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;

        String origin = request.getHeader("Origin");
        String method = request.getMethod();
        String path = request.getRequestURI();

        logger.info("Processing request: Origin={}, Method={}, Path={}", origin, method, path);

        // Skip OPTIONS requests, they're handled by OptionsRequestFilter
        if (!"OPTIONS".equalsIgnoreCase(method)) {
            // For other requests, set CORS headers if origin is allowed
            if (origin != null && isAllowedOrigin(origin)) {
                logger.info("Setting CORS headers for origin: {}", origin);
                setCorsHeaders(response, origin);
            } else {
                logger.warn("Request from non-allowed origin: {}", origin);
            }
        }

        // Continue the filter chain regardless
        chain.doFilter(req, res);
    }

    private boolean isAllowedOrigin(String origin) {
        return allowedOrigins.contains(origin.trim());
    }

    private void setCorsHeaders(HttpServletResponse response, String origin) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-ID, X-Client-ID, X-Timestamp, X-Signature");
        response.setHeader("Access-Control-Expose-Headers", "X-Session-ID");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Credentials", "true");
    }
}