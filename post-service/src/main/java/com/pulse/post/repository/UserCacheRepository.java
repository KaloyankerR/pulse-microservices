package com.pulse.post.repository;

import com.pulse.post.entity.UserCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * User Cache Repository
 * 
 * Provides data access methods for the user_cache table.
 * Includes methods for cache management and synchronization.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Repository
public interface UserCacheRepository extends JpaRepository<UserCache, UUID> {

    /**
     * Find user cache by username
     * 
     * @param username The username to search for
     * @return Optional UserCache
     */
    Optional<UserCache> findByUsername(String username);

    /**
     * Find user cache by ID
     * 
     * @param id The user ID
     * @return Optional UserCache
     */
    Optional<UserCache> findById(UUID id);

    /**
     * Find users that need cache refresh based on last sync time
     * 
     * @param threshold The threshold time for cache refresh
     * @return List of UserCache entries that need refresh
     */
    @Query("SELECT uc FROM UserCache uc WHERE uc.lastSynced < :threshold")
    List<UserCache> findStaleCacheEntries(@Param("threshold") LocalDateTime threshold);

    /**
     * Update cache entry with new user information
     * 
     * @param id User ID
     * @param username Username
     * @param displayName Display name
     * @param avatarUrl Avatar URL
     * @param verified Verification status
     * @param lastSynced Last sync timestamp
     * @return Number of updated records
     */
    @Modifying
    @Query("UPDATE UserCache uc SET uc.username = :username, uc.displayName = :displayName, " +
           "uc.avatarUrl = :avatarUrl, uc.verified = :verified, uc.lastSynced = :lastSynced " +
           "WHERE uc.id = :id")
    int updateCacheEntry(@Param("id") UUID id, 
                        @Param("username") String username,
                        @Param("displayName") String displayName,
                        @Param("avatarUrl") String avatarUrl,
                        @Param("verified") Boolean verified,
                        @Param("lastSynced") LocalDateTime lastSynced);

    /**
     * Delete cache entries older than specified time
     * 
     * @param threshold The threshold time for cache cleanup
     * @return Number of deleted records
     */
    @Modifying
    @Query("DELETE FROM UserCache uc WHERE uc.lastSynced < :threshold")
    int deleteStaleCacheEntries(@Param("threshold") LocalDateTime threshold);

    /**
     * Check if user exists in cache
     * 
     * @param id User ID
     * @return True if user exists in cache
     */
    boolean existsById(UUID id);

    /**
     * Count total cache entries
     * 
     * @return Total number of cache entries
     */
    long count();
}
