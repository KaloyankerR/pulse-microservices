package com.pulse.tweet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateTweetRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 280, message = "Tweet content cannot exceed 280 characters")
    private String content;

    // Constructors
    public UpdateTweetRequest() {}

    public UpdateTweetRequest(String content) {
        this.content = content;
    }

    // Getters and Setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}

