package com.pulse.post.service;

import com.pulse.post.client.UserServiceClient;
import com.pulse.post.dto.UserDto;
import com.pulse.post.dto.UserServiceResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * User Service Integration
 * 
 * Provides integration with the User Service for retrieving user information.
 * Implements caching and async operations for optimal performance.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private final UserServiceClient userServiceClient;
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);

    public UserService(UserServiceClient userServiceClient) {
        this.userServiceClient = userServiceClient;
    }

    /**
     * Get user by ID with caching
     * 
     * @param userId The user ID to retrieve
     * @param authorization JWT authorization token
     * @return User DTO or null if not found
     */
    @Cacheable(value = "user-cache", key = "#userId")
    public UserDto getUserById(String userId, String authorization) {
        try {
            logger.debug("Fetching user from User Service: {}", userId);
            
            UserServiceResponse response = userServiceClient.getUserById(userId, authorization);
            
            if (response != null && response.getSuccess() && response.getData() != null) {
                UserDto user = response.getData().getUser();
                logger.debug("Successfully fetched user: {}", user.getUsername());
                return user;
            }
            
            logger.warn("User not found or invalid response: {}", userId);
            return null;
            
        } catch (Exception e) {
            logger.error("Error fetching user from User Service: {}", userId, e);
            return null;
        }
    }

    /**
     * Get multiple users by IDs asynchronously
     * 
     * @param userIds List of user IDs to retrieve
     * @param authorization JWT authorization token
     * @return Map of user ID to User DTO
     */
    public Map<String, UserDto> getUsersByIds(List<String> userIds, String authorization) {
        Map<String, UserDto> users = new HashMap<>();
        
        if (userIds == null || userIds.isEmpty()) {
            return users;
        }

        try {
            // Create async tasks for each user
            List<CompletableFuture<UserDto>> futures = userIds.stream()
                .map(userId -> CompletableFuture.supplyAsync(() -> 
                    getUserById(userId, authorization), executorService))
                .collect(Collectors.toList());

            // Wait for all tasks to complete
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            // Collect results
            for (int i = 0; i < userIds.size(); i++) {
                String userId = userIds.get(i);
                UserDto user = futures.get(i).get();
                if (user != null) {
                    users.put(userId, user);
                }
            }

            logger.debug("Successfully fetched {} users out of {} requested", 
                        users.size(), userIds.size());

        } catch (Exception e) {
            logger.error("Error fetching multiple users from User Service", e);
        }

        return users;
    }

    /**
     * Get user by ID synchronously (for critical operations)
     * 
     * @param userId The user ID to retrieve
     * @param authorization JWT authorization token
     * @return User DTO or null if not found
     */
    public UserDto getUserByIdSync(String userId, String authorization) {
        try {
            logger.debug("Synchronously fetching user from User Service: {}", userId);
            
            UserServiceResponse response = userServiceClient.getUserById(userId, authorization);
            
            if (response != null && response.getSuccess() && response.getData() != null) {
                UserDto user = response.getData().getUser();
                logger.debug("Successfully fetched user synchronously: {}", user.getUsername());
                return user;
            }
            
            logger.warn("User not found or invalid response: {}", userId);
            return null;
            
        } catch (Exception e) {
            logger.error("Error synchronously fetching user from User Service: {}", userId, e);
            return null;
        }
    }

    /**
     * Validate user exists and is active
     * 
     * @param userId The user ID to validate
     * @param authorization JWT authorization token
     * @return true if user exists and is active, false otherwise
     */
    public boolean isUserActive(String userId, String authorization) {
        UserDto user = getUserById(userId, authorization);
        return user != null && "ACTIVE".equals(user.getStatus());
    }

    /**
     * Get user display name for fallback scenarios
     * 
     * @param userId The user ID
     * @param authorization JWT authorization token
     * @return Display name or username or "Unknown User"
     */
    public String getUserDisplayName(String userId, String authorization) {
        UserDto user = getUserById(userId, authorization);
        if (user != null) {
            return user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
        }
        return "Unknown User";
    }
}
