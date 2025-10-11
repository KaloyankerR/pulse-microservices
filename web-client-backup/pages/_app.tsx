import '@/styles/globals.css';

import React, { useEffect, useState } from 'react';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';

// import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';

import Layout from '@/components/Layout';
import Splash from '@/components/Splash';

import LoginModal from '@/components/modals/LoginModal';
import RegisterModal from '@/components/modals/RegisterModal';
import Bottom from '@/components/bottom/Bottom';
import EditModal from '@/components/modals/EditModal';
import TweetModal from '@/components/modals/TweetModal';
import ChatModal from '@/components/modals/ChatModal';

import useCurrentUser from '@/hooks/useCurrentUser';

export default function App({ Component, pageProps }: AppProps) {
  // const [animationParent] = useAutoAnimate();
  const { data: isLoggedIn } = useCurrentUser();
  const [pageTitle, setPageTitle] = useState<String>('');
  const router = useRouter();

  const user = pageProps.user;
  const name = user?.name;

  // Check if current page is API docs
  const isApiDocsPage = router.pathname === '/api-docs';

  useEffect(() => {
    const getLocationPath = () => {
      return window.location.pathname.substring(1);
    };

    const locationPath = getLocationPath().split('/')[0];
    const usersPath = getLocationPath().split('/')[1];

    let title =
      locationPath.charAt(0).toUpperCase() + locationPath.slice(1) || 'Home';

    if (locationPath === 'users') {
      // TODO: pulled from backend
      title = usersPath;
    }

    setPageTitle(title);
  }, []);
  return (
    <>
      <SessionProvider session={pageProps.session}>
        <SWRConfig
          value={{
            fetcher: (url: string) => fetch(url).then(res => res.json()),
            onError: () => {
              // Suppress SWR errors in console to reduce noise
              // Errors are handled by individual hooks/components
            },
          }}
        >
          <Head>
            <link
              rel='shortcut icon'
              href='https://abs.twimg.com/favicons/twitter.3.ico'
              type='image/x-icon'
            />
            <title>{pageTitle ? `${pageTitle} / Twitter ` : 'Twitter'}</title>
            <meta
              name='description'
              content='This is a Twitter Clone project built with Next.js, Prisma, MongoDb, Tailwind, Typescript and NextAuth libraries. It is a full-stack project that uses Next.js for the frontend and Prisma for the backend. It is a Twitter clone that allows users to create an account, login, logout, follow other users, like and retweet tweets and more.'
            />
          </Head>
          <main>
            <div id='portal' />
            <Toaster toastOptions={{ duration: 2000, position: 'top-right' }} />
            {!isApiDocsPage && <Splash />}
            {!isApiDocsPage && <EditModal />}
            <LoginModal />
            <RegisterModal />
            {!isApiDocsPage && <TweetModal />}
            {!isApiDocsPage && <ChatModal />}
            {isApiDocsPage ? (
              <Component {...pageProps} />
            ) : (
              <Layout>
                <Component {...pageProps} />
              </Layout>
            )}
            {!isLoggedIn && !isApiDocsPage && <Bottom />}
          </main>
        </SWRConfig>
      </SessionProvider>
    </>
  );
}
