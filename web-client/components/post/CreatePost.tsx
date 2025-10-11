'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/lib/stores/auth-store';

interface CreatePostProps {
  onPostCreate?: (content: string) => Promise<void>;
}

export function CreatePost({ onPostCreate }: CreatePostProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || content.length > 280) return;

    try {
      setIsSubmitting(true);
      await onPostCreate?.(content);
      setContent('');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 280 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-3">
            <Avatar
              src={user?.avatar_url}
              name={user?.display_name || user?.username}
              size="md"
            />
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="mb-2"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    isOverLimit ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  {remainingChars} characters remaining
                </span>
                <Button
                  type="submit"
                  disabled={!content.trim() || isOverLimit || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

