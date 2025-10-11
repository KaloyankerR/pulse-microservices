import { useState, useEffect, useCallback } from 'react';
import { socialApi } from '../api/social';
import { UserWithSocial, FollowStats, FollowStatus } from '@/types';

export function useSocialStats(userId: string) {
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
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
    };

    if (userId) {
      fetchStats();
    }
  }, [userId]);

  return { stats, isLoading, error };
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
    await socialApi.followUser(userId);
    setStatus((prev) => (prev ? { ...prev, is_following: true } : null));
  };

  const unfollow = async () => {
    await socialApi.unfollowUser(userId);
    setStatus((prev) => (prev ? { ...prev, is_following: false } : null));
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

export function useRecommendations(limit = 10) {
  const [recommendations, setRecommendations] = useState<UserWithSocial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await socialApi.getRecommendations(limit);
        // Ensure we always set an array
        setRecommendations(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch recommendations');
        // Set empty array on error to prevent .map() issues
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [limit]);

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
        setFollowers(response.data.items);
        setHasMore(response.data.pagination.page < response.data.pagination.total_pages);
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
        setFollowing(response.data.items);
        setHasMore(response.data.pagination.page < response.data.pagination.total_pages);
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

