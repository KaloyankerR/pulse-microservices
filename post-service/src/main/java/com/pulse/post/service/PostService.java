package com.pulse.post.service;

import com.pulse.post.dto.CreatePostRequest;
import com.pulse.post.dto.PostResponse;
import com.pulse.post.dto.UserDto;
import com.pulse.post.entity.Post;
import com.pulse.post.repository.PostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Post Service
 * 
 * Provides business logic for post management including creation, retrieval,
 * updating, deletion, and content validation.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Service
@Transactional
public class PostService {

    private static final Logger logger = LoggerFactory.getLogger(PostService.class);

    private final PostRepository postRepository;
    private final UserService userService;
    private final ContentValidationService contentValidationService;

    @Autowired
    public PostService(PostRepository postRepository, 
                      UserService userService,
                      ContentValidationService contentValidationService) {
        this.postRepository = postRepository;
        this.userService = userService;
        this.contentValidationService = contentValidationService;
    }

    /**
     * Create a new post
     * 
     * @param request Post creation request
     * @param authorId Author user ID
     * @param authorization JWT authorization token
     * @return Created post response
     */
    public PostResponse createPost(CreatePostRequest request, String authorId, String authorization) {
        logger.info("Creating post for user: {}", authorId);

        // Convert authorId to UUID
        UUID authorUuid = UUID.fromString(authorId);

        // Validate user exists and is active
        if (!userService.isUserActive(authorId, authorization)) {
            throw new IllegalArgumentException("User not found or inactive");
        }

        // Validate and sanitize content
        String sanitizedContent = contentValidationService.validateAndSanitizePostContent(request.getContent());

        // Check content appropriateness
        if (!contentValidationService.isContentAppropriate(sanitizedContent)) {
            throw new IllegalArgumentException("Content violates community guidelines");
        }

        // Create post entity
        Post post = new Post(authorUuid, sanitizedContent);
        if (request.getEventId() != null) {
            post.setEventId(request.getEventId());
        }

        // Save post
        Post savedPost = postRepository.save(post);
        logger.info("Post created successfully with ID: {}", savedPost.getId());

        // Return response with author information
        return buildPostResponse(savedPost, authorization, null);
    }

    /**
     * Get post by ID
     * 
     * @param postId Post ID
     * @param currentUserId Current user ID (for like status)
     * @param authorization JWT authorization token
     * @return Post response
     */
    @Transactional(readOnly = true)
    public PostResponse getPostById(UUID postId, String currentUserId, String authorization) {
        logger.debug("Retrieving post: {}", postId);

        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) {
            throw new IllegalArgumentException("Post not found");
        }

        Post post = postOpt.get();

        return buildPostResponse(post, authorization, currentUserId);
    }

    /**
     * Get posts by author with pagination
     * 
     * @param authorId Author user ID
     * @param page Page number
     * @param size Page size
     * @param currentUserId Current user ID (for like status)
     * @param authorization JWT authorization token
     * @return Page of post responses
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getPostsByAuthor(UUID authorId, int page, int size, 
                                               String currentUserId, String authorization) {
        logger.debug("Retrieving posts for author: {}, page: {}, size: {}", authorId, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(authorId, pageable);

        return posts.map(post -> buildPostResponse(post, authorization, currentUserId));
    }

    /**
     * Get feed posts (following users) with pagination
     * 
     * @param followingUserIds List of following user IDs
     * @param page Page number
     * @param size Page size
     * @param currentUserId Current user ID (for like status)
     * @param authorization JWT authorization token
     * @return Page of post responses
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getFeedPosts(List<UUID> followingUserIds, int page, int size,
                                          String currentUserId, String authorization) {
        logger.debug("Retrieving feed posts for {} users, page: {}, size: {}", 
                    followingUserIds.size(), page, size);

        if (followingUserIds.isEmpty()) {
            return Page.empty();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> posts = postRepository.findByAuthorIdInOrderByCreatedAtDesc(followingUserIds, pageable);

        return posts.map(post -> buildPostResponse(post, authorization, currentUserId));
    }

    /**
     * Search posts by content
     * 
     * @param query Search query
     * @param page Page number
     * @param size Page size
     * @param currentUserId Current user ID (for like status)
     * @param authorization JWT authorization token
     * @return Page of post responses
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> searchPosts(String query, int page, int size,
                                         String currentUserId, String authorization) {
        logger.debug("Searching posts with query: {}, page: {}, size: {}", query, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> posts = postRepository.searchPostsByContent(query, pageable);

        return posts.map(post -> buildPostResponse(post, authorization, currentUserId));
    }

    /**
     * Get trending posts
     * 
     * @param page Page number
     * @param size Page size
     * @param currentUserId Current user ID (for like status)
     * @param authorization JWT authorization token
     * @return Page of post responses
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getTrendingPosts(int page, int size, String currentUserId, String authorization) {
        logger.debug("Retrieving trending posts, page: {}, size: {}", page, size);

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        Pageable pageable = PageRequest.of(page, size, Sort.by("likeCount").descending()
                                                      .and(Sort.by("createdAt").descending()));
        Page<Post> posts = postRepository.findTrendingPosts(since, pageable);

        return posts.map(post -> buildPostResponse(post, authorization, currentUserId));
    }

    /**
     * Update post content
     * 
     * @param postId Post ID
     * @param newContent New content
     * @param authorId Author user ID
     * @param authorization JWT authorization token
     * @return Updated post response
     */
    public PostResponse updatePost(UUID postId, String newContent, String authorId, String authorization) {
        logger.info("Updating post: {} by user: {}", postId, authorId);

        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) {
            throw new IllegalArgumentException("Post not found");
        }

        Post post = postOpt.get();

        // Check ownership
        if (!post.getAuthorId().toString().equals(authorId)) {
            throw new IllegalArgumentException("Not authorized to update this post");
        }

        // Validate and sanitize new content
        String sanitizedContent = contentValidationService.validateAndSanitizePostContent(newContent);

        // Check content appropriateness
        if (!contentValidationService.isContentAppropriate(sanitizedContent)) {
            throw new IllegalArgumentException("Content violates community guidelines");
        }

        // Update post
        post.setContent(sanitizedContent);
        Post updatedPost = postRepository.save(post);

        logger.info("Post updated successfully: {}", postId);
        return buildPostResponse(updatedPost, authorization, authorId);
    }

    /**
     * Delete post
     * 
     * @param postId Post ID
     * @param authorId Author user ID
     * @return Success message
     */
    public String deletePost(UUID postId, String authorId) {
        logger.info("Deleting post: {} by user: {}", postId, authorId);

        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) {
            throw new IllegalArgumentException("Post not found");
        }

        Post post = postOpt.get();

        // Check ownership
        if (!post.getAuthorId().toString().equals(authorId)) {
            throw new IllegalArgumentException("Not authorized to delete this post");
        }

        // Hard delete
        postRepository.delete(post);

        logger.info("Post deleted successfully: {}", postId);
        return "Post deleted successfully";
    }

    /**
     * Build post response with author information and like status
     * 
     * @param post Post entity
     * @param authorization JWT authorization token
     * @param currentUserId Current user ID for like status
     * @return Post response
     */
    private PostResponse buildPostResponse(Post post, String authorization, String currentUserId) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setContent(post.getContent());
        response.setEventId(post.getEventId());
        response.setLikeCount(post.getLikeCount());
        response.setCommentCount(post.getCommentCount());
        response.setCreatedAt(post.getCreatedAt());

        // Get author information
        UserDto author = userService.getUserById(post.getAuthorId().toString(), authorization);
        response.setAuthor(author);

        // Check if current user has liked this post
        if (currentUserId != null) {
            // This would require a like repository check
            // For now, we'll set it to false
            response.setIsLiked(false);
        }

        return response;
    }
}
