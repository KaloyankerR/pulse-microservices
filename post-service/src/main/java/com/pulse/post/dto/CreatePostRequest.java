package com.pulse.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Create Post Request DTO
 * 
 * Represents the request payload for creating a new post.
 * Aligned with DATABASE&SCHEMAS.md specification.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public class CreatePostRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 280, message = "Content cannot exceed 280 characters")
    private String content;

    private UUID eventId;

    // Constructors
    public CreatePostRequest() {}

    public CreatePostRequest(String content) {
        this.content = content;
    }

    public CreatePostRequest(String content, UUID eventId) {
        this.content = content;
        this.eventId = eventId;
    }

    // Getters and Setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    @Override
    public String toString() {
        return "CreatePostRequest{" +
                "content='" + content + '\'' +
                ", eventId=" + eventId +
                '}';
    }
}
