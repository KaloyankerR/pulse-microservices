package com.pulse.post.repository;

import com.pulse.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Post Repository
 * 
 * Provides data access methods for Post entities with custom queries
 * for complex operations like search, filtering, and analytics.
 * Aligned with DATABASE&SCHEMAS.md specification.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    /**
     * Find posts by author ID with pagination
     */
    Page<Post> findByAuthorIdOrderByCreatedAtDesc(UUID authorId, Pageable pageable);

    /**
     * Find posts by event ID with pagination
     */
    Page<Post> findByEventIdOrderByCreatedAtDesc(UUID eventId, Pageable pageable);

    /**
     * Search posts by content using full-text search
     */
    @Query("SELECT p FROM Post p WHERE " +
           "(LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> searchPostsByContent(@Param("query") String query, Pageable pageable);

    /**
     * Find posts by multiple author IDs (for following feed)
     */
    @Query("SELECT p FROM Post p WHERE p.authorId IN :authorIds " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findByAuthorIdInOrderByCreatedAtDesc(@Param("authorIds") List<UUID> authorIds, 
                                                    Pageable pageable);

    /**
     * Find trending posts (most liked in the last 24 hours)
     */
    @Query("SELECT p FROM Post p WHERE p.createdAt >= :since " +
           "ORDER BY p.likeCount DESC, p.createdAt DESC")
    Page<Post> findTrendingPosts(@Param("since") LocalDateTime since, 
                                 Pageable pageable);

    /**
     * Find posts with minimum like count
     */
    @Query("SELECT p FROM Post p WHERE p.likeCount >= :minLikes " +
           "ORDER BY p.likeCount DESC, p.createdAt DESC")
    Page<Post> findPopularPosts(@Param("minLikes") Integer minLikes, 
                                Pageable pageable);

    /**
     * Count total posts by author
     */
    long countByAuthorId(UUID authorId);

    /**
     * Find posts created between dates
     */
    @Query("SELECT p FROM Post p WHERE p.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY p.createdAt DESC")
    List<Post> findPostsBetweenDates(@Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);

    /**
     * Update post engagement counts
     */
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + :likeDelta, " +
           "p.commentCount = p.commentCount + :commentDelta " +
           "WHERE p.id = :postId")
    void updateEngagementCounts(@Param("postId") UUID postId,
                                @Param("likeDelta") Integer likeDelta,
                                @Param("commentDelta") Integer commentDelta);

    /**
     * Find most recent posts by multiple authors
     */
    @Query("SELECT p FROM Post p WHERE p.authorId IN :authorIds " +
           "AND p.createdAt >= :since " +
           "ORDER BY p.createdAt DESC")
    List<Post> findRecentPostsByAuthors(@Param("authorIds") List<UUID> authorIds,
                                        @Param("since") LocalDateTime since);
}
