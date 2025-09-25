package com.pulse.tweet.service;

import com.pulse.tweet.dto.*;
import com.pulse.tweet.entity.Comment;
import com.pulse.tweet.entity.Like;
import com.pulse.tweet.entity.Tweet;
import com.pulse.tweet.repository.CommentRepository;
import com.pulse.tweet.repository.LikeRepository;
import com.pulse.tweet.repository.TweetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class TweetService {

    @Autowired
    private TweetRepository tweetRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private LikeRepository likeRepository;

    // Tweet operations
    public TweetResponse createTweet(CreateTweetRequest request, String authorUsername) {
        Tweet tweet = new Tweet(request.getContent(), authorUsername);
        Tweet savedTweet = tweetRepository.save(tweet);
        return new TweetResponse(savedTweet);
    }

    public Optional<TweetResponse> getTweetById(Long id) {
        return tweetRepository.findById(id)
                .map(TweetResponse::new);
    }

    public Optional<TweetResponse> getTweetByIdWithDetails(Long id) {
        return tweetRepository.findByIdWithCommentsAndLikes(id)
                .map(TweetResponse::new);
    }

    public Page<TweetResponse> getAllTweets(Pageable pageable) {
        return tweetRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(TweetResponse::new);
    }

    public Page<TweetResponse> getTweetsByAuthor(String authorUsername, Pageable pageable) {
        return tweetRepository.findByAuthorUsernameOrderByCreatedAtDesc(authorUsername, pageable)
                .map(TweetResponse::new);
    }

    public Page<TweetResponse> searchTweets(String keyword, Pageable pageable) {
        return tweetRepository.findByContentContainingIgnoreCase(keyword, pageable)
                .map(TweetResponse::new);
    }

    public Optional<TweetResponse> updateTweet(Long id, UpdateTweetRequest request, String authorUsername) {
        return tweetRepository.findById(id)
                .map(tweet -> {
                    if (!tweet.getAuthorUsername().equals(authorUsername)) {
                        throw new RuntimeException("You can only update your own tweets");
                    }
                    tweet.setContent(request.getContent());
                    Tweet updatedTweet = tweetRepository.save(tweet);
                    return new TweetResponse(updatedTweet);
                });
    }

    public boolean deleteTweet(Long id, String authorUsername) {
        return tweetRepository.findById(id)
                .map(tweet -> {
                    if (!tweet.getAuthorUsername().equals(authorUsername)) {
                        throw new RuntimeException("You can only delete your own tweets");
                    }
                    tweetRepository.delete(tweet);
                    return true;
                })
                .orElse(false);
    }

    // Comment operations
    public CommentResponse createComment(Long tweetId, CreateCommentRequest request, String authorUsername) {
        Tweet tweet = tweetRepository.findById(tweetId)
                .orElseThrow(() -> new RuntimeException("Tweet not found"));

        Comment comment = new Comment(request.getContent(), authorUsername, tweet);
        Comment savedComment = commentRepository.save(comment);
        return new CommentResponse(savedComment);
    }

    public List<CommentResponse> getCommentsByTweetId(Long tweetId) {
        return commentRepository.findByTweetIdOrderByCreatedAtAsc(tweetId)
                .stream()
                .map(CommentResponse::new)
                .collect(Collectors.toList());
    }

    public Page<CommentResponse> getCommentsByTweetId(Long tweetId, Pageable pageable) {
        return commentRepository.findByTweetIdOrderByCreatedAtAsc(tweetId, pageable)
                .map(CommentResponse::new);
    }

    public List<CommentResponse> getCommentsByAuthor(String authorUsername) {
        return commentRepository.findByAuthorUsernameOrderByCreatedAtDesc(authorUsername)
                .stream()
                .map(CommentResponse::new)
                .collect(Collectors.toList());
    }

    public boolean deleteComment(Long commentId, String authorUsername) {
        return commentRepository.findById(commentId)
                .map(comment -> {
                    if (!comment.getAuthorUsername().equals(authorUsername)) {
                        throw new RuntimeException("You can only delete your own comments");
                    }
                    commentRepository.delete(comment);
                    return true;
                })
                .orElse(false);
    }

    // Like operations
    public LikeResponse likeTweet(Long tweetId, String username) {
        Tweet tweet = tweetRepository.findById(tweetId)
                .orElseThrow(() -> new RuntimeException("Tweet not found"));

        // Check if user already liked this tweet
        if (likeRepository.existsByTweetIdAndUsername(tweetId, username)) {
            throw new RuntimeException("You have already liked this tweet");
        }

        Like like = new Like(username, tweet);
        Like savedLike = likeRepository.save(like);
        return new LikeResponse(savedLike);
    }

    public boolean unlikeTweet(Long tweetId, String username) {
        return likeRepository.findByTweetIdAndUsername(tweetId, username)
                .map(like -> {
                    likeRepository.delete(like);
                    return true;
                })
                .orElse(false);
    }

    public List<LikeResponse> getLikesByTweetId(Long tweetId) {
        return likeRepository.findByTweetId(tweetId)
                .stream()
                .map(LikeResponse::new)
                .collect(Collectors.toList());
    }

    public List<LikeResponse> getLikesByUser(String username) {
        return likeRepository.findByUsernameWithTweet(username)
                .stream()
                .map(LikeResponse::new)
                .collect(Collectors.toList());
    }

    public boolean hasUserLikedTweet(Long tweetId, String username) {
        return likeRepository.existsByTweetIdAndUsername(tweetId, username);
    }

    // Statistics
    public long getTweetCountByAuthor(String authorUsername) {
        return tweetRepository.countByAuthorUsername(authorUsername);
    }

    public long getCommentCountByTweet(Long tweetId) {
        return commentRepository.countByTweetId(tweetId);
    }

    public long getCommentCountByAuthor(String authorUsername) {
        return commentRepository.countByAuthorUsername(authorUsername);
    }

    public long getLikeCountByTweet(Long tweetId) {
        return likeRepository.countByTweetId(tweetId);
    }

    public long getLikeCountByUser(String username) {
        return likeRepository.countByUsername(username);
    }
}

