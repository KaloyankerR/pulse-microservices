package com.pulse.tweet.dto;

import com.pulse.tweet.entity.Tweet;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class TweetResponse {

    private Long id;
    private String content;
    private String authorUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int commentCount;
    private int likeCount;
    private List<CommentResponse> comments;
    private List<LikeResponse> likes;

    // Constructors
    public TweetResponse() {}

    public TweetResponse(Tweet tweet) {
        this.id = tweet.getId();
        this.content = tweet.getContent();
        this.authorUsername = tweet.getAuthorUsername();
        this.createdAt = tweet.getCreatedAt();
        this.updatedAt = tweet.getUpdatedAt();
        this.commentCount = tweet.getCommentCount();
        this.likeCount = tweet.getLikeCount();
        
        if (tweet.getComments() != null) {
            this.comments = tweet.getComments().stream()
                    .map(CommentResponse::new)
                    .collect(Collectors.toList());
        }
        
        if (tweet.getLikes() != null) {
            this.likes = tweet.getLikes().stream()
                    .map(LikeResponse::new)
                    .collect(Collectors.toList());
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAuthorUsername() {
        return authorUsername;
    }

    public void setAuthorUsername(String authorUsername) {
        this.authorUsername = authorUsername;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public int getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(int commentCount) {
        this.commentCount = commentCount;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }

    public List<CommentResponse> getComments() {
        return comments;
    }

    public void setComments(List<CommentResponse> comments) {
        this.comments = comments;
    }

    public List<LikeResponse> getLikes() {
        return likes;
    }

    public void setLikes(List<LikeResponse> likes) {
        this.likes = likes;
    }
}

