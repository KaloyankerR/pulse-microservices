import { FC, useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { RiCloseFill } from 'react-icons/ri';

import useCurrentUser from '@/hooks/useCurrentUser';
import useChats from '@/hooks/useChats';
import useChatModal from '@/hooks/useChatModal';

import Avatar from '@/components/Avatar';
import Button from '@/components/shared/Button';

const ChatModal: FC = () => {
  const chatModal = useChatModal();
  const { data: currentUser } = useCurrentUser();
  const { mutate: mutateChats } = useChats();

  const [body, setBody] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = useCallback(async () => {
    if (!chatModal.recipientId || !body.trim()) return;

    try {
      setLoading(true);

      // First, create or get the chat
      const chatResponse = await axios.post('/api/chats', {
        userId: chatModal.recipientId,
      });

      // Then send the message
      await axios.post(`/api/chats/${chatResponse.data.id}/messages`, {
        body: body.trim(),
      });

      toast.success('Message sent!');
      setBody('');
      mutateChats();
      chatModal.onClose();
    } catch (error: any) {
      console.log(error);
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  }, [body, chatModal, mutateChats]);

  const handleClose = useCallback(() => {
    chatModal.onClose();
  }, [chatModal]);

  if (!chatModal.isOpen) return null;

  return (
    <>
      <div className='flex justify-center items-start overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none transition-all duration-300 bg-neutral-700 bg-opacity-70'>
        <div className='relative my-20 h-full w-full lg:w-[600px] lg:h-96'>
          <div className='rounded-lg border-0 bg-black flex flex-col h-full shadow-lg outline-none focus:outline-none relative w-full'>
            <div className='flex justify-between items-center p-4 rounded-t border-b border-neutral-800'>
              <h5 className='text-xl font-semibold text-white'>
                Message {chatModal.recipientName || chatModal.recipientUsername}
              </h5>
              <button
                onClick={handleClose}
                className='p-1 border-0 hover:opacity-70 transition'
              >
                <RiCloseFill size={28} color={'#fff'} />
              </button>
            </div>

            <div className='flex flex-col flex-1 p-4'>
              <div className='flex items-center space-x-4 mb-4'>
                <Avatar
                  username={chatModal.recipientUsername || ''}
                  size='medium'
                  clickable={false}
                />
                <div>
                  <p className='text-white font-semibold'>
                    {chatModal.recipientName}
                  </p>
                  <p className='text-gray-400 text-sm'>
                    @{chatModal.recipientUsername}
                  </p>
                </div>
              </div>

              <div className='flex-1 flex flex-col'>
                <textarea
                  autoFocus
                  className='w-full resize-none outline-none bg-black text-xl text-white placeholder-neutral-500 peer scrollbar-thin scrollbar-thumb-neutral-500 scrollbar-track-neutral-800 scrollbar-thumb-rounded-md scrollbar-track-rounded-sm flex-1'
                  placeholder="What's happening?"
                  value={body}
                  onChange={event => {
                    setBody(event.target.value);
                    event.target.style.height = 'auto';
                    event.target.style.height =
                      event.target.scrollHeight + 'px';
                  }}
                  maxLength={1000}
                />
                <div className='flex justify-between items-center mt-4'>
                  <span className='text-gray-400 text-sm'>
                    {body.length}/1000
                  </span>
                  <Button
                    disabled={loading || !body.trim() || body.length > 1000}
                    label='Send'
                    size='custom'
                    labelSize='base'
                    onClick={handleSubmit}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatModal;
