package com.pulse.post.client;

import com.pulse.post.dto.UserServiceResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

/**
 * User Service Feign Client
 * 
 * Provides integration with the User Service for retrieving user information.
 * Handles authentication and user data retrieval for posts and comments.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@FeignClient(
    name = "user-service",
    url = "${user-service.base-url}",
    configuration = UserServiceClientConfig.class
)
public interface UserServiceClient {

    /**
     * Get user by ID
     * 
     * @param userId The user ID to retrieve
     * @param authorization JWT authorization token
     * @return User service response with user data
     */
    @GetMapping("/api/users/{userId}")
    UserServiceResponse getUserById(
        @PathVariable("userId") String userId,
        @RequestHeader("Authorization") String authorization
    );

    /**
     * Get multiple users by IDs
     * 
     * @param userIds Comma-separated list of user IDs
     * @param authorization JWT authorization token
     * @return User service response with user data
     */
    @GetMapping("/api/users/batch")
    UserServiceResponse getUsersByIds(
        @RequestHeader("userIds") String userIds,
        @RequestHeader("Authorization") String authorization
    );
}
