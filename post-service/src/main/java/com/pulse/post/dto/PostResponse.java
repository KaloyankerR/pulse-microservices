package com.pulse.post.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pulse.post.entity.PostStatus;

import java.time.LocalDateTime;

/**
 * Post Response DTO
 * 
 * Represents the response payload for post operations with user information.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public class PostResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("content")
    private String content;

    @JsonProperty("imageUrls")
    private String[] imageUrls;

    @JsonProperty("videoUrl")
    private String videoUrl;

    @JsonProperty("status")
    private PostStatus status;

    @JsonProperty("isEdited")
    private Boolean isEdited;

    @JsonProperty("editedAt")
    private LocalDateTime editedAt;

    @JsonProperty("likeCount")
    private Integer likeCount;

    @JsonProperty("commentCount")
    private Integer commentCount;

    @JsonProperty("shareCount")
    private Integer shareCount;

    @JsonProperty("viewCount")
    private Integer viewCount;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;

    @JsonProperty("author")
    private UserDto author;

    @JsonProperty("isLiked")
    private Boolean isLiked;

    // Constructors
    public PostResponse() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public PostStatus getStatus() {
        return status;
    }

    public void setStatus(PostStatus status) {
        this.status = status;
    }

    public Boolean getIsEdited() {
        return isEdited;
    }

    public void setIsEdited(Boolean isEdited) {
        this.isEdited = isEdited;
    }

    public LocalDateTime getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(LocalDateTime editedAt) {
        this.editedAt = editedAt;
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

    public Integer getShareCount() {
        return shareCount;
    }

    public void setShareCount(Integer shareCount) {
        this.shareCount = shareCount;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
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
                ", status=" + status +
                ", likeCount=" + likeCount +
                ", commentCount=" + commentCount +
                ", author=" + (author != null ? author.getUsername() : "null") +
                '}';
    }
}
