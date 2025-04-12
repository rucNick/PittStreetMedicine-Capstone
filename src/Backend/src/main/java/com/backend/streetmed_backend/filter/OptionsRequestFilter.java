package com.backend.streetmed_backend.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class OptionsRequestFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;

        // Always respond to OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            // Allow requested origin
            String origin = request.getHeader("Origin");
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

            // Include ALL custom headers
            response.setHeader("Access-Control-Allow-Headers",
                    "Content-Type, Authorization, X-Session-ID, X-Client-ID, X-Timestamp, X-Signature, " +
                            "Admin-Username, Authentication-Status");

            response.setHeader("Access-Control-Expose-Headers", "X-Session-ID");
            response.setHeader("Access-Control-Max-Age", "3600");
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(req, res);
    }
}