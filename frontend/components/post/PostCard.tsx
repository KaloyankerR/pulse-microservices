'use client';

import { useState } from 'react';
import { Post, Comment } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { commentsApi } from '@/lib/api/comments';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onLike, onUnlike, onDelete }: PostCardProps) {
  const { user } = useAuthStore();
  const isOwnPost = user?.id === post.author_id;
  const isModerator = user?.role === 'MODERATOR';
  const canDelete = isOwnPost || isModerator;
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLikeToggle = () => {
    if (post.is_liked) {
      onUnlike?.(post.id);
    } else {
      onLike?.(post.id);
    }
  };

  const fetchComments = async () => {
    if (isLoadingComments) return;
    
    try {
      setIsLoadingComments(true);
      const fetchedComments = await commentsApi.getCommentsByPostId(post.id);
      setComments(fetchedComments);
    } catch (error) {
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const newComment = await commentsApi.createComment(post.id, {
        content: commentContent.trim(),
      });
      setComments([...comments, newComment]);
      setCommentContent('');
    } catch (error) {
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.deleteComment(post.id, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) {
    }
  };

  return (
    <Card 
      variant="default"
    >
      <CardContent className="p-0">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <Link
              href={`/profile/${post.author_id}`}
              className="flex items-center space-x-3 flex-1"
            >
              <Avatar
                src={post.author?.avatarUrl}
                name={post.author?.displayName || post.author?.username}
                username={post.author?.username}
                size="md"
              />
              <div>
                <p className="font-black text-[#1A1A1A] hover:underline">
                  {post.author?.displayName || post.author?.username}
                </p>
                <p className="text-sm font-bold text-[#1A1A1A] opacity-70">
                  @{post.author?.username} · {formatRelativeTime(post.createdAt)}
                </p>
              </div>
            </Link>

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(post.id)}
                className="text-[#FF9B85] hover:text-[#1A1A1A] hover:bg-[#FF9B85]"
                title={isModerator && !isOwnPost ? 'Delete as moderator' : 'Delete post'}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Content */}
          <p className="text-[#1A1A1A] mb-4 whitespace-pre-wrap font-medium">{post.content}</p>

          {/* Actions */}
          <div className="flex items-center space-x-6 pt-4 border-t-[3px] border-[#1A1A1A]">
            <button
              onClick={handleLikeToggle}
              className="flex items-center space-x-2 font-bold text-[#1A1A1A] hover:text-[#FF9B85]"
              style={{ transition: 'none' }}
            >
              <Heart
                className={`w-5 h-5 ${
                  post.is_liked ? 'fill-[#FF9B85] text-[#FF9B85]' : ''
                }`}
              />
              <span className="text-sm">{post.likes_count}</span>
            </button>

            <button
              onClick={handleToggleComments}
              className="flex items-center space-x-2 font-bold text-[#1A1A1A] hover:text-[#87CEEB]"
              style={{ transition: 'none' }}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">
                {post.comments_count || 0} {post.comments_count === 1 ? 'Comment' : 'Comments'}
              </span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-0 pt-0 border-t-[3px] border-[#1A1A1A] bg-[#F5EFE7] p-6">
            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center py-4">
                <span className="text-sm font-bold text-[#1A1A1A] opacity-70">Loading comments...</span>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Link href={`/profile/${comment.author_id}`}>
                      <Avatar
                        src={comment.author?.avatarUrl}
                        name={comment.author?.displayName || comment.author?.username}
                        username={comment.author?.username}
                        size="sm"
                      />
                    </Link>
                    <div className="flex-1 bg-white border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          href={`/profile/${comment.author_id}`}
                          className="font-black text-sm text-[#1A1A1A] hover:underline"
                        >
                          {comment.author?.displayName || comment.author?.username}
                        </Link>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#1A1A1A] opacity-70">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                          {(user?.id === comment.author_id || isModerator) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-[#FF9B85] hover:text-[#1A1A1A] hover:bg-[#FF9B85] p-1"
                              title={isModerator && user?.id !== comment.author_id ? 'Delete as moderator' : 'Delete comment'}
                              style={{ transition: 'none' }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-[#1A1A1A] font-medium">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="text-sm font-bold text-[#1A1A1A] opacity-70">No comments yet</span>
              </div>
            )}

            {/* Comment Form */}
            {user && (
              <form onSubmit={handleSubmitComment} className="flex space-x-3">
                <Avatar
                  src={user.avatarUrl}
                  name={user.displayName || user.username}
                  username={user.username}
                  size="sm"
                />
                <div className="flex-1 flex space-x-2">
                  <Textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    rows={1}
                    className="flex-1 resize-none"
                    maxLength={500}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentContent.trim() || isSubmittingComment}
                    isLoading={isSubmittingComment}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

