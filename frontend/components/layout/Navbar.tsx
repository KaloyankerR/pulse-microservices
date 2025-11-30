'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Bell, Home, MessageCircle, Search, User, Calendar, Shield, LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUnreadCount } from '@/lib/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { NotificationsPopup } from '@/components/notifications/NotificationsPopup';
import { SearchPopup } from '@/components/search/SearchPopup';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { count: unreadCount } = useUnreadCount(isAuthenticated);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }

    if (isDropdownOpen || isNotificationsOpen || isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isNotificationsOpen, isSearchOpen]);

  // Handle keyboard shortcut (Cmd/Ctrl+K) for search
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(!isSearchOpen);
        // Close other popups when opening search
        setIsNotificationsOpen(false);
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  const navItems = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    ...(user?.role === 'MODERATOR' ? [{ href: '/moderator', icon: Shield, label: 'Moderator' }] : []),
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed left-0 top-0 h-screen w-16 sm:w-20 bg-white border-r-[3px] border-[#1A1A1A] shadow-[6px_0px_0px_#1A1A1A] z-50 flex flex-col">
      {/* Logo at top */}
      <Link 
        href="/feed" 
        className="flex items-center justify-center h-16 sm:h-20 border-b-[3px] border-[#1A1A1A] hover:bg-[#F5EFE7]"
        style={{ transition: 'none' }}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F4C542] border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center justify-center">
          <span className="text-[#1A1A1A] font-black text-lg sm:text-xl">P</span>
        </div>
      </Link>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col items-center py-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-[3px] border-[#1A1A1A] font-bold',
                isActive
                  ? 'bg-[#1A1A1A] text-white shadow-[4px_4px_0px_#1A1A1A]'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#F5EFE7] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1A1A1A]'
              )}
              title={item.label}
              style={{ transition: 'none' }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
          );
        })}

        {/* Search Button with Popup */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setIsNotificationsOpen(false);
              setIsDropdownOpen(false);
            }}
            className={cn(
              'relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-[3px] border-[#1A1A1A] font-bold',
              isSearchOpen
                ? 'bg-[#1A1A1A] text-white shadow-[4px_4px_0px_#1A1A1A]'
                : 'bg-white text-[#1A1A1A] hover:bg-[#F5EFE7] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1A1A1A]'
            )}
            title="Search (Cmd+K)"
            style={{ transition: 'none' }}
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <SearchPopup
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        </div>

        {/* Notifications Button with Popup */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsSearchOpen(false);
              setIsDropdownOpen(false);
            }}
            className={cn(
              'relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-[3px] border-[#1A1A1A] font-bold',
              isNotificationsOpen
                ? 'bg-[#1A1A1A] text-white shadow-[4px_4px_0px_#1A1A1A]'
                : 'bg-white text-[#1A1A1A] hover:bg-[#F5EFE7] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1A1A1A]'
            )}
            title="Notifications"
            style={{ transition: 'none' }}
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF9B85] text-[#1A1A1A] text-xs font-black border-[2px] border-[#1A1A1A] w-5 h-5 flex items-center justify-center shadow-[2px_2px_0px_#1A1A1A]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationsPopup
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>
      </div>

      {/* Profile Button at bottom - clever solution using avatar */}
      <div className="border-t-[3px] border-[#1A1A1A] p-4 flex items-center justify-center">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-[3px] border-[#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1A1A1A]',
              isDropdownOpen
                ? 'shadow-[4px_4px_0px_#1A1A1A]'
                : ''
            )}
            title="Profile"
            style={{ transition: 'none' }}
          >
            <Avatar
              src={user?.avatarUrl}
              name={user?.displayName || user?.username}
              username={user?.username}
              size="md"
              className="w-full h-full"
            />
            {isDropdownOpen && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#F4C542] border-[2px] border-[#1A1A1A]"></div>
            )}
          </button>

          {/* Dropdown Menu - appears to the right of the sidebar, positioned above the button */}
          {isDropdownOpen && (
            <div className="absolute left-full ml-4 bottom-0 w-64 bg-white border-[3px] border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] z-50">
              <div className="p-4 border-b-[3px] border-[#1A1A1A]">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar
                    src={user?.avatarUrl}
                    name={user?.displayName || user?.username}
                    username={user?.username}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-[#1A1A1A] truncate">
                        {user?.displayName || user?.username}
                      </p>
                      {user?.role === 'MODERATOR' && (
                        <span className="px-2 py-1 text-xs font-black bg-[#87CEEB] text-[#1A1A1A] border-[2px] border-[#1A1A1A] inline-block shadow-[2px_2px_0px_#1A1A1A] flex-shrink-0">
                          MOD
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[#1A1A1A] opacity-70 truncate">@{user?.username}</p>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <Link
                  href={`/profile/${user?.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5EFE7] border-b-[2px] border-[#1A1A1A]"
                  onClick={() => setIsDropdownOpen(false)}
                  style={{ transition: 'none' }}
                >
                  <User className="w-5 h-5" />
                  <span>View Profile</span>
                </Link>
                {user?.role === 'MODERATOR' && (
                  <Link
                    href="/moderator"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5EFE7] border-b-[2px] border-[#1A1A1A]"
                    onClick={() => setIsDropdownOpen(false)}
                    style={{ transition: 'none' }}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Moderator Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-bold text-[#FF9B85] hover:bg-[#FF9B85] hover:text-[#1A1A1A]"
                  style={{ transition: 'none' }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

