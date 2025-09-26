package com.pulse.post.repository;

import com.pulse.post.entity.Comment;
import com.pulse.post.entity.CommentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Comment Repository
 * 
 * Provides data access methods for Comment entities with custom queries
 * for complex operations like nested replies and comment management.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    /**
     * Find comments by post ID with pagination
     */
    Page<Comment> findByPostIdAndStatusOrderByCreatedAtDesc(Long postId, CommentStatus status, Pageable pageable);

    /**
     * Find top-level comments (not replies) by post ID
     */
    Page<Comment> findByPostIdAndParentIdIsNullAndStatusOrderByCreatedAtDesc(Long postId, CommentStatus status, Pageable pageable);

    /**
     * Find replies to a specific comment
     */
    Page<Comment> findByParentIdAndStatusOrderByCreatedAtAsc(Long parentId, CommentStatus status, Pageable pageable);

    /**
     * Find comments by author ID with pagination
     */
    Page<Comment> findByAuthorIdAndStatusOrderByCreatedAtDesc(String authorId, CommentStatus status, Pageable pageable);

    /**
     * Find comments by post and author
     */
    List<Comment> findByPostIdAndAuthorIdAndStatus(Long postId, String authorId, CommentStatus status);

    /**
     * Count comments by post ID
     */
    long countByPostIdAndStatus(Long postId, CommentStatus status);

    /**
     * Count top-level comments by post ID
     */
    long countByPostIdAndParentIdIsNullAndStatus(Long postId, CommentStatus status);

    /**
     * Count replies to a comment
     */
    long countByParentIdAndStatus(Long parentId, CommentStatus status);

    /**
     * Count comments by author
     */
    long countByAuthorIdAndStatus(String authorId, CommentStatus status);

    /**
     * Search comments by content
     */
    @Query("SELECT c FROM Comment c WHERE c.status = :status AND " +
           "(LOWER(c.content) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY c.createdAt DESC")
    Page<Comment> searchCommentsByContent(@Param("query") String query, @Param("status") CommentStatus status, Pageable pageable);

    /**
     * Find most liked comments for a post
     */
    @Query("SELECT c FROM Comment c WHERE c.postId = :postId AND c.status = :status " +
           "ORDER BY c.likeCount DESC, c.createdAt DESC")
    Page<Comment> findMostLikedCommentsByPost(@Param("postId") Long postId, 
                                              @Param("status") CommentStatus status, 
                                              Pageable pageable);

    /**
     * Find recent comments by multiple authors
     */
    @Query("SELECT c FROM Comment c WHERE c.authorId IN :authorIds AND c.status = :status " +
           "ORDER BY c.createdAt DESC")
    Page<Comment> findRecentCommentsByAuthors(@Param("authorIds") List<String> authorIds, 
                                              @Param("status") CommentStatus status, 
                                              Pageable pageable);

    /**
     * Update comment engagement counts
     */
    @Modifying
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount + :likeDelta, " +
           "c.replyCount = c.replyCount + :replyDelta " +
           "WHERE c.id = :commentId")
    void updateEngagementCounts(@Param("commentId") Long commentId,
                                @Param("likeDelta") Integer likeDelta,
                                @Param("replyDelta") Integer replyDelta);

    /**
     * Find comments for moderation
     */
    Page<Comment> findByStatusOrderByCreatedAtAsc(CommentStatus status, Pageable pageable);

    /**
     * Find all replies to a comment (nested)
     */
    @Query("SELECT c FROM Comment c WHERE c.parentId = :parentId AND c.status = :status " +
           "ORDER BY c.createdAt ASC")
    List<Comment> findAllRepliesToComment(@Param("parentId") Long parentId, @Param("status") CommentStatus status);

    /**
     * Find comment thread (comment + all its replies)
     */
    @Query("SELECT c FROM Comment c WHERE (c.id = :commentId OR c.parentId = :commentId) " +
           "AND c.status = :status ORDER BY c.createdAt ASC")
    List<Comment> findCommentThread(@Param("commentId") Long commentId, @Param("status") CommentStatus status);

    /**
     * Check if comment exists and is published
     */
    boolean existsByIdAndStatus(Long id, CommentStatus status);

    /**
     * Find comment by ID with status check
     */
    Optional<Comment> findByIdAndStatus(Long id, CommentStatus status);

    /**
     * Find comments with minimum like count
     */
    @Query("SELECT c FROM Comment c WHERE c.status = :status AND c.likeCount >= :minLikes " +
           "ORDER BY c.likeCount DESC, c.createdAt DESC")
    Page<Comment> findPopularComments(@Param("status") CommentStatus status, 
                                      @Param("minLikes") Integer minLikes, 
                                      Pageable pageable);

    /**
     * Delete all comments by post ID (for post deletion)
     */
    @Modifying
    @Query("DELETE FROM Comment c WHERE c.postId = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    /**
     * Find comments by post ID with author information
     */
    @Query("SELECT c FROM Comment c WHERE c.postId = :postId AND c.status = :status " +
           "ORDER BY c.createdAt DESC")
    List<Comment> findByPostIdWithAuthor(@Param("postId") Long postId, @Param("status") CommentStatus status);
}
