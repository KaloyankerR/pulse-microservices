import { FC, useEffect, useRef } from 'react';

import { formatDistanceToNow } from 'date-fns';

import useCurrentUser from '@/hooks/useCurrentUser';
import useMessages from '@/hooks/useMessages';

import Avatar from '@/components/Avatar';
import { IChat, IMessage } from '@/types/chat.type';

interface MessageListProps {
  chat: IChat;
}

const MessageList: FC<MessageListProps> = ({ chat }) => {
  const { data: currentUser } = useCurrentUser();
  const { data: messagesData, isLoading } = useMessages(chat.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = messagesData?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getOtherUser = () => {
    return chat.users.find(user => user.id !== currentUser?.id);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-gray-400'>Loading messages...</div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    const otherUser = getOtherUser();
    return (
      <div className='flex flex-col items-center justify-center h-full text-center p-8'>
        <Avatar
          username={otherUser?.username || ''}
          size='large'
          clickable={false}
        />
        <h3 className='text-white font-semibold mt-4'>{otherUser?.name}</h3>
        <p className='text-gray-400 text-sm'>@{otherUser?.username}</p>
        <p className='text-gray-500 text-sm mt-4'>
          This is the beginning of your conversation with {otherUser?.name}
        </p>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-y-auto p-4 space-y-4'>
      {messages.map((message: IMessage) => {
        const isOwnMessage = message.userId === currentUser?.id;
        const showAvatar = !isOwnMessage;

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {showAvatar && (
                <div className='flex-shrink-0 mr-2'>
                  <Avatar
                    username={message.user.username}
                    size='small'
                    clickable={false}
                  />
                </div>
              )}
              <div
                className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-800 text-white'
                  }`}
                >
                  <p className='text-sm'>{message.body}</p>
                </div>
                <span className='text-gray-400 text-xs mt-1'>
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
