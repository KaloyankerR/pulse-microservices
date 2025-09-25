package com.pulse.tweet.repository;

import com.pulse.tweet.entity.Tweet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TweetRepository extends JpaRepository<Tweet, Long> {
    
    // Find tweets by author
    List<Tweet> findByAuthorUsernameOrderByCreatedAtDesc(String authorUsername);
    
    // Find tweets by author with pagination
    Page<Tweet> findByAuthorUsernameOrderByCreatedAtDesc(String authorUsername, Pageable pageable);
    
    // Find all tweets ordered by creation date (newest first)
    Page<Tweet> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // Search tweets by content
    @Query("SELECT t FROM Tweet t WHERE LOWER(t.content) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY t.createdAt DESC")
    Page<Tweet> findByContentContainingIgnoreCase(@Param("keyword") String keyword, Pageable pageable);
    
    // Count tweets by author
    long countByAuthorUsername(String authorUsername);
    
    // Find tweet with comments and likes
    @Query("SELECT t FROM Tweet t LEFT JOIN FETCH t.comments LEFT JOIN FETCH t.likes WHERE t.id = :id")
    Optional<Tweet> findByIdWithCommentsAndLikes(@Param("id") Long id);
}

