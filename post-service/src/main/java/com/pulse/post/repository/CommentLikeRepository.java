package com.pulse.post.repository;

import com.pulse.post.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Comment Like Repository
 * 
 * Provides data access methods for CommentLike entities with custom queries
 * for comment like management and analytics.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    /**
     * Find comment like by comment ID and user ID
     */
    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, String userId);

    /**
     * Check if user has liked a comment
     */
    boolean existsByCommentIdAndUserId(Long commentId, String userId);

    /**
     * Find all likes for a comment
     */
    List<CommentLike> findByCommentIdOrderByCreatedAtDesc(Long commentId);

    /**
     * Find all comment likes by user
     */
    List<CommentLike> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Count likes for a comment
     */
    long countByCommentId(Long commentId);

    /**
     * Count comment likes by user
     */
    long countByUserId(String userId);

    /**
     * Delete comment like by comment ID and user ID
     */
    @Modifying
    @Query("DELETE FROM CommentLike cl WHERE cl.commentId = :commentId AND cl.userId = :userId")
    void deleteByCommentIdAndUserId(@Param("commentId") Long commentId, @Param("userId") String userId);

    /**
     * Delete all likes for a comment
     */
    @Modifying
    @Query("DELETE FROM CommentLike cl WHERE cl.commentId = :commentId")
    void deleteByCommentId(@Param("commentId") Long commentId);

    /**
     * Delete all comment likes by user
     */
    @Modifying
    @Query("DELETE FROM CommentLike cl WHERE cl.userId = :userId")
    void deleteByUserId(@Param("userId") String userId);

    /**
     * Find recent likes for a comment
     */
    @Query("SELECT cl FROM CommentLike cl WHERE cl.commentId = :commentId ORDER BY cl.createdAt DESC")
    List<CommentLike> findRecentLikesByComment(@Param("commentId") Long commentId);

    /**
     * Find likes by multiple comment IDs
     */
    @Query("SELECT cl FROM CommentLike cl WHERE cl.commentId IN :commentIds ORDER BY cl.createdAt DESC")
    List<CommentLike> findByCommentIdIn(@Param("commentIds") List<Long> commentIds);

    /**
     * Find users who liked a specific comment
     */
    @Query("SELECT cl FROM CommentLike cl WHERE cl.commentId = :commentId ORDER BY cl.createdAt DESC")
    List<CommentLike> findUsersWhoLikedComment(@Param("commentId") Long commentId);

    /**
     * Count likes for multiple comments
     */
    @Query("SELECT cl.commentId, COUNT(cl) FROM CommentLike cl WHERE cl.commentId IN :commentIds GROUP BY cl.commentId")
    List<Object[]> countLikesByCommentIds(@Param("commentIds") List<Long> commentIds);

    /**
     * Find most liked comments by user
     */
    @Query("SELECT cl.commentId, COUNT(cl) as likeCount FROM CommentLike cl " +
           "JOIN Comment c ON cl.commentId = c.id " +
           "WHERE c.authorId = :authorId " +
           "GROUP BY cl.commentId " +
           "ORDER BY likeCount DESC")
    List<Object[]> findMostLikedCommentsByAuthor(@Param("authorId") String authorId);

    /**
     * Find mutual comment likes between two users
     */
    @Query("SELECT cl1 FROM CommentLike cl1 WHERE cl1.userId = :userId1 AND cl1.commentId IN " +
           "(SELECT cl2.commentId FROM CommentLike cl2 WHERE cl2.userId = :userId2) " +
           "ORDER BY cl1.createdAt DESC")
    List<CommentLike> findMutualCommentLikes(@Param("userId1") String userId1, @Param("userId2") String userId2);
}
