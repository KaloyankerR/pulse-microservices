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
  const { posts, isLoading, error, createPost, likePost, unlikePost, deletePost } =
    usePosts();

  const handleCreatePost = async (content: string) => {
    await createPost({ content });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {!authLoading && !isAuthenticated ? (
              /* Show registration prompt for unauthenticated users */
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                  <svg
                    className="mx-auto h-16 w-16 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Welcome to Pulse
                </h2>
                <p className="text-gray-600 text-lg mb-2">
                  Connect with friends and share your moments
                </p>
                <p className="text-gray-500 mb-8">
                  You need to register or login to see posts and connect with others
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/auth/register')}
                    className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="flex-1 sm:flex-none px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg transition-colors border-2 border-blue-600"
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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <p className="text-red-600 text-lg font-medium">
                        Failed to load posts
                      </p>
                      <p className="text-red-500 text-sm mt-2">{error}</p>
                    </div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No posts yet</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Be the first to share something!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={likePost}
                        onUnlike={unlikePost}
                        onDelete={deletePost}
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

