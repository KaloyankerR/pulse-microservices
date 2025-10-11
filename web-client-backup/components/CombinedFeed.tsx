import React, { FC, useMemo } from 'react';
import { RiLoader5Line } from 'react-icons/ri';
// import { useAutoAnimate } from '@formkit/auto-animate/react';

import ColorUtils from '@/base/colors';

import useCurrentUser from '@/hooks/useCurrentUser';
import usePosts from '@/hooks/usePosts';
import useEvents from '@/hooks/useEvents';

import PostFeed from '@/components/posts/PostFeed';
import EventCard from '@/components/events/EventCard';

interface ICombinedFeedProps {
  userId?: string;
  username?: string;
}

interface FeedItem {
  id: string;
  type: 'post' | 'event';
  createdAt: string;
  data: any;
}

const CombinedFeed: FC<ICombinedFeedProps> = ({ userId, username }) => {
  const { data: posts = [], isLoading: postsLoading } = usePosts(
    userId as string
  );
  const { data: eventsData, isLoading: eventsLoading } = useEvents(userId);
  const { data: currentUser, isLoading: userLoading, isAuthenticated } = useCurrentUser();

  // const [parent] = useAutoAnimate({ duration: 500 });

  const combinedFeed = useMemo(() => {
    const feedItems: FeedItem[] = [];

    // Add posts
    if (Array.isArray(posts)) {
      posts.forEach((post: any) => {
        feedItems.push({
          id: post.id,
          type: 'post',
          createdAt: post.createdAt,
          data: post,
        });
      });
    }

    // Add events
    if (eventsData?.events && Array.isArray(eventsData.events)) {
      eventsData.events.forEach((event: any) => {
        feedItems.push({
          id: event.id,
          type: 'event',
          createdAt: event.createdAt,
          data: event,
        });
      });
    }

    // Sort by creation date (newest first)
    return feedItems.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts, eventsData]);

  const isLoading = postsLoading || eventsLoading || userLoading;

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center w-full h-full mt-8'>
        <RiLoader5Line
          className='
            animate-spin
            text-4xl
            rounded-full
            '
          style={{ color: ColorUtils.colors.main }}
        />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <div className='flex flex-col items-center justify-center w-full h-full mt-8'>
          <p className='text-lg text-neutral-500'>
            Please login to see the feed
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        {combinedFeed.length > 0 ? (
          combinedFeed.map((item: FeedItem) => (
            <div key={`${item.type}-${item.id}`}>
              {item.type === 'post' ? (
                <PostFeed username={username!} data={item.data} />
              ) : (
                <EventCard data={item.data} />
              )}
            </div>
          ))
        ) : (
          <div className='flex flex-col items-center justify-center w-full h-full mt-8'>
            <p className='text-lg text-neutral-500'>
              {username
                ? 'No posts or events yet'
                : 'Your followings have no posts or events yet'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CombinedFeed;
