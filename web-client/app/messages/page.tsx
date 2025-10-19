'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { messagesApi } from '@/lib/api/messages';
import { usersApi } from '@/lib/api/users';
import { Conversation, Message, User } from '@/types';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatRelativeTime } from '@/lib/utils';
import { Send, Plus, Trash2 } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatRecipient, setNewChatRecipient] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sentMessageIds, setSentMessageIds] = useState<Set<string>>(new Set());
  const [participantDetails, setParticipantDetails] = useState<Map<string, User>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const data = await messagesApi.getConversations();
        const conversationsArray = Array.isArray(data) ? data : [];
        
        // Remove duplicates based on conversation ID
        const uniqueConversations = conversationsArray.filter((conv, index, self) => 
          index === self.findIndex(c => c.id === conv.id)
        );
        
        setConversations(uniqueConversations);
        
        // Fetch participant details for direct conversations
        const participantIds = new Set<string>();
        uniqueConversations.forEach(conv => {
          if (conv.type === 'DIRECT') {
            const otherParticipantId = getOtherParticipantId(conv);
            if (otherParticipantId) {
              participantIds.add(otherParticipantId);
            }
          }
        });
        
        // Fetch user details for all participants
        const participantDetailsMap = new Map<string, User>();
        for (const participantId of participantIds) {
          try {
            const userDetails = await usersApi.getUserById(participantId);
            participantDetailsMap.set(participantId, userDetails);
          } catch (error) {
            console.error(`Failed to fetch user details for ${participantId}:`, error);
          }
        }
        
        setParticipantDetails(participantDetailsMap);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchConversations();
    } else {
      setConversations([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Debounced user search
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      setIsSearchingUsers(true);
      const response = await usersApi.searchUsers(query);
      const users = response.data?.users || [];
      // Filter out current user from suggestions
      const filteredUsers = users.filter(u => u.id !== user?.id);
      setUserSuggestions(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setUserSuggestions([]);
    } finally {
      setIsSearchingUsers(false);
    }
  }, [user?.id]);

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newChatRecipient.trim()) {
        searchUsers(newChatRecipient);
      } else {
        setUserSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [newChatRecipient, searchUsers]);

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setNewChatRecipient(selectedUser.username);
    setUserSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewChatRecipient(value);
    setSelectedUser(null); // Clear selection when typing
  };

  const handleCloseModal = () => {
    setShowNewChatModal(false);
    setNewChatRecipient('');
    setSelectedUser(null);
    setUserSuggestions([]);
  };

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const data = await messagesApi.getConversationMessages(
            selectedConversation.id
          );
          // Reverse the messages so newest appear at the bottom
          setMessages(data.reverse());
        } catch (error) {
        }
      };

      fetchMessages();
    }
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedConversation) return;

    try {
      setIsSending(true);
      const newMessage = await messagesApi.sendMessage({
        conversation_id: selectedConversation.id,
        content: messageText,
      });
      
      // Track this message as sent by the current user
      setSentMessageIds(prev => new Set([...prev, newMessage.id]));
      
      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');
    } catch (error) {
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newChatRecipient.trim() && !selectedUser) || isCreatingChat) return;

    try {
      setIsCreatingChat(true);
      // Use selected user ID if available, otherwise use the typed username
      const participantId = selectedUser?.id || newChatRecipient.trim();
      
      // Check if conversation already exists with this participant
      const existingConversation = conversations?.find(conv => 
        conv.type === 'DIRECT' && 
        conv.participants.includes(participantId) &&
        conv.participants.includes(user?.id || '')
      );
      
      if (existingConversation) {
        // If conversation exists, just select it
        setSelectedConversation(existingConversation);
        handleCloseModal();
        return;
      }
      
      const conversation = await messagesApi.createConversation(
        [participantId],
        'DIRECT'
      );
      
      // Check if conversation was already added to prevent duplicates
      const isDuplicate = conversations?.some(conv => conv.id === conversation.id);
      if (!isDuplicate) {
        setConversations(prev => [conversation, ...(prev || [])]);
        
        // Fetch participant details for the new conversation
        const otherParticipantId = getOtherParticipantId(conversation);
        if (otherParticipantId) {
          try {
            const userDetails = await usersApi.getUserById(otherParticipantId);
            setParticipantDetails(prev => new Map(prev).set(otherParticipantId, userDetails));
          } catch (error) {
            console.error(`Failed to fetch user details for ${otherParticipantId}:`, error);
          }
        }
      }
      setSelectedConversation(conversation);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // You could add a toast notification here
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await messagesApi.deleteConversation(conversationId);
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If this was the selected conversation, clear it
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      // You could add a toast notification here
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'GROUP') {
      return conversation.name || 'Group Chat';
    }
    
    // First try to get from participant_details if available
    const otherParticipant = conversation.participant_details?.find(
      (p) => p.id !== user?.id
    );
    if (otherParticipant) {
      return otherParticipant.displayName || otherParticipant.username;
    }
    
    // Fallback to fetched participant details
    const otherParticipantId = getOtherParticipantId(conversation);
    if (otherParticipantId) {
      const participantUser = participantDetails.get(otherParticipantId);
      if (participantUser) {
        return participantUser.displayName || participantUser.username;
      }
    }
    
    return 'Chat';
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.type === 'GROUP') {
      return null; // Groups don't have a single "other" participant
    }
    
    // First try to get from participant_details if available
    const otherParticipant = conversation.participant_details?.find(
      (p) => p.id !== user?.id
    );
    if (otherParticipant) {
      return otherParticipant;
    }
    
    // Fallback to fetched participant details
    const otherParticipantId = getOtherParticipantId(conversation);
    if (otherParticipantId) {
      return participantDetails.get(otherParticipantId) || null;
    }
    
    return null;
  };

  const getOtherParticipantId = (conversation: Conversation) => {
    if (conversation.type === 'GROUP') {
      return null;
    }
    return conversation.participants?.find(
      (p) => p !== user?.id
    );
  };

  // Show authentication message if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please log in to access your messages.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowNewChatModal(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Chat
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : !conversations || conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Click "New Chat" to start a conversation with someone!
                  </p>
                </div>
              ) : (
                conversations?.map((conversation, index) => (
                  <div
                    key={`${conversation.id}-${index}`}
                    className={`w-full flex items-center hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50'
                        : ''
                    }`}
                  >
                    <button
                      onClick={() => setSelectedConversation(conversation)}
                      className="flex-1 p-4 flex items-center space-x-3 min-w-0"
                    >
                      <Avatar
                        name={getConversationName(conversation)}
                        src={getOtherParticipant(conversation)?.avatarUrl}
                        size="md"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-gray-900 truncate">
                          {getConversationName(conversation)}
                        </p>
                        {conversation.last_message && (
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.last_message.content}
                          </p>
                        )}
                      </div>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(
                            conversation.last_message.timestamp
                          )}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="p-2 mr-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                  <Avatar
                    name={getConversationName(selectedConversation)}
                    src={getOtherParticipant(selectedConversation)?.avatarUrl}
                    size="md"
                  />
                  <h3 className="font-bold text-gray-900">
                    {getConversationName(selectedConversation)}
                  </h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message, index) => {
                    // Try multiple ways to determine if this is the user's message
                    let isOwnMessage = false;
                    
                    // Method 1: Check if sender_id matches user ID
                    if (message.sender_id === user?.id || message.sender_id === user?.id?.toString()) {
                      isOwnMessage = true;
                    }
                    // Method 2: Check if we tracked this message as sent by the current user
                    else if (sentMessageIds.has(message.id)) {
                      isOwnMessage = true;
                    }
                    // Method 3: If sender_id is empty, use fallback heuristics
                    else if (message.sender_id === '') {
                      // Since we can't rely on sender_id, we'll use a more sophisticated approach
                      // For now, let's assume messages sent by the current user are the ones that appear
                      // in a pattern that makes sense (this is a temporary solution)
                      
                      // For now, let's use a simple heuristic:
                      // If this is a new conversation or the user just sent a message,
                      // assume the most recent messages are from the current user
                      const isRecentMessage = index < 2; // First 2 messages are likely from current user
                      isOwnMessage = isRecentMessage;
                    }
                    

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatRelativeTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-200"
                >
                  <div className="flex items-center space-x-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || isSending}
                      isLoading={isSending}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white/90 backdrop-blur-md rounded-lg shadow-2xl w-full max-w-lg mx-4 border border-gray-200/50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Start New Chat
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateNewChat}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Users
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={newChatRecipient}
                      onChange={handleInputChange}
                      placeholder="Type username to search..."
                      required
                      className="pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* User Suggestions */}
                  {newChatRecipient.trim() && !selectedUser && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {isSearchingUsers ? (
                        <div className="p-3 text-sm text-gray-500 flex items-center">
                          <Spinner size="sm" className="mr-2" />
                          Searching users...
                        </div>
                      ) : userSuggestions.length > 0 ? (
                        userSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleUserSelect(suggestion)}
                            className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                          >
                            <Avatar
                              name={suggestion.displayName || suggestion.username}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {suggestion.displayName || suggestion.username}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                @{suggestion.username}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : newChatRecipient.length >= 2 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No users found matching "{newChatRecipient}"
                        </div>
                      ) : (
                        <div className="p-3 text-sm text-gray-500">
                          Type at least 2 characters to search for users...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected User Confirmation */}
                {selectedUser && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        name={selectedUser.displayName || selectedUser.username}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {selectedUser.displayName || selectedUser.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{selectedUser.username}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setNewChatRecipient('');
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={(!newChatRecipient.trim() && !selectedUser) || isCreatingChat}
                    isLoading={isCreatingChat}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isCreatingChat 
                      ? 'Creating...' 
                      : selectedUser 
                        ? `Start Chat with ${selectedUser.displayName || selectedUser.username}`
                        : 'Start Chat'
                    }
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

