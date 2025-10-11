import { useState, useEffect, useCallback } from 'react';
import { postsApi } from '../api/posts';
import { Post, CreatePostRequest } from '@/types';

export function usePosts(page = 1, size = 20) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await postsApi.getPosts(page, size);
      // Ensure we always set an array
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
      // Set empty array on error to prevent .map() issues
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (data: CreatePostRequest) => {
    const newPost = await postsApi.createPost(data);
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const likePost = async (postId: string) => {
    await postsApi.likePost(postId);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
          : post
      )
    );
  };

  const unlikePost = async (postId: string) => {
    await postsApi.unlikePost(postId);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, is_liked: false, likes_count: post.likes_count - 1 }
          : post
      )
    );
  };

  const deletePost = async (postId: string) => {
    await postsApi.deletePost(postId);
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return {
    posts,
    isLoading,
    error,
    refetch: fetchPosts,
    createPost,
    likePost,
    unlikePost,
    deletePost,
  };
}

export function useUserPosts(userId: string, page = 1, size = 20) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await postsApi.getPostsByAuthor(userId, page, size);
        // Ensure we always set an array
        setPosts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch posts');
        // Set empty array on error to prevent .map() issues
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchPosts();
    }
  }, [userId, page, size]);

  return { posts, isLoading, error };
}

