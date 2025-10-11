import Header from '@/components/shared/Header';

import PostForm from '@/components/PostForm';
import CombinedFeed from '@/components/CombinedFeed';

export default function Home() {
  return (
    <main className='text-white'>
      <Header label='Home' />
      <PostForm placeholder='Whats happening?' />
      <CombinedFeed />
    </main>
  );
}
