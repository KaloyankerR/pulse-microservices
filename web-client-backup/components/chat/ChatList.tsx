import { FC, useCallback, useState, useMemo } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { RiSearchLine } from 'react-icons/ri';

import useCurrentUser from '@/hooks/useCurrentUser';
import useChats from '@/hooks/useChats';
import useChatModal from '@/hooks/useChatModal';
import useUsers from '@/hooks/useUsers';

import Avatar from '@/components/Avatar';
import { IChat } from '@/types/chat.type';

interface ChatListProps {
  onChatSelect?: (chat: IChat) => void;
  selectedChatId?: string;
}

const ChatList: FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const { data: currentUser } = useCurrentUser();
  const { data: chats, isLoading } = useChats();
  const { data: users, isLoading: usersLoading } = useUsers();
  const chatModal = useChatModal();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getOtherUser = useCallback(
    (chat: IChat) => {
      return chat.users.find(user => user.id !== currentUser?.id);
    },
    [currentUser?.id]
  );

  const getLastMessage = useCallback((chat: IChat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return null;
    }
    return chat.messages[0];
  }, []);

  const handleChatClick = useCallback(
    (chat: IChat) => {
      if (onChatSelect) {
        onChatSelect(chat);
      }
    },
    [onChatSelect]
  );

  const handleNewChat = useCallback(() => {
    chatModal.onOpen();
  }, [chatModal]);

  // Filter users based on search query (excluding those we already have chats with)
  const filteredUsers = useMemo(() => {
    if (!users || !searchQuery.trim()) return [];

    // Get user IDs we already have chats with
    const existingChatUserIds =
      chats
        ?.map((chat: IChat) => chat.userIds.find(id => id !== currentUser?.id))
        .filter(Boolean) || [];

    return users.filter(
      (user: any) =>
        user.id !== currentUser?.id &&
        !existingChatUserIds.includes(user.id) &&
        (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, searchQuery, currentUser?.id, chats]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!chats || !searchQuery.trim()) return chats || [];

    return chats.filter((chat: IChat) => {
      const otherUser = getOtherUser(chat);
      if (!otherUser) return false;

      return (
        otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        otherUser.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [chats, searchQuery, getOtherUser]);

  const handleUserSelect = useCallback(
    (user: any) => {
      chatModal.onOpen({
        id: user.id,
        name: user.name || '',
        username: user.username || '',
        image: user.profileImage || user.image,
      });
      setSearchQuery('');
    },
    [chatModal]
  );

  if (isLoading || usersLoading) {
    return (
      <div className='flex items-center justify-center h-32'>
        <div className='text-gray-400'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Search Section */}
      <div className='p-4 border-b border-neutral-800'>
        <div className='relative mb-4'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <RiSearchLine className='h-4 w-4 text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='Search people...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          />
        </div>

        <div className='flex justify-end items-center'>
          <button
            onClick={handleNewChat}
            className='p-2 rounded-full hover:bg-neutral-800 transition'
            title='New message'
          >
            <svg
              className='w-5 h-5 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </button>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {searchQuery.trim() ? (
          // Show search results
          <div>
            {filteredUsers.length > 0 && (
              <div className='p-4 border-b border-neutral-800'>
                <h3 className='text-gray-400 text-sm font-semibold mb-3'>
                  People
                </h3>
                {filteredUsers.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className='flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-neutral-800 transition'
                  >
                    <Avatar
                      username={user.username}
                      size='medium'
                      clickable={false}
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='text-white font-semibold truncate'>
                        {user.name}
                      </p>
                      <p className='text-gray-400 text-sm truncate'>
                        @{user.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredChats.length > 0 && (
              <div className='p-4'>
                <h3 className='text-gray-400 text-sm font-semibold mb-3'>
                  Recent
                </h3>
                {filteredChats.map((chat: IChat) => {
                  const otherUser = getOtherUser(chat);
                  const lastMessage = getLastMessage(chat);
                  const isSelected = selectedChatId === chat.id;

                  if (!otherUser) return null;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleChatClick(chat)}
                      className={`p-2 rounded-lg cursor-pointer hover:bg-neutral-800 transition ${
                        isSelected ? 'bg-neutral-800' : ''
                      }`}
                    >
                      <div className='flex items-center space-x-3'>
                        <Avatar
                          username={otherUser.username}
                          size='medium'
                          clickable={false}
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='flex justify-between items-start'>
                            <div>
                              <p className='text-white font-semibold truncate'>
                                {otherUser.name}
                              </p>
                              <p className='text-gray-400 text-sm truncate'>
                                @{otherUser.username}
                              </p>
                            </div>
                            {lastMessage && (
                              <span className='text-gray-400 text-xs'>
                                {formatDistanceToNow(
                                  new Date(lastMessage.createdAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className='text-gray-300 text-sm mt-1 truncate'>
                              {lastMessage.body}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredUsers.length === 0 && filteredChats.length === 0 && (
              <div className='p-8 text-center'>
                <p className='text-gray-400'>No results found</p>
              </div>
            )}
          </div>
        ) : (
          // Show all chats
          <div>
            {chats && chats.length > 0 ? (
              chats.map((chat: IChat) => {
                const otherUser = getOtherUser(chat);
                const lastMessage = getLastMessage(chat);
                const isSelected = selectedChatId === chat.id;

                if (!otherUser) return null;

                return (
                  <div
                    key={chat.id}
                    onClick={() => handleChatClick(chat)}
                    className={`p-4 border-b border-neutral-800 cursor-pointer hover:bg-neutral-900 transition ${
                      isSelected ? 'bg-neutral-800' : ''
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <Avatar
                        username={otherUser.username}
                        size='medium'
                        clickable={false}
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <p className='text-white font-semibold truncate'>
                              {otherUser.name}
                            </p>
                            <p className='text-gray-400 text-sm truncate'>
                              @{otherUser.username}
                            </p>
                          </div>
                          {lastMessage && (
                            <span className='text-gray-400 text-xs'>
                              {formatDistanceToNow(
                                new Date(lastMessage.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                          )}
                        </div>
                        {lastMessage && (
                          <p className='text-gray-300 text-sm mt-1 truncate'>
                            {lastMessage.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='flex flex-col items-center justify-center h-32 text-center p-8'>
                <div className='text-gray-400 mb-4'>No conversations yet</div>
                <button
                  onClick={handleNewChat}
                  className='px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition'
                >
                  Start a conversation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
