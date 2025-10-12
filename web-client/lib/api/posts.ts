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
    console.log('[Posts API] Fetching posts:', { page, size });
    
    // Post service uses 0-indexed pages
    const response = await apiClient.get<PostsResponse>(API_ENDPOINTS.posts.list, {
      params: { page, size },
    });
    
    console.log('[Posts API] getPosts response:', { 
      page, 
      hasPosts: 'posts' in response,
      postsCount: response.posts?.length,
      responseKeys: Object.keys(response)
    });
    
    // Post service returns flat structure with "posts" array (not wrapped in data)
    if (!response.posts) {
      console.error('[Posts API] Response missing posts array:', response);
      return [];
    }
    
    return response.posts || [];
  },

  async getPostById(id: string): Promise<Post> {
    console.log('[Posts API] Fetching post by ID:', id);
    
    // Single post is returned directly (not in a wrapper)
    const response = await apiClient.get<Post>(API_ENDPOINTS.posts.byId(id));
    
    console.log('[Posts API] getPostById response:', {
      postId: id,
      hasId: 'id' in response,
      responseKeys: Object.keys(response)
    });
    
    return response;
  },

  async getPostsByAuthor(authorId: string, page = 0, size = 20): Promise<Post[]> {
    console.log('[Posts API] Fetching posts by author:', { authorId, page, size });
    
    // Post service uses 0-indexed pages
    const response = await apiClient.get<PostsResponse>(
      API_ENDPOINTS.posts.byAuthor(authorId),
      {
        params: { page, size },
      }
    );
    
    console.log('[Posts API] getPostsByAuthor response:', { 
      page, 
      authorId, 
      hasPosts: 'posts' in response,
      postsCount: response.posts?.length,
      responseKeys: Object.keys(response)
    });
    
    // Post service returns flat structure with "posts" array
    if (!response.posts) {
      console.error('[Posts API] Response missing posts array:', response);
      return [];
    }
    
    return response.posts || [];
  },

  async createPost(data: CreatePostRequest): Promise<Post> {
    console.log('[Posts API] Creating post:', { 
      contentLength: data.content.length 
    });
    
    // Created post is returned directly (not wrapped)
    const response = await apiClient.post<Post>(
      API_ENDPOINTS.posts.create,
      data
    );
    
    console.log('[Posts API] createPost response:', {
      hasId: 'id' in response,
      responseKeys: Object.keys(response)
    });
    
    return response;
  },

  async deletePost(id: string): Promise<void> {
    console.log('[Posts API] Deleting post:', id);
    await apiClient.delete(API_ENDPOINTS.posts.byId(id));
    console.log('[Posts API] Post deleted successfully:', id);
  },

  async likePost(id: string): Promise<void> {
    console.log('[Posts API] Liking post:', id);
    await apiClient.post(API_ENDPOINTS.posts.like(id));
    console.log('[Posts API] Post liked successfully:', id);
  },

  async unlikePost(id: string): Promise<void> {
    console.log('[Posts API] Unliking post:', id);
    await apiClient.delete(API_ENDPOINTS.posts.like(id));
    console.log('[Posts API] Post unliked successfully:', id);
  },
};

