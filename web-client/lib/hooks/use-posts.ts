import { useState, useEffect, useCallback } from 'react';
import { postsApi } from '../api/posts';
import { usersApi } from '../api/users';
import { Post, CreatePostRequest } from '@/types';

// Helper function to enrich posts with author information
const enrichPostsWithAuthors = async (posts: Post[]): Promise<Post[]> => {
  const enrichedPosts = await Promise.all(
    posts.map(async (post) => {
      // If author info is already present, return as is
      if (post.author?.username) {
        return post;
      }

      try {
        // Fetch author information from user service
        const author = await usersApi.getUserById(post.author_id);
        return {
          ...post,
          author: {
            id: author.id,
            username: author.username,
            display_name: author.display_name || author.full_name,
            avatar_url: author.avatar_url,
          },
        };
      } catch (error) {
        console.warn(`[usePosts] Failed to fetch author info for post ${post.id}:`, error);
        // Return post with fallback author info
        return {
          ...post,
          author: {
            id: post.author_id,
            username: 'unknown_user',
            display_name: 'Unknown User',
            avatar_url: undefined,
          },
        };
      }
    })
  );
  return enrichedPosts;
};

export function usePosts(page = 0, size = 20) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    console.log('[usePosts] Starting to fetch posts:', { page, size });
    
    // Check if token exists before making API call
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('[usePosts] No token found, skipping fetch');
        setIsLoading(false);
        setError('Authentication required');
        setPosts([]);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await postsApi.getPosts(page, size);
      
      console.log('[usePosts] Posts fetched successfully:', {
        count: data.length,
        isArray: Array.isArray(data)
      });
      
      // Ensure we always set an array
      const postsArray = Array.isArray(data) ? data : [];
      
      // Enrich posts with author information
      const enrichedPosts = await enrichPostsWithAuthors(postsArray);
      setPosts(enrichedPosts);
    } catch (err: any) {
      console.error('[usePosts] Failed to fetch posts:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch posts';
      setError(errorMessage);
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
    console.log('[usePosts] Creating post:', { contentLength: data.content.length });
    try {
      const newPost = await postsApi.createPost(data);
      console.log('[usePosts] Post created successfully:', { postId: newPost.id });
      
      // Enrich the new post with author information
      const enrichedPosts = await enrichPostsWithAuthors([newPost]);
      const enrichedPost = enrichedPosts[0];
      
      setPosts((prev) => [enrichedPost, ...prev]);
      return enrichedPost;
    } catch (error) {
      console.error('[usePosts] Failed to create post:', error);
      throw error;
    }
  };

  const likePost = async (postId: string) => {
    console.log('[usePosts] Liking post:', postId);
    try {
      await postsApi.likePost(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
            : post
        )
      );
      console.log('[usePosts] Post liked successfully:', postId);
    } catch (error) {
      console.error('[usePosts] Failed to like post:', error);
      throw error;
    }
  };

  const unlikePost = async (postId: string) => {
    console.log('[usePosts] Unliking post:', postId);
    try {
      await postsApi.unlikePost(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, is_liked: false, likes_count: post.likes_count - 1 }
            : post
        )
      );
      console.log('[usePosts] Post unliked successfully:', postId);
    } catch (error) {
      console.error('[usePosts] Failed to unlike post:', error);
      throw error;
    }
  };

  const deletePost = async (postId: string) => {
    console.log('[usePosts] Deleting post:', postId);
    try {
      await postsApi.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      console.log('[usePosts] Post deleted successfully:', postId);
    } catch (error) {
      console.error('[usePosts] Failed to delete post:', error);
      throw error;
    }
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
      // Check if token exists before making API call
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoading(false);
          setError('Authentication required');
          setPosts([]);
          return;
        }
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await postsApi.getPostsByAuthor(userId, page, size);
        // Ensure we always set an array
        const postsArray = Array.isArray(data) ? data : [];
        
        // Enrich posts with author information
        const enrichedPosts = await enrichPostsWithAuthors(postsArray);
        setPosts(enrichedPosts);
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

