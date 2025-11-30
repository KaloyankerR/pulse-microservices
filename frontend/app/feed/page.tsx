'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CreatePost } from '@/components/post/CreatePost';
import { PostCard } from '@/components/post/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { usePosts } from '@/lib/hooks/use-posts';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { posts = [], isLoading, error, createPost, likePost, unlikePost, deletePost } = usePosts();

  const handleCreatePost = async (content: string) => {
    await createPost({ content });
  };

  const handleLikePost = async (postId: string) => {
    await likePost(postId);
  };

  const handleUnlikePost = async (postId: string) => {
    await unlikePost(postId);
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
  };

  return (
    <div className="min-h-screen bg-[#F5EFE7]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-6 ml-16 sm:ml-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {!authLoading && !isAuthenticated ? (
              /* Show registration prompt for unauthenticated users */
              <div className="bg-[#F4C542] border-[3px] border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] p-8 text-center">
                <div className="mb-6">
                  <svg
                    className="mx-auto h-16 w-16 text-[#1A1A1A]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-[#1A1A1A] mb-3">
                  Welcome to Pulse
                </h2>
                <p className="text-[#1A1A1A] text-lg mb-2 font-bold">
                  Connect with friends and share your moments
                </p>
                <p className="text-[#1A1A1A] mb-8 font-medium opacity-80">
                  You need to register or login to see posts and connect with others
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/auth/register')}
                    className="flex-1 sm:flex-none px-8 py-3 bg-[#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1A1A1A] text-white font-black border-[3px] border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A]"
                    style={{ transition: 'none' }}
                  >
                    Register
                  </button>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="flex-1 sm:flex-none px-8 py-3 bg-white hover:bg-[#F5EFE7] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1A1A1A] text-[#1A1A1A] font-black border-[3px] border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A]"
                    style={{ transition: 'none' }}
                  >
                    Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                <CreatePost onPostCreate={handleCreatePost} />

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="bg-[#FF9B85] border-[3px] border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] p-6">
                      <p className="text-[#1A1A1A] text-lg font-black">
                        Failed to load posts
                      </p>
                      <p className="text-[#1A1A1A] text-sm mt-2 font-bold">
                        {error || 'Unknown error'}
                      </p>
                    </div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A1A1A] text-lg font-black">No posts yet</p>
                    <p className="text-[#1A1A1A] text-sm mt-2 font-bold opacity-70">
                      Be the first to share something!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLikePost}
                        onUnlike={handleUnlikePost}
                        onDelete={handleDeletePost}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </div>
  );
}

