package com.pulse.post.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User Cache Entity
 * 
 * Represents a lightweight user cache for the post service.
 * This table maintains minimal user information synced from the User Service
 * to reduce cross-service calls and improve performance.
 * 
 * Aligned with DATABASE&SCHEMAS.md specification.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Entity
@Table(name = "user_cache", indexes = {
    @Index(name = "idx_user_cache_username", columnList = "username"),
    @Index(name = "idx_user_cache_last_synced", columnList = "lastSynced")
})
public class UserCache {

    @Id
    private UUID id;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "verified", nullable = false)
    private Boolean verified = false;

    @CreationTimestamp
    @Column(name = "last_synced", nullable = false, updatable = false)
    private LocalDateTime lastSynced;

    // Constructors
    public UserCache() {}

    public UserCache(UUID id, String username, String displayName, String avatarUrl, Boolean verified) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.verified = verified;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
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

    public LocalDateTime getLastSynced() {
        return lastSynced;
    }

    public void setLastSynced(LocalDateTime lastSynced) {
        this.lastSynced = lastSynced;
    }

    // Business methods
    public void updateCache(String username, String displayName, String avatarUrl, Boolean verified) {
        this.username = username;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.verified = verified;
        this.lastSynced = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "UserCache{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", displayName='" + displayName + '\'' +
                ", avatarUrl='" + avatarUrl + '\'' +
                ", verified=" + verified +
                ", lastSynced=" + lastSynced +
                '}';
    }
}
