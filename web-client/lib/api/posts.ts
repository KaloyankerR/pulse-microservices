import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { Post, CreatePostRequest, ApiResponse } from '@/types';

export const postsApi = {
  async getPosts(page = 1, size = 20): Promise<Post[]> {
    const response = await apiClient.get<Post[]>(API_ENDPOINTS.posts.list, {
      params: { page, size },
    });
    return response;
  },

  async getPostById(id: string): Promise<Post> {
    const response = await apiClient.get<Post>(API_ENDPOINTS.posts.byId(id));
    return response;
  },

  async getPostsByAuthor(authorId: string, page = 1, size = 20): Promise<Post[]> {
    const response = await apiClient.get<Post[]>(
      API_ENDPOINTS.posts.byAuthor(authorId),
      {
        params: { page, size },
      }
    );
    return response;
  },

  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await apiClient.post<Post>(
      API_ENDPOINTS.posts.create,
      data
    );
    return response;
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

