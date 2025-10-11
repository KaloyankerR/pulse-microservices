import { FC } from 'react';

import ChatWindow from '@/components/chat/ChatWindow';

const ChatPage: FC = () => {
  return (
    <div className='h-screen bg-black'>
      <ChatWindow />
    </div>
  );
};

export default ChatPage;
