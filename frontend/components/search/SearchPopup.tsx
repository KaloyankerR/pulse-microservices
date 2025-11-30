'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { usersApi } from '@/lib/api/users';
import { UserWithSocial } from '@/types';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserWithSocial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when popup opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close with Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  // Reset search when popup closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!query.trim() || query.length < 2) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await usersApi.searchUsers(query, 1, 20);
        setResults(response.data?.users || []);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by debounced effect
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed lg:absolute left-16 sm:left-20 lg:left-full top-16 lg:top-16 lg:ml-4 lg:mt-2 w-[calc(100vw-4rem-4rem)] sm:w-[calc(100vw-2rem-5rem)] lg:w-96 lg:max-w-md max-h-[calc(100vh-8rem)] lg:max-h-[600px] bg-white border-[3px] border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] z-50 flex flex-col"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-[3px] border-[#1A1A1A] bg-[#F4C542]">
          <h2 className="text-lg font-black text-[#1A1A1A]">Search Users</h2>
          <button
            onClick={onClose}
            className="p-2 border-[3px] border-[#1A1A1A] bg-white hover:bg-[#F5EFE7] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A]"
            aria-label="Close search"
            style={{ transition: 'none' }}
          >
            <X className="w-5 h-5 text-[#1A1A1A]" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-4 border-b-[3px] border-[#1A1A1A] bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !query.trim()}>
              <Search className="w-5 h-5" />
            </Button>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : hasSearched ? (
            results.length === 0 ? (
              <div className="py-12 text-center px-4">
                <Search className="w-16 h-16 text-[#1A1A1A] opacity-30 mx-auto mb-4" />
                <p className="text-[#1A1A1A] text-lg font-black">No users found</p>
                <p className="text-[#1A1A1A] text-sm mt-2 font-bold opacity-70">
                  Try searching with a different query
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {results.map((user) => (
                  <Card key={user.id} variant="default">
                    <CardContent className="p-0">
                      <Link
                        href={`/profile/${user.id}`}
                        onClick={onClose}
                        className="block p-3 hover:bg-[#F5EFE7]"
                        style={{ transition: 'none' }}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={user.avatarUrl}
                            name={user.displayName || user.username}
                            username={user.username}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-[#1A1A1A] truncate">
                                {user.displayName || user.username}
                              </p>
                              {user.role === 'MODERATOR' && (
                                <span className="px-2 py-1 text-xs font-black bg-[#87CEEB] text-[#1A1A1A] border-[2px] border-[#1A1A1A] inline-block shadow-[2px_2px_0px_#1A1A1A] flex-shrink-0">
                                  MOD
                                </span>
                              )}
                              {user.banned && (
                                <span className="px-2 py-1 text-xs font-black bg-[#FF9B85] text-[#1A1A1A] border-[2px] border-[#1A1A1A] inline-block shadow-[2px_2px_0px_#1A1A1A] flex-shrink-0">
                                  BANNED
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-[#1A1A1A] opacity-70 truncate">
                              @{user.username}
                            </p>
                            {user.bio && (
                              <p className="text-sm font-bold text-[#1A1A1A] opacity-80 mt-1 line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="py-12 text-center px-4">
              <Search className="w-16 h-16 text-[#1A1A1A] opacity-30 mx-auto mb-4" />
              <p className="text-[#1A1A1A] text-lg font-black">Start searching for users</p>
              <p className="text-[#1A1A1A] text-sm mt-2 font-bold opacity-70">
                Enter a name or username to find people
              </p>
              <p className="text-[#1A1A1A] text-xs mt-4 font-bold opacity-50">
                Press Cmd+K (Mac) or Ctrl+K (Windows) to open search quickly
              </p>
            </div>
          )}
        </div>
    </div>
  );
}

