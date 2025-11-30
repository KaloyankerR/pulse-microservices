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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || content.length > 280) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onPostCreate?.(content);
      setContent('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to create post';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 280 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Card variant="yellow">
      <CardContent className="p-0">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 bg-[#FF9B85] border-[3px] border-[#1A1A1A] text-[#1A1A1A] px-4 py-3 shadow-[4px_4px_0px_#1A1A1A] font-bold">
                {error}
              </div>
            )}
            <div className="flex space-x-4">
              <Avatar
                src={user?.avatarUrl}
                name={user?.displayName || user?.username}
                username={user?.username}
                size="md"
              />
              <div className="flex-1">
                <Textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setError(null); // Clear error on input change
                  }}
                  placeholder="What's on your mind?"
                  rows={3}
                  className="mb-3"
                />
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${
                      isOverLimit ? 'text-[#FF9B85]' : 'text-[#1A1A1A] opacity-70'
                    }`}
                  >
                    {remainingChars} characters remaining
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!content.trim() || isOverLimit || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

