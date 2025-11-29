import { useState, useEffect, useCallback } from 'react';
import { socialApi } from '../api/social';
import { UserWithSocial, FollowStats, FollowStatus } from '@/types';

export function useSocialStats(userId: string) {
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await socialApi.getSocialStats(userId);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch social stats');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId, fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

export function useFollowStatus(userId: string) {
  const [status, setStatus] = useState<FollowStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await socialApi.getFollowStatus(userId);
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch follow status');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchStatus();
    }
  }, [userId, fetchStatus]);

  const follow = async () => {
    try {
      await socialApi.followUser(userId);
      setStatus((prev) => (prev ? { ...prev, is_following: true } : null));
    } catch (error: any) {
      // Handle 409 - already following (this is expected behavior)
      if (error.response?.status === 409) {
        setStatus((prev) => (prev ? { ...prev, is_following: true } : null));
        return; // Don't throw error for already following
      }
      throw error; // Re-throw other errors
    }
  };

  const unfollow = async () => {
    try {
      await socialApi.unfollowUser(userId);
      setStatus((prev) => (prev ? { ...prev, is_following: false } : null));
    } catch (error: any) {
      // Handle 404 - not following (this is expected behavior)
      if (error.response?.status === 404) {
        setStatus((prev) => (prev ? { ...prev, is_following: false } : null));
        return; // Don't throw error for not following
      }
      throw error; // Re-throw other errors
    }
  };

  return {
    status,
    isLoading,
    error,
    follow,
    unfollow,
    refetch: fetchStatus,
  };
}

// Cache for recommendations to reduce API calls
const recommendationsCache = new Map<string, { data: UserWithSocial[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useRecommendations(limit = 10, enabled = true) {
  const [recommendations, setRecommendations] = useState<UserWithSocial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if enabled (authenticated)
    if (!enabled) {
      setIsLoading(false);
      setRecommendations([]);
      return;
    }

    const cacheKey = `recommendations-${limit}`;
    const cached = recommendationsCache.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRecommendations(cached.data);
      setIsLoading(false);
      return;
    }

    // Create AbortController for this request
    const abortController = new AbortController();
    let isMounted = true;

    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await socialApi.getRecommendations(limit, abortController.signal);
        
        // Check if component is still mounted and request wasn't aborted
        if (!isMounted || abortController.signal.aborted) {
          return;
        }
        
        // Ensure we always set an array
        const recommendations = Array.isArray(data) ? data : [];
        setRecommendations(recommendations);
        
        // Cache the results
        recommendationsCache.set(cacheKey, {
          data: recommendations,
          timestamp: Date.now()
        });
      } catch (err: any) {
        // Don't set error if request was aborted
        if (abortController.signal.aborted || !isMounted) {
          return;
        }
        
        // Check if it's an axios cancel error
        if (err.name === 'CanceledError' || err.message === 'canceled') {
          return;
        }
        
        setError(err.message || 'Failed to fetch recommendations');
        // Set empty array on error to prevent .map() issues
        setRecommendations([]);
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchRecommendations();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [limit, enabled]);

  return { recommendations, isLoading, error };
}

export function useFollowers(userId: string, page = 1, limit = 20) {
  const [followers, setFollowers] = useState<UserWithSocial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await socialApi.getFollowers(userId, page, limit);
        setFollowers(response.data.notifications);
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch followers');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchFollowers();
    }
  }, [userId, page, limit]);

  return { followers, isLoading, error, hasMore };
}

export function useFollowing(userId: string, page = 1, limit = 20) {
  const [following, setFollowing] = useState<UserWithSocial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await socialApi.getFollowing(userId, page, limit);
        setFollowing(response.data.notifications);
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch following');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchFollowing();
    }
  }, [userId, page, limit]);

  return { following, isLoading, error, hasMore };
}

