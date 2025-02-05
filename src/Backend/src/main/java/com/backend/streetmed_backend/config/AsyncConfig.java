package com.backend.streetmed_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "authExecutor")
    public Executor authExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // Keep thread count low due to SQLite's limitations
        executor.setCorePoolSize(2);      // Minimum number of threads
        executor.setMaxPoolSize(6);       // Maximum number of threads
        executor.setQueueCapacity(50);    // Queue capacity before rejection
        executor.setThreadNamePrefix("Auth-");

        // Configure rejection policy
        executor.setRejectedExecutionHandler((r, e) -> {
            throw new RuntimeException("Server is too busy, please try again later");
        });

        // Wait for tasks to complete on shutdown
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);

        executor.initialize();
        return executor;
    }

    @Bean(name = "readOnlyExecutor")
    public Executor readOnlyExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // More threads for read operations since SQLite allows multiple readers
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(6);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("ReadOnly-");

        executor.setRejectedExecutionHandler((r, e) -> {
            throw new RuntimeException("Server is too busy, please try again later");
        });

        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);

        executor.initialize();
        return executor;
    }
}