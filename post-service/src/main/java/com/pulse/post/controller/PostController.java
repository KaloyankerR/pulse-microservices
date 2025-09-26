package com.pulse.post.controller;

import com.pulse.post.dto.CreatePostRequest;
import com.pulse.post.dto.PostResponse;
import com.pulse.post.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Post Controller
 * 
 * REST API endpoints for post management including creation, retrieval,
 * updating, deletion, and search operations.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/posts")
@Tag(name = "Posts", description = "Post management operations")
@SecurityRequirement(name = "bearerAuth")
public class PostController {

    private static final Logger logger = LoggerFactory.getLogger(PostController.class);

    private final PostService postService;

    @Autowired
    public PostController(PostService postService) {
        this.postService = postService;
    }

    /**
     * Create a new post
     */
    @PostMapping
    @Operation(summary = "Create a new post", description = "Creates a new post with content and optional media")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Post created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody CreatePostRequest request,
            Authentication authentication,
            @RequestHeader("Authorization") String authorization) {
        
        logger.info("Creating post for user: {}", authentication.getName());
        
        try {
            PostResponse response = postService.createPost(request, authentication.getName(), authorization);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid post creation request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get post by ID
     */
    @GetMapping("/{postId}")
    @Operation(summary = "Get post by ID", description = "Retrieves a specific post by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Post retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Post not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<PostResponse> getPost(
            @PathVariable Long postId,
            Authentication authentication,
            @RequestHeader("Authorization") String authorization) {
        
        logger.debug("Retrieving post: {}", postId);
        
        try {
            PostResponse response = postService.getPostById(postId, authentication.getName(), authorization);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Post not found: {}", postId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get posts by author
     */
    @GetMapping("/author/{authorId}")
    @Operation(summary = "Get posts by author", description = "Retrieves posts created by a specific author")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Posts retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<PostResponse>> getPostsByAuthor(
            @PathVariable String authorId,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication,
            @RequestHeader("Authorization") String authorization) {
        
        logger.debug("Retrieving posts for author: {}, page: {}, size: {}", authorId, page, size);
        
        Page<PostResponse> response = postService.getPostsByAuthor(
            authorId, page, size, authentication.getName(), authorization);
        return ResponseEntity.ok(response);
    }

    /**
     * Get feed posts (following users)
     */
    @GetMapping("/feed")
    @Operation(summary = "Get feed posts", description = "Retrieves posts from users that the current user follows")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Feed posts retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<PostResponse>> getFeedPosts(
            @Parameter(description = "Comma-separated list of following user IDs") 
            @RequestParam List<String> following,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication,
            @RequestHeader("Authorization") String authorization) {
        
        logger.debug("Retrieving feed posts for {} users, page: {}, size: {}", 
                    following.size(), page, size);
        
        Page<PostResponse> response = postService.getFeedPosts(
            following, page, size, authentication.getName(), authorization);
        return ResponseEntity.ok(response);
    }

    /**
     * Search posts
     */
    @GetMapping("/search")
    @Operation(summary = "Search posts", description = "Searches posts by content")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Search results retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid search query"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<PostResponse>> searchPosts(
            @Parameter(description = "Search query") @RequestParam String q,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication,
            @RequestHeader("Authorization") String authorization) {
        
        logger.debug("Searching posts with query: {}, page: {}, size: {}", q, page, size);
        
        if (q.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        Page<PostResponse> response = postService.searchPosts(
            q, page, size, authentication.getName(), authorization);
        return ResponseEntity.ok(response);
    }

    /**
     * Get trending posts
     */
    @GetMapping("/trending")
    @Operation(summary = "Get trending posts", description = "Retrieves trending posts from the last 24 hours")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trending posts retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<PostResponse>> getTrendingPosts(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication,
            @RequestHeader("Authorization") String authorization) {
        
        logger.debug("Retrieving trending posts, page: {}, size: {}", page, size);
        
        Page<PostResponse> response = postService.getTrendingPosts(
            page, size, authentication.getName(), authorization);
        return ResponseEntity.ok(response);
    }

    /**
     * Update post
     */
    @PutMapping("/{postId}")
    @Operation(summary = "Update post", description = "Updates the content of an existing post")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Post updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - not the post author"),
        @ApiResponse(responseCode = "404", description = "Post not found")
    })
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long postId,
            @Parameter(description = "New post content") @RequestParam String content,
            Authentication authentication,
            @RequestHeader("Authorization") String authorization) {
        
        logger.info("Updating post: {} by user: {}", postId, authentication.getName());
        
        try {
            PostResponse response = postService.updatePost(
                postId, content, authentication.getName(), authorization);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Post update failed: {}", e.getMessage());
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("Not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete post
     */
    @DeleteMapping("/{postId}")
    @Operation(summary = "Delete post", description = "Deletes a post (soft delete)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Post deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - not the post author"),
        @ApiResponse(responseCode = "404", description = "Post not found")
    })
    public ResponseEntity<String> deletePost(
            @PathVariable Long postId,
            Authentication authentication) {
        
        logger.info("Deleting post: {} by user: {}", postId, authentication.getName());
        
        try {
            String message = postService.deletePost(postId, authentication.getName());
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            logger.warn("Post deletion failed: {}", e.getMessage());
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("Not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.badRequest().build();
        }
    }
}
