import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { Comment, CreateCommentRequest } from '@/types';

export const commentsApi = {
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    console.log('[Comments API] Fetching comments for post:', postId);
    
    const response = await apiClient.get<Comment[]>(
      API_ENDPOINTS.posts.comments(postId)
    );
    
    console.log('[Comments API] getCommentsByPostId response:', {
      postId,
      commentsCount: response?.length || 0,
    });
    
    return response || [];
  },

  async createComment(postId: string, data: CreateCommentRequest): Promise<Comment> {
    console.log('[Comments API] Creating comment:', {
      postId,
      contentLength: data.content.length,
    });
    
    const response = await apiClient.post<Comment>(
      API_ENDPOINTS.posts.comments(postId),
      data
    );
    
    console.log('[Comments API] createComment response:', {
      hasId: 'id' in response,
      responseKeys: Object.keys(response),
    });
    
    return response;
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    console.log('[Comments API] Deleting comment:', { postId, commentId });
    await apiClient.delete(API_ENDPOINTS.posts.deleteComment(postId, commentId));
    console.log('[Comments API] Comment deleted successfully:', commentId);
  },
};

