package com.pulse.post.entity;

/**
 * Comment Status Enumeration
 * 
 * Defines the possible states of a comment in the system.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public enum CommentStatus {
    /**
     * Comment is published and visible to users
     */
    PUBLISHED,
    
    /**
     * Comment is hidden from public view but not deleted
     */
    HIDDEN,
    
    /**
     * Comment is flagged for moderation review
     */
    PENDING_MODERATION,
    
    /**
     * Comment is removed due to policy violations
     */
    REMOVED
}
