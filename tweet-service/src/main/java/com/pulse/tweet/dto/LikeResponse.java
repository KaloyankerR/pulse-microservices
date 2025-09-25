package com.pulse.tweet.dto;

import com.pulse.tweet.entity.Like;

import java.time.LocalDateTime;

public class LikeResponse {

    private Long id;
    private String username;
    private Long tweetId;
    private LocalDateTime createdAt;

    // Constructors
    public LikeResponse() {}

    public LikeResponse(Like like) {
        this.id = like.getId();
        this.username = like.getUsername();
        this.tweetId = like.getTweet().getId();
        this.createdAt = like.getCreatedAt();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Long getTweetId() {
        return tweetId;
    }

    public void setTweetId(Long tweetId) {
        this.tweetId = tweetId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

