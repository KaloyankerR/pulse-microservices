package com.pulse.post.integration;

import com.pulse.post.dto.CreatePostRequest;
import com.pulse.post.dto.PostResponse;
import com.pulse.post.entity.Post;
import com.pulse.post.entity.PostStatus;
import com.pulse.post.repository.PostRepository;
import com.pulse.post.service.PostService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Post Service Integration Tests
 * 
 * Tests the integration between Post Service and User Service
 * with real database operations.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PostServiceIntegrationTest {

    @Autowired
    private PostService postService;

    @Autowired
    private PostRepository postRepository;

    private static final String TEST_USER_ID = "test-user-123";
    private static final String TEST_AUTHORIZATION = "Bearer test-jwt-token";

    @BeforeEach
    void setUp() {
        // Clean up test data
        postRepository.deleteAll();
    }

    @Test
    void testCreatePost_Success() {
        // Given
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("This is a test post content");
        request.setImageUrls(new String[]{"https://example.com/image1.jpg"});

        // When
        PostResponse response = postService.createPost(request, TEST_USER_ID, TEST_AUTHORIZATION);

        // Then
        assertNotNull(response);
        assertEquals("This is a test post content", response.getContent());
        assertEquals(TEST_USER_ID, response.getAuthor().getId());
        assertEquals(PostStatus.PUBLISHED, response.getStatus());
        assertEquals(0, response.getLikeCount());
        assertEquals(0, response.getCommentCount());
        assertNotNull(response.getCreatedAt());
    }

    @Test
    void testCreatePost_WithVideo() {
        // Given
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("Check out this amazing video!");
        request.setVideoUrl("https://example.com/video.mp4");

        // When
        PostResponse response = postService.createPost(request, TEST_USER_ID, TEST_AUTHORIZATION);

        // Then
        assertNotNull(response);
        assertEquals("Check out this amazing video!", response.getContent());
        assertEquals("https://example.com/video.mp4", response.getVideoUrl());
        assertNull(response.getImageUrls());
    }

    @Test
    void testCreatePost_EmptyContent_ThrowsException() {
        // Given
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("");

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            postService.createPost(request, TEST_USER_ID, TEST_AUTHORIZATION);
        });
    }

    @Test
    void testCreatePost_ContentTooLong_ThrowsException() {
        // Given
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("x".repeat(2001)); // Exceeds 2000 character limit

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            postService.createPost(request, TEST_USER_ID, TEST_AUTHORIZATION);
        });
    }

    @Test
    void testGetPostById_Success() {
        // Given
        Post post = new Post(TEST_USER_ID, "Test post content");
        post.setStatus(PostStatus.PUBLISHED);
        Post savedPost = postRepository.save(post);

        // When
        PostResponse response = postService.getPostById(savedPost.getId(), TEST_USER_ID, TEST_AUTHORIZATION);

        // Then
        assertNotNull(response);
        assertEquals(savedPost.getId(), response.getId());
        assertEquals("Test post content", response.getContent());
        assertEquals(TEST_USER_ID, response.getAuthor().getId());
        assertEquals(1, response.getViewCount()); // Should increment view count
    }

    @Test
    void testGetPostById_NotFound_ThrowsException() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            postService.getPostById(999L, TEST_USER_ID, TEST_AUTHORIZATION);
        });
    }

    @Test
    void testUpdatePost_Success() {
        // Given
        Post post = new Post(TEST_USER_ID, "Original content");
        post.setStatus(PostStatus.PUBLISHED);
        Post savedPost = postRepository.save(post);

        String newContent = "Updated content";

        // When
        PostResponse response = postService.updatePost(savedPost.getId(), newContent, TEST_USER_ID, TEST_AUTHORIZATION);

        // Then
        assertNotNull(response);
        assertEquals(newContent, response.getContent());
        assertTrue(response.getIsEdited());
        assertNotNull(response.getEditedAt());
    }

    @Test
    void testUpdatePost_NotAuthor_ThrowsException() {
        // Given
        Post post = new Post("different-user", "Original content");
        post.setStatus(PostStatus.PUBLISHED);
        Post savedPost = postRepository.save(post);

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            postService.updatePost(savedPost.getId(), "New content", TEST_USER_ID, TEST_AUTHORIZATION);
        });
    }

    @Test
    void testDeletePost_Success() {
        // Given
        Post post = new Post(TEST_USER_ID, "Post to delete");
        post.setStatus(PostStatus.PUBLISHED);
        Post savedPost = postRepository.save(post);

        // When
        String result = postService.deletePost(savedPost.getId(), TEST_USER_ID);

        // Then
        assertEquals("Post deleted successfully", result);
        
        // Verify post status changed to REMOVED
        Post deletedPost = postRepository.findById(savedPost.getId()).orElse(null);
        assertNotNull(deletedPost);
        assertEquals(PostStatus.REMOVED, deletedPost.getStatus());
    }

    @Test
    void testDeletePost_NotAuthor_ThrowsException() {
        // Given
        Post post = new Post("different-user", "Post to delete");
        post.setStatus(PostStatus.PUBLISHED);
        Post savedPost = postRepository.save(post);

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            postService.deletePost(savedPost.getId(), TEST_USER_ID);
        });
    }

    @Test
    void testGetPostsByAuthor_Success() {
        // Given
        Post post1 = new Post(TEST_USER_ID, "First post");
        post1.setStatus(PostStatus.PUBLISHED);
        Post post2 = new Post(TEST_USER_ID, "Second post");
        post2.setStatus(PostStatus.PUBLISHED);
        postRepository.save(post1);
        postRepository.save(post2);

        // When
        var response = postService.getPostsByAuthor(TEST_USER_ID, 0, 10, TEST_USER_ID, TEST_AUTHORIZATION);

        // Then
        assertNotNull(response);
        assertEquals(2, response.getTotalElements());
        assertEquals(2, response.getContent().size());
    }

    @Test
    void testSearchPosts_Success() {
        // Given
        Post post1 = new Post(TEST_USER_ID, "Spring Boot is awesome");
        post1.setStatus(PostStatus.PUBLISHED);
        Post post2 = new Post(TEST_USER_ID, "Java development tips");
        post2.setStatus(PostStatus.PUBLISHED);
        postRepository.save(post1);
        postRepository.save(post2);

        // When
        var response = postService.searchPosts("Spring", 0, 10, TEST_USER_ID, TEST_AUTHORIZATION);

        // Then
        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals("Spring Boot is awesome", response.getContent().get(0).getContent());
    }
}
