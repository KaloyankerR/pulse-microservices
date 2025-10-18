import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { Comment, CreateCommentRequest } from '@/types';

export const commentsApi = {
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    
    const response = await apiClient.get<Comment[]>(
      API_ENDPOINTS.posts.comments(postId)
    );
    
    
    return response || [];
  },

  async createComment(postId: string, data: CreateCommentRequest): Promise<Comment> {
    
    const response = await apiClient.post<Comment>(
      API_ENDPOINTS.posts.comments(postId),
      data
    );
    
    
    return response;
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.posts.deleteComment(postId, commentId));
  },
};

