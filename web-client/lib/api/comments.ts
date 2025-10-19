import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { Comment, CreateCommentRequest } from '@/types';

export const commentsApi = {
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    
    const response = await apiClient.get<{ comments: Comment[] } | Comment[]>(
      API_ENDPOINTS.posts.comments(postId)
    );
    
    // Handle different response structures and transform snake_case to camelCase
    let comments: any[] = [];
    
    if (Array.isArray(response)) {
      comments = response;
    } else if (response && response.comments) {
      comments = response.comments;
    }
    
        // Transform snake_case to camelCase for frontend compatibility
        return comments.map((comment: any) => ({
          ...comment,
          createdAt: comment.created_at,
          postId: comment.post_id,
          authorId: comment.author_id
        }));
  },

  async createComment(postId: string, data: CreateCommentRequest): Promise<Comment> {
    
    const response = await apiClient.post<any>(
      API_ENDPOINTS.posts.comments(postId),
      data
    );
    
    // Transform snake_case to camelCase for frontend compatibility
    const transformed = {
      ...response,
      createdAt: response.created_at,
      postId: response.post_id,
      authorId: response.author_id
    };

    return transformed;
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.posts.deleteComment(postId, commentId));
  },
};

