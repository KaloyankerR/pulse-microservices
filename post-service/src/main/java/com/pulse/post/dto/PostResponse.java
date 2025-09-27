package com.pulse.post.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Post Response DTO
 * 
 * Represents the response payload for post operations with user information.
 * Aligned with DATABASE&SCHEMAS.md specification.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public class PostResponse {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("content")
    private String content;

    @JsonProperty("eventId")
    private UUID eventId;

    @JsonProperty("likeCount")
    private Integer likeCount;

    @JsonProperty("commentCount")
    private Integer commentCount;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("author")
    private UserDto author;

    @JsonProperty("isLiked")
    private Boolean isLiked;

    // Constructors
    public PostResponse() {}

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public Integer getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(Integer likeCount) {
        this.likeCount = likeCount;
    }

    public Integer getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(Integer commentCount) {
        this.commentCount = commentCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UserDto getAuthor() {
        return author;
    }

    public void setAuthor(UserDto author) {
        this.author = author;
    }

    public Boolean getIsLiked() {
        return isLiked;
    }

    public void setIsLiked(Boolean isLiked) {
        this.isLiked = isLiked;
    }

    @Override
    public String toString() {
        return "PostResponse{" +
                "id=" + id +
                ", content='" + content + '\'' +
                ", eventId=" + eventId +
                ", likeCount=" + likeCount +
                ", commentCount=" + commentCount +
                ", author=" + (author != null ? author.getUsername() : "null") +
                '}';
    }
}
