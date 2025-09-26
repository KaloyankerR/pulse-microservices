package com.pulse.post.entity;

/**
 * Post Status Enumeration
 * 
 * Defines the possible states of a post in the system.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public enum PostStatus {
    /**
     * Post is published and visible to users
     */
    PUBLISHED,
    
    /**
     * Post is saved as draft and not visible to users
     */
    DRAFT,
    
    /**
     * Post is hidden from public view but not deleted
     */
    HIDDEN,
    
    /**
     * Post is flagged for moderation review
     */
    PENDING_MODERATION,
    
    /**
     * Post is removed due to policy violations
     */
    REMOVED
}
