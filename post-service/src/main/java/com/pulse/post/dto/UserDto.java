package com.pulse.post.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * User Data Transfer Object
 * 
 * Represents user information retrieved from the User Service.
 * Used for displaying user details in posts and comments.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public class UserDto {

    @JsonProperty("id")
    private String id;

    @JsonProperty("username")
    private String username;

    @JsonProperty("displayName")
    private String displayName;

    @JsonProperty("bio")
    private String bio;

    @JsonProperty("avatarUrl")
    private String avatarUrl;

    @JsonProperty("verified")
    private Boolean verified;

    @JsonProperty("status")
    private String status;

    @JsonProperty("followersCount")
    private Integer followersCount;

    @JsonProperty("followingCount")
    private Integer followingCount;

    @JsonProperty("createdAt")
    private String createdAt;

    // Constructors
    public UserDto() {}

    public UserDto(String id, String username, String displayName) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getFollowersCount() {
        return followersCount;
    }

    public void setFollowersCount(Integer followersCount) {
        this.followersCount = followersCount;
    }

    public Integer getFollowingCount() {
        return followingCount;
    }

    public void setFollowingCount(Integer followingCount) {
        this.followingCount = followingCount;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "UserDto{" +
                "id='" + id + '\'' +
                ", username='" + username + '\'' +
                ", displayName='" + displayName + '\'' +
                ", verified=" + verified +
                ", status='" + status + '\'' +
                '}';
    }
}
