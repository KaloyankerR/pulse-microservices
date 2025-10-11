import { FC, useCallback, useState } from 'react';

import axios from 'axios';
import { toast } from 'react-hot-toast';

import useMessages from '@/hooks/useMessages';
import useChats from '@/hooks/useChats';

import Button from '@/components/shared/Button';
import { IChat } from '@/types/chat.type';

interface MessageInputProps {
  chat: IChat;
}

const MessageInput: FC<MessageInputProps> = ({ chat }) => {
  const [body, setBody] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { mutate: mutateMessages } = useMessages(chat.id);
  const { mutate: mutateChats } = useChats();

  const handleSubmit = useCallback(async () => {
    if (!body.trim()) return;

    try {
      setLoading(true);

      await axios.post(`/api/chats/${chat.id}/messages`, {
        body: body.trim(),
      });

      setBody('');
      mutateMessages();
      mutateChats();
    } catch (error: any) {
      console.log(error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [body, chat.id, mutateMessages, mutateChats]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className='p-4 border-t border-neutral-800'>
      <div className='flex items-end space-x-2'>
        <div className='flex-1'>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='Type a message...'
            className='w-full resize-none outline-none bg-neutral-800 text-white placeholder-gray-400 rounded-2xl px-4 py-2 text-sm border border-neutral-700 focus:border-blue-500 transition'
            rows={1}
            maxLength={1000}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        <Button
          disabled={loading || !body.trim() || body.length > 1000}
          label='Send'
          size='custom'
          labelSize='sm'
          onClick={handleSubmit}
        />
      </div>
      {body.length > 800 && (
        <div className='text-right mt-1'>
          <span className='text-gray-400 text-xs'>{body.length}/1000</span>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
