package com.pulse.tweet.repository;

import com.pulse.tweet.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    
    // Find like by tweet ID and username
    Optional<Like> findByTweetIdAndUsername(Long tweetId, String username);
    
    // Find all likes for a tweet
    List<Like> findByTweetId(Long tweetId);
    
    // Find all likes by a user
    List<Like> findByUsername(String username);
    
    // Count likes for a tweet
    long countByTweetId(Long tweetId);
    
    // Count likes by a user
    long countByUsername(String username);
    
    // Check if user has liked a tweet
    boolean existsByTweetIdAndUsername(Long tweetId, String username);
    
    // Find likes with tweet information
    @Query("SELECT l FROM Like l JOIN FETCH l.tweet WHERE l.tweet.id = :tweetId")
    List<Like> findByTweetIdWithTweet(@Param("tweetId") Long tweetId);
    
    // Find user's likes with tweet information
    @Query("SELECT l FROM Like l JOIN FETCH l.tweet WHERE l.username = :username ORDER BY l.createdAt DESC")
    List<Like> findByUsernameWithTweet(@Param("username") String username);
}

