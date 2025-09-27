package com.pulse.post.repository;

import com.pulse.post.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Post Like Repository
 * 
 * Provides data access methods for PostLike entities with custom queries
 * for like management and analytics.
 * Aligned with DATABASE&SCHEMAS.md specification.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {

    /**
     * Find like by post ID and user ID
     */
    Optional<PostLike> findByPostIdAndUserId(UUID postId, UUID userId);

    /**
     * Check if user has liked a post
     */
    boolean existsByPostIdAndUserId(UUID postId, UUID userId);

    /**
     * Find all likes for a post
     */
    List<PostLike> findByPostId(UUID postId);

    /**
     * Find all likes by user
     */
    List<PostLike> findByUserId(UUID userId);

    /**
     * Count likes for a post
     */
    long countByPostId(UUID postId);

    /**
     * Count likes by user
     */
    long countByUserId(UUID userId);

    /**
     * Delete like by post ID and user ID
     */
    @Modifying
    @Query("DELETE FROM PostLike l WHERE l.postId = :postId AND l.userId = :userId")
    void deleteByPostIdAndUserId(@Param("postId") UUID postId, @Param("userId") UUID userId);

    /**
     * Delete all likes for a post
     */
    @Modifying
    @Query("DELETE FROM PostLike l WHERE l.postId = :postId")
    void deleteByPostId(@Param("postId") UUID postId);

    /**
     * Delete all likes by user
     */
    @Modifying
    @Query("DELETE FROM PostLike l WHERE l.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    /**
     * Find likes by multiple post IDs
     */
    @Query("SELECT l FROM PostLike l WHERE l.postId IN :postIds")
    List<PostLike> findByPostIdIn(@Param("postIds") List<UUID> postIds);

    /**
     * Find likes by multiple user IDs
     */
    @Query("SELECT l FROM PostLike l WHERE l.userId IN :userIds")
    List<PostLike> findByUserIdIn(@Param("userIds") List<UUID> userIds);

    /**
     * Find posts liked by user
     */
    @Query("SELECT l FROM PostLike l WHERE l.userId = :userId")
    List<PostLike> findLikedPostsByUser(@Param("userId") UUID userId);

    /**
     * Find users who liked a specific post
     */
    @Query("SELECT l FROM PostLike l WHERE l.postId = :postId")
    List<PostLike> findUsersWhoLikedPost(@Param("postId") UUID postId);

    /**
     * Count likes for multiple posts
     */
    @Query("SELECT l.postId, COUNT(l) FROM PostLike l WHERE l.postId IN :postIds GROUP BY l.postId")
    List<Object[]> countLikesByPostIds(@Param("postIds") List<UUID> postIds);
}
