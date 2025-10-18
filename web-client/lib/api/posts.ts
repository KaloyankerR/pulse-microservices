import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { Post, CreatePostRequest } from '@/types';

// Post Service response structure (different from other services)
interface PostsResponse {
  posts: Post[];
  page: number;
  size: number;
  totalPosts: number;
  totalPages: number;
}

export const postsApi = {
  async getPosts(page = 0, size = 20): Promise<Post[]> {
    
    // Post service uses 0-indexed pages
    const response = await apiClient.get<PostsResponse>(API_ENDPOINTS.posts.list, {
      params: { page, size },
    });
    
    
    // Post service returns flat structure with "posts" array (not wrapped in data)
    if (!response.posts) {
      return [];
    }
    
    // Transform snake_case to camelCase for frontend compatibility
    const transformedPosts = response.posts.map(post => ({
      ...post,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      authorId: post.author_id,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      isLiked: post.is_liked
    }));
    
    return transformedPosts;
  },

  async getPostById(id: string): Promise<Post> {
    
    // Single post is returned directly (not in a wrapper)
    const response = await apiClient.get<Post>(API_ENDPOINTS.posts.byId(id));
    
    
    // Transform snake_case to camelCase for frontend compatibility
    return {
      ...response,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      authorId: response.author_id,
      likesCount: response.likes_count,
      commentsCount: response.comments_count,
      isLiked: response.is_liked
    };
  },

  async getPostsByAuthor(authorId: string, page = 0, size = 20): Promise<Post[]> {
    
    // Post service uses 0-indexed pages
    const response = await apiClient.get<PostsResponse>(
      API_ENDPOINTS.posts.byAuthor(authorId),
      {
        params: { page, size },
      }
    );
    
    
    // Post service returns flat structure with "posts" array
    if (!response.posts) {
      return [];
    }
    
    // Transform snake_case to camelCase for frontend compatibility
    const transformedPosts = response.posts.map(post => ({
      ...post,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      authorId: post.author_id,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      isLiked: post.is_liked
    }));
    
    return transformedPosts;
  },

  async createPost(data: CreatePostRequest): Promise<Post> {
    
    // Created post is returned directly (not wrapped)
    const response = await apiClient.post<Post>(
      API_ENDPOINTS.posts.create,
      data
    );
    
    
    // Transform snake_case to camelCase for frontend compatibility
    return {
      ...response,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      authorId: response.author_id,
      likesCount: response.likes_count,
      commentsCount: response.comments_count,
      isLiked: response.is_liked
    };
  },

  async deletePost(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.posts.byId(id));
  },

  async likePost(id: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.posts.like(id));
  },

  async unlikePost(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.posts.like(id));
  },
};

