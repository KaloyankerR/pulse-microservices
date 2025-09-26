package com.pulse.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Create Post Request DTO
 * 
 * Represents the request payload for creating a new post.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public class CreatePostRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 2000, message = "Content cannot exceed 2000 characters")
    private String content;

    private String[] imageUrls;

    private String videoUrl;

    // Constructors
    public CreatePostRequest() {}

    public CreatePostRequest(String content) {
        this.content = content;
    }

    // Getters and Setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String[] getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(String[] imageUrls) {
        this.imageUrls = imageUrls;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    @Override
    public String toString() {
        return "CreatePostRequest{" +
                "content='" + content + '\'' +
                ", imageUrls=" + (imageUrls != null ? imageUrls.length : 0) + " images" +
                ", videoUrl='" + videoUrl + '\'' +
                '}';
    }
}
