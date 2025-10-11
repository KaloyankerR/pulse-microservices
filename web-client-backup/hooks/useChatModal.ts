import { create } from 'zustand';

interface ChatModalState {
  isOpen: boolean;
  recipientId?: string;
  recipientName?: string;
  recipientUsername?: string;
  recipientImage?: string;
  onOpen: (recipient?: {
    id: string;
    name: string;
    username: string;
    image?: string;
  }) => void;
  onClose: () => void;
}

const useChatModal = create<ChatModalState>(set => ({
  isOpen: false,
  recipientId: undefined,
  recipientName: undefined,
  recipientUsername: undefined,
  recipientImage: undefined,
  onOpen: recipient =>
    set({
      isOpen: true,
      recipientId: recipient?.id,
      recipientName: recipient?.name,
      recipientUsername: recipient?.username,
      recipientImage: recipient?.image,
    }),
  onClose: () =>
    set({
      isOpen: false,
      recipientId: undefined,
      recipientName: undefined,
      recipientUsername: undefined,
      recipientImage: undefined,
    }),
}));

export default useChatModal;
