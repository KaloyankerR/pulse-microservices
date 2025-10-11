'use client';

import { Post } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onLike, onUnlike, onDelete }: PostCardProps) {
  const { user } = useAuthStore();
  const isOwnPost = user?.id === post.author_id;

  const handleLikeToggle = () => {
    if (post.is_liked) {
      onUnlike?.(post.id);
    } else {
      onLike?.(post.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Link
            href={`/profile/${post.author_id}`}
            className="flex items-center space-x-3 flex-1"
          >
            <Avatar
              src={post.author?.avatar_url}
              name={post.author?.display_name || post.author?.username}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-900 hover:underline">
                {post.author?.display_name || post.author?.username}
              </p>
              <p className="text-sm text-gray-500">
                @{post.author?.username} · {formatRelativeTime(post.created_at)}
              </p>
            </div>
          </Link>

          {isOwnPost && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(post.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <p className="text-gray-900 mb-4 whitespace-pre-wrap">{post.content}</p>

        {/* Actions */}
        <div className="flex items-center space-x-6 pt-2 border-t border-gray-100">
          <button
            onClick={handleLikeToggle}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                post.is_liked ? 'fill-red-600 text-red-600' : ''
              }`}
            />
            <span className="text-sm font-medium">{post.likes_count}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

