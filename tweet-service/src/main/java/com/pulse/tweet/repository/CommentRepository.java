package com.pulse.tweet.repository;

import com.pulse.tweet.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    // Find comments by tweet ID ordered by creation date
    List<Comment> findByTweetIdOrderByCreatedAtAsc(Long tweetId);
    
    // Find comments by tweet ID with pagination
    Page<Comment> findByTweetIdOrderByCreatedAtAsc(Long tweetId, Pageable pageable);
    
    // Find comments by author
    List<Comment> findByAuthorUsernameOrderByCreatedAtDesc(String authorUsername);
    
    // Find comments by author with pagination
    Page<Comment> findByAuthorUsernameOrderByCreatedAtDesc(String authorUsername, Pageable pageable);
    
    // Count comments by tweet
    long countByTweetId(Long tweetId);
    
    // Count comments by author
    long countByAuthorUsername(String authorUsername);
    
    // Find comments with tweet information
    @Query("SELECT c FROM Comment c JOIN FETCH c.tweet WHERE c.tweet.id = :tweetId ORDER BY c.createdAt ASC")
    List<Comment> findByTweetIdWithTweet(@Param("tweetId") Long tweetId);
}

