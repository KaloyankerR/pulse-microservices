package com.pulse.tweet.controller;

import com.pulse.tweet.dto.*;
import com.pulse.tweet.service.TweetService;
import com.pulse.tweet.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tweets")
@Tag(name = "Tweets", description = "Tweet management endpoints")
@CrossOrigin(origins = "*")
public class TweetController {

    @Autowired
    private TweetService tweetService;

    @Autowired
    private JwtUtil jwtUtil;

    // Tweet endpoints
    @PostMapping
    @Operation(summary = "Create a new tweet", description = "Create a new tweet with content")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Tweet created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<?> createTweet(@Valid @RequestBody CreateTweetRequest request, HttpServletRequest httpRequest) {
        try {
            String username = getUsernameFromToken(httpRequest);
            TweetResponse response = tweetService.createTweet(request, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tweet by ID", description = "Retrieve a specific tweet by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tweet found"),
            @ApiResponse(responseCode = "404", description = "Tweet not found")
    })
    public ResponseEntity<?> getTweetById(@PathVariable Long id) {
        Optional<TweetResponse> tweet = tweetService.getTweetById(id);
        return tweet.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/details")
    @Operation(summary = "Get tweet with details", description = "Retrieve a tweet with all comments and likes")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tweet found with details"),
            @ApiResponse(responseCode = "404", description = "Tweet not found")
    })
    public ResponseEntity<?> getTweetWithDetails(@PathVariable Long id) {
        Optional<TweetResponse> tweet = tweetService.getTweetByIdWithDetails(id);
        return tweet.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Get all tweets", description = "Retrieve all tweets with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tweets retrieved successfully")
    })
    public ResponseEntity<Page<TweetResponse>> getAllTweets(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<TweetResponse> tweets = tweetService.getAllTweets(pageable);
        return ResponseEntity.ok(tweets);
    }

    @GetMapping("/author/{username}")
    @Operation(summary = "Get tweets by author", description = "Retrieve all tweets by a specific author")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tweets retrieved successfully")
    })
    public ResponseEntity<Page<TweetResponse>> getTweetsByAuthor(
            @PathVariable String username,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TweetResponse> tweets = tweetService.getTweetsByAuthor(username, pageable);
        return ResponseEntity.ok(tweets);
    }

    @GetMapping("/search")
    @Operation(summary = "Search tweets", description = "Search tweets by content keyword")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
    })
    public ResponseEntity<Page<TweetResponse>> searchTweets(
            @Parameter(description = "Search keyword") @RequestParam String keyword,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TweetResponse> tweets = tweetService.searchTweets(keyword, pageable);
        return ResponseEntity.ok(tweets);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update tweet", description = "Update a tweet (only by the author)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tweet updated successfully"),
            @ApiResponse(responseCode = "404", description = "Tweet not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden - not the author"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<?> updateTweet(@PathVariable Long id, 
                                       @Valid @RequestBody UpdateTweetRequest request,
                                       HttpServletRequest httpRequest) {
        try {
            String username = getUsernameFromToken(httpRequest);
            Optional<TweetResponse> updatedTweet = tweetService.updateTweet(id, request, username);
            return updatedTweet.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete tweet", description = "Delete a tweet (only by the author)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tweet deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Tweet not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden - not the author"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<?> deleteTweet(@PathVariable Long id, HttpServletRequest httpRequest) {
        try {
            String username = getUsernameFromToken(httpRequest);
            boolean deleted = tweetService.deleteTweet(id, username);
            return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    // Comment endpoints
    @PostMapping("/{tweetId}/comments")
    @Operation(summary = "Add comment to tweet", description = "Add a comment to a specific tweet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Comment created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Tweet not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<?> createComment(@PathVariable Long tweetId,
                                         @Valid @RequestBody CreateCommentRequest request,
                                         HttpServletRequest httpRequest) {
        try {
            String username = getUsernameFromToken(httpRequest);
            CommentResponse response = tweetService.createComment(tweetId, request, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{tweetId}/comments")
    @Operation(summary = "Get comments for tweet", description = "Retrieve all comments for a specific tweet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Comments retrieved successfully")
    })
    public ResponseEntity<List<CommentResponse>> getCommentsByTweetId(@PathVariable Long tweetId) {
        List<CommentResponse> comments = tweetService.getCommentsByTweetId(tweetId);
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "Delete comment", description = "Delete a comment (only by the author)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Comment deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Comment not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden - not the author"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, HttpServletRequest httpRequest) {
        try {
            String username = getUsernameFromToken(httpRequest);
            boolean deleted = tweetService.deleteComment(commentId, username);
            return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    // Like endpoints
    @PostMapping("/{tweetId}/like")
    @Operation(summary = "Like a tweet", description = "Like a specific tweet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Tweet liked successfully"),
            @ApiResponse(responseCode = "400", description = "Already liked or invalid data"),
            @ApiResponse(responseCode = "404", description = "Tweet not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<?> likeTweet(@PathVariable Long tweetId, HttpServletRequest httpRequest) {
        try {
            String username = getUsernameFromToken(httpRequest);
            LikeResponse response = tweetService.likeTweet(tweetId, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{tweetId}/like")
    @Operation(summary = "Unlike a tweet", description = "Remove like from a specific tweet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tweet unliked successfully"),
            @ApiResponse(responseCode = "404", description = "Like not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<?> unlikeTweet(@PathVariable Long tweetId, HttpServletRequest httpRequest) {
        try {
            String username = getUsernameFromToken(httpRequest);
            boolean unliked = tweetService.unlikeTweet(tweetId, username);
            return unliked ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{tweetId}/likes")
    @Operation(summary = "Get likes for tweet", description = "Retrieve all likes for a specific tweet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Likes retrieved successfully")
    })
    public ResponseEntity<List<LikeResponse>> getLikesByTweetId(@PathVariable Long tweetId) {
        List<LikeResponse> likes = tweetService.getLikesByTweetId(tweetId);
        return ResponseEntity.ok(likes);
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if the tweet service is running")
    @ApiResponse(responseCode = "200", description = "Service is healthy")
    public ResponseEntity<?> health() {
        Map<String, Object> healthInfo = new HashMap<>();
        healthInfo.put("service", "Tweet Service");
        healthInfo.put("status", "UP");
        healthInfo.put("database", "PostgreSQL (pulse_tweets)");
        healthInfo.put("message", "Tweet service is running with dedicated database");
        healthInfo.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(healthInfo);
    }

    // Helper method to extract username from JWT token
    private String getUsernameFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.extractUsername(token);
        }
        throw new RuntimeException("Invalid or missing JWT token");
    }
}

