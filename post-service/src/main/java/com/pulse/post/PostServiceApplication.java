package com.pulse.post;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Post Service Application
 * 
 * Handles all content creation and management including:
 * - Create/edit/delete posts
 * - Manage post metadata (text, images, videos)
 * - Content validation and processing
 * - Post search and filtering
 * - Content moderation
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableFeignClients
@EnableCaching
public class PostServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PostServiceApplication.class, args);
    }
}
