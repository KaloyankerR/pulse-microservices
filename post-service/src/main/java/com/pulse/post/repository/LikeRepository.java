package com.pulse.post.repository;

import com.pulse.post.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Like Repository
 * 
 * Provides data access methods for Like entities with custom queries
 * for like management and analytics.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    /**
     * Find like by post ID and user ID
     */
    Optional<Like> findByPostIdAndUserId(Long postId, String userId);

    /**
     * Check if user has liked a post
     */
    boolean existsByPostIdAndUserId(Long postId, String userId);

    /**
     * Find all likes for a post
     */
    List<Like> findByPostIdOrderByCreatedAtDesc(Long postId);

    /**
     * Find all likes by user
     */
    List<Like> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Count likes for a post
     */
    long countByPostId(Long postId);

    /**
     * Count likes by user
     */
    long countByUserId(String userId);

    /**
     * Delete like by post ID and user ID
     */
    @Modifying
    @Query("DELETE FROM Like l WHERE l.postId = :postId AND l.userId = :userId")
    void deleteByPostIdAndUserId(@Param("postId") Long postId, @Param("userId") String userId);

    /**
     * Delete all likes for a post
     */
    @Modifying
    @Query("DELETE FROM Like l WHERE l.postId = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    /**
     * Delete all likes by user
     */
    @Modifying
    @Query("DELETE FROM Like l WHERE l.userId = :userId")
    void deleteByUserId(@Param("userId") String userId);

    /**
     * Find recent likes for a post
     */
    @Query("SELECT l FROM Like l WHERE l.postId = :postId ORDER BY l.createdAt DESC")
    List<Like> findRecentLikesByPost(@Param("postId") Long postId);

    /**
     * Find likes by multiple post IDs
     */
    @Query("SELECT l FROM Like l WHERE l.postId IN :postIds ORDER BY l.createdAt DESC")
    List<Like> findByPostIdIn(@Param("postIds") List<Long> postIds);

    /**
     * Find likes by multiple user IDs
     */
    @Query("SELECT l FROM Like l WHERE l.userId IN :userIds ORDER BY l.createdAt DESC")
    List<Like> findByUserIdIn(@Param("userIds") List<String> userIds);

    /**
     * Find mutual likes between two users
     */
    @Query("SELECT l1 FROM Like l1 WHERE l1.userId = :userId1 AND l1.postId IN " +
           "(SELECT l2.postId FROM Like l2 WHERE l2.userId = :userId2) " +
           "ORDER BY l1.createdAt DESC")
    List<Like> findMutualLikes(@Param("userId1") String userId1, @Param("userId2") String userId2);

    /**
     * Find posts liked by user with pagination
     */
    @Query("SELECT l FROM Like l WHERE l.userId = :userId ORDER BY l.createdAt DESC")
    List<Like> findLikedPostsByUser(@Param("userId") String userId);

    /**
     * Find users who liked a specific post
     */
    @Query("SELECT l FROM Like l WHERE l.postId = :postId ORDER BY l.createdAt DESC")
    List<Like> findUsersWhoLikedPost(@Param("postId") Long postId);

    /**
     * Count likes for multiple posts
     */
    @Query("SELECT l.postId, COUNT(l) FROM Like l WHERE l.postId IN :postIds GROUP BY l.postId")
    List<Object[]> countLikesByPostIds(@Param("postIds") List<Long> postIds);

    /**
     * Find most liked posts by user
     */
    @Query("SELECT l.postId, COUNT(l) as likeCount FROM Like l " +
           "JOIN Post p ON l.postId = p.id " +
           "WHERE p.authorId = :authorId " +
           "GROUP BY l.postId " +
           "ORDER BY likeCount DESC")
    List<Object[]> findMostLikedPostsByAuthor(@Param("authorId") String authorId);
}
