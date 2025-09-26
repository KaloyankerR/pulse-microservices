package com.pulse.post.service;

import org.apache.commons.text.StringEscapeUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Content Validation Service
 * 
 * Provides content validation and sanitization for posts and comments.
 * Implements security measures and content policy enforcement.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Service
public class ContentValidationService {

    private static final Logger logger = LoggerFactory.getLogger(ContentValidationService.class);

    @Value("${content.max-post-length:2000}")
    private int maxPostLength;

    @Value("${content.max-comment-length:500}")
    private int maxCommentLength;

    @Value("${content.max-image-size-mb:10}")
    private int maxImageSizeMb;

    @Value("${content.max-video-size-mb:100}")
    private int maxVideoSizeMb;

    @Value("${content.allowed-image-types:jpg,jpeg,png,gif,webp}")
    private String allowedImageTypes;

    @Value("${content.allowed-video-types:mp4,webm,mov}")
    private String allowedVideoTypes;

    // Patterns for content validation
    private static final Pattern URL_PATTERN = Pattern.compile(
        "https?://[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?"
    );

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    );

    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "\\+?[1-9]\\d{1,14}"
    );

    // List of potentially harmful patterns
    private static final List<String> SUSPICIOUS_PATTERNS = Arrays.asList(
        "<script", "javascript:", "onload=", "onerror=", "onclick=",
        "data:text/html", "vbscript:", "expression("
    );

    /**
     * Validate and sanitize post content
     * 
     * @param content The post content to validate
     * @return Sanitized content
     * @throws IllegalArgumentException if content is invalid
     */
    public String validateAndSanitizePostContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Post content cannot be empty");
        }

        // Check length
        if (content.length() > maxPostLength) {
            throw new IllegalArgumentException(
                String.format("Post content cannot exceed %d characters", maxPostLength)
            );
        }

        return sanitizeContent(content);
    }

    /**
     * Validate and sanitize comment content
     * 
     * @param content The comment content to validate
     * @return Sanitized content
     * @throws IllegalArgumentException if content is invalid
     */
    public String validateAndSanitizeCommentContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content cannot be empty");
        }

        // Check length
        if (content.length() > maxCommentLength) {
            throw new IllegalArgumentException(
                String.format("Comment content cannot exceed %d characters", maxCommentLength)
            );
        }

        return sanitizeContent(content);
    }

    /**
     * Validate image URLs
     * 
     * @param imageUrls Array of image URLs to validate
     * @throws IllegalArgumentException if any URL is invalid
     */
    public void validateImageUrls(String[] imageUrls) {
        if (imageUrls == null || imageUrls.length == 0) {
            return;
        }

        if (imageUrls.length > 10) {
            throw new IllegalArgumentException("Cannot attach more than 10 images");
        }

        List<String> allowedTypes = Arrays.asList(allowedImageTypes.split(","));

        for (String url : imageUrls) {
            validateUrl(url);
            
            // Check file extension
            String extension = getFileExtension(url);
            if (extension == null || !allowedTypes.contains(extension.toLowerCase())) {
                throw new IllegalArgumentException(
                    String.format("Invalid image type: %s. Allowed types: %s", 
                                extension, allowedImageTypes)
                );
            }
        }
    }

    /**
     * Validate video URL
     * 
     * @param videoUrl Video URL to validate
     * @throws IllegalArgumentException if URL is invalid
     */
    public void validateVideoUrl(String videoUrl) {
        if (videoUrl == null || videoUrl.trim().isEmpty()) {
            return;
        }

        validateUrl(videoUrl);

        // Check file extension
        String extension = getFileExtension(videoUrl);
        List<String> allowedTypes = Arrays.asList(allowedVideoTypes.split(","));
        
        if (extension == null || !allowedTypes.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException(
                String.format("Invalid video type: %s. Allowed types: %s", 
                            extension, allowedVideoTypes)
            );
        }
    }

    /**
     * Check if content contains inappropriate material
     * 
     * @param content Content to check
     * @return true if content is appropriate, false otherwise
     */
    public boolean isContentAppropriate(String content) {
        if (content == null) {
            return true;
        }

        String lowerContent = content.toLowerCase();

        // Check for suspicious patterns
        for (String pattern : SUSPICIOUS_PATTERNS) {
            if (lowerContent.contains(pattern)) {
                logger.warn("Suspicious content detected: {}", pattern);
                return false;
            }
        }

        // Additional content moderation logic can be added here
        // This could integrate with external content moderation services

        return true;
    }

    /**
     * Extract hashtags from content
     * 
     * @param content Content to extract hashtags from
     * @return List of hashtags
     */
    public List<String> extractHashtags(String content) {
        if (content == null) {
            return List.of();
        }

        Pattern hashtagPattern = Pattern.compile("#\\w+");
        return hashtagPattern.matcher(content)
            .results()
            .map(match -> match.group().toLowerCase())
            .distinct()
            .toList();
    }

    /**
     * Extract mentions from content
     * 
     * @param content Content to extract mentions from
     * @return List of mentioned usernames
     */
    public List<String> extractMentions(String content) {
        if (content == null) {
            return List.of();
        }

        Pattern mentionPattern = Pattern.compile("@\\w+");
        return mentionPattern.matcher(content)
            .results()
            .map(match -> match.group().substring(1)) // Remove @ symbol
            .distinct()
            .toList();
    }

    /**
     * Sanitize content by escaping HTML and removing dangerous patterns
     * 
     * @param content Content to sanitize
     * @return Sanitized content
     */
    private String sanitizeContent(String content) {
        // Escape HTML entities
        String sanitized = StringEscapeUtils.escapeHtml4(content);

        // Remove or escape potentially dangerous patterns
        for (String pattern : SUSPICIOUS_PATTERNS) {
            sanitized = sanitized.replaceAll("(?i)" + Pattern.quote(pattern), "");
        }

        // Trim whitespace
        sanitized = sanitized.trim();

        return sanitized;
    }

    /**
     * Validate URL format and security
     * 
     * @param url URL to validate
     * @throws IllegalArgumentException if URL is invalid
     */
    private void validateUrl(String url) {
        if (!URL_PATTERN.matcher(url).matches()) {
            throw new IllegalArgumentException("Invalid URL format: " + url);
        }

        // Check for dangerous protocols
        if (url.toLowerCase().startsWith("javascript:") || 
            url.toLowerCase().startsWith("data:") ||
            url.toLowerCase().startsWith("vbscript:")) {
            throw new IllegalArgumentException("Dangerous URL protocol: " + url);
        }
    }

    /**
     * Extract file extension from URL
     * 
     * @param url URL to extract extension from
     * @return File extension or null if not found
     */
    private String getFileExtension(String url) {
        int lastDotIndex = url.lastIndexOf('.');
        int lastSlashIndex = url.lastIndexOf('/');
        
        if (lastDotIndex > lastSlashIndex && lastDotIndex < url.length() - 1) {
            return url.substring(lastDotIndex + 1);
        }
        
        return null;
    }
}
