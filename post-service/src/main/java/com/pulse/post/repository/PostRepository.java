package com.pulse.post.repository;

import com.pulse.post.entity.Post;
import com.pulse.post.entity.PostStatus;
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

/**
 * Post Repository
 * 
 * Provides data access methods for Post entities with custom queries
 * for complex operations like search, filtering, and analytics.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * Find posts by author ID with pagination
     */
    Page<Post> findByAuthorIdAndStatusOrderByCreatedAtDesc(String authorId, PostStatus status, Pageable pageable);

    /**
     * Find posts by author ID (all statuses) with pagination
     */
    Page<Post> findByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);

    /**
     * Find published posts with pagination
     */
    Page<Post> findByStatusOrderByCreatedAtDesc(PostStatus status, Pageable pageable);

    /**
     * Search posts by content using full-text search
     */
    @Query("SELECT p FROM Post p WHERE p.status = :status AND " +
           "(LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> searchPostsByContent(@Param("query") String query, @Param("status") PostStatus status, Pageable pageable);

    /**
     * Find posts by multiple author IDs (for following feed)
     */
    @Query("SELECT p FROM Post p WHERE p.authorId IN :authorIds AND p.status = :status " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findByAuthorIdInAndStatusOrderByCreatedAtDesc(@Param("authorIds") List<String> authorIds, 
                                                             @Param("status") PostStatus status, 
                                                             Pageable pageable);

    /**
     * Find trending posts (most liked in the last 24 hours)
     */
    @Query("SELECT p FROM Post p WHERE p.status = :status AND p.createdAt >= :since " +
           "ORDER BY p.likeCount DESC, p.createdAt DESC")
    Page<Post> findTrendingPosts(@Param("status") PostStatus status, 
                                 @Param("since") LocalDateTime since, 
                                 Pageable pageable);

    /**
     * Find posts with minimum like count
     */
    @Query("SELECT p FROM Post p WHERE p.status = :status AND p.likeCount >= :minLikes " +
           "ORDER BY p.likeCount DESC, p.createdAt DESC")
    Page<Post> findPopularPosts(@Param("status") PostStatus status, 
                                @Param("minLikes") Integer minLikes, 
                                Pageable pageable);

    /**
     * Count posts by author and status
     */
    long countByAuthorIdAndStatus(String authorId, PostStatus status);

    /**
     * Count total posts by author
     */
    long countByAuthorId(String authorId);

    /**
     * Find posts created between dates
     */
    @Query("SELECT p FROM Post p WHERE p.status = :status AND p.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY p.createdAt DESC")
    List<Post> findPostsBetweenDates(@Param("status") PostStatus status,
                                     @Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);

    /**
     * Find posts with images
     */
    @Query("SELECT p FROM Post p WHERE p.status = :status AND p.imageUrls IS NOT NULL " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findPostsWithImages(@Param("status") PostStatus status, Pageable pageable);

    /**
     * Find posts with videos
     */
    @Query("SELECT p FROM Post p WHERE p.status = :status AND p.videoUrl IS NOT NULL " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findPostsWithVideos(@Param("status") PostStatus status, Pageable pageable);

    /**
     * Update post engagement counts
     */
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + :likeDelta, " +
           "p.commentCount = p.commentCount + :commentDelta, " +
           "p.viewCount = p.viewCount + :viewDelta " +
           "WHERE p.id = :postId")
    void updateEngagementCounts(@Param("postId") Long postId,
                                @Param("likeDelta") Integer likeDelta,
                                @Param("commentDelta") Integer commentDelta,
                                @Param("viewDelta") Integer viewDelta);

    /**
     * Find posts for moderation (pending status)
     */
    Page<Post> findByStatusOrderByCreatedAtAsc(PostStatus status, Pageable pageable);

    /**
     * Find posts by author with specific content length
     */
    @Query("SELECT p FROM Post p WHERE p.authorId = :authorId AND p.status = :status " +
           "AND LENGTH(p.content) >= :minLength " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findByAuthorIdAndStatusAndMinContentLength(@Param("authorId") String authorId,
                                                          @Param("status") PostStatus status,
                                                          @Param("minLength") Integer minLength,
                                                          Pageable pageable);

    /**
     * Find most recent posts by multiple authors
     */
    @Query("SELECT p FROM Post p WHERE p.authorId IN :authorIds AND p.status = :status " +
           "AND p.createdAt >= :since " +
           "ORDER BY p.createdAt DESC")
    List<Post> findRecentPostsByAuthors(@Param("authorIds") List<String> authorIds,
                                        @Param("status") PostStatus status,
                                        @Param("since") LocalDateTime since);

    /**
     * Check if post exists and is published
     */
    boolean existsByIdAndStatus(Long id, PostStatus status);

    /**
     * Find post by ID with status check
     */
    Optional<Post> findByIdAndStatus(Long id, PostStatus status);
}
