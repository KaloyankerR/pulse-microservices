import { FC, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { RiArrowLeftLine } from 'react-icons/ri';

import useCurrentUser from '@/hooks/useCurrentUser';
import useChats from '@/hooks/useChats';
import useChatModal from '@/hooks/useChatModal';

import ChatList from './ChatList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatModal from '../modals/ChatModal';

import { IChat } from '@/types/chat.type';

const ChatWindow: FC = () => {
  const { data: currentUser } = useCurrentUser();
  const { data: chats } = useChats();
  const chatModal = useChatModal();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<IChat | null>(null);

  const handleChatSelect = useCallback((chat: IChat) => {
    setSelectedChat(chat);
  }, []);

  const handleNewChat = useCallback(() => {
    chatModal.onOpen();
  }, [chatModal]);

  if (!currentUser) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-gray-400'>Please log in to use chat</div>
      </div>
    );
  }

  return (
    <div className='h-full bg-black'>
      {selectedChat ? (
        // Chat conversation view
        <div className='flex flex-col h-full'>
          {/* Chat Header with back button */}
          <div className='flex items-center space-x-4 p-4 border-b border-neutral-800'>
            <button
              onClick={() => setSelectedChat(null)}
              className='p-2 rounded-full hover:bg-neutral-800 transition'
              title='Back to messages'
            >
              <RiArrowLeftLine size={20} color='#fff' />
            </button>
            <div className='flex items-center space-x-3'>
              <div>
                <h3 className='text-white font-semibold'>
                  {
                    selectedChat.users.find(user => user.id !== currentUser.id)
                      ?.name
                  }
                </h3>
                <p className='text-gray-400 text-sm'>
                  @
                  {
                    selectedChat.users.find(user => user.id !== currentUser.id)
                      ?.username
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <MessageList chat={selectedChat} />

          {/* Message Input */}
          <MessageInput chat={selectedChat} />
        </div>
      ) : (
        // Messages list view
        <div className='flex flex-col h-full'>
          {/* Header with back button */}
          <div className='flex items-center space-x-4 p-4 border-b border-neutral-800'>
            <button
              onClick={() => router.push('/')}
              className='p-2 rounded-full hover:bg-neutral-800 transition'
              title='Back to home'
            >
              <RiArrowLeftLine size={20} color='#fff' />
            </button>
            <h1 className='text-xl font-bold text-white'>Messages</h1>
          </div>

          {/* Chat List takes full width */}
          <div className='flex-1 overflow-hidden'>
            <ChatList
              onChatSelect={handleChatSelect}
              selectedChatId={
                selectedChat ? (selectedChat as IChat).id : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Chat Modal for new conversations */}
      <ChatModal />
    </div>
  );
};

export default ChatWindow;
