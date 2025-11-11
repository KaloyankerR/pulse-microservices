'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Bell, Home, MessageCircle, Search, User, Calendar, Shield } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUnreadCount } from '@/lib/hooks/use-notifications';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { count: unreadCount } = useUnreadCount(isAuthenticated);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const navItems = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    ...(user?.role === 'MODERATOR' ? [{ href: '/moderator', icon: Shield, label: 'Moderator' }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/feed" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Pulse</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative p-2 rounded-lg transition-colors',
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : item.href === '/moderator'
                        ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                  title={item.label}
                >
                  <Icon className="w-6 h-6" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-50"
              >
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.displayName || user?.username}
                  username={user?.username}
                  size="md"
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {user?.displayName || user?.username}
                    </p>
                    {user?.role === 'MODERATOR' && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full">
                        MOD
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                </div>
                <div className="py-2">
                  <Link
                    href={`/profile/${user?.id}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Profile
                  </Link>
                  {user?.role === 'MODERATOR' && (
                    <Link
                      href="/moderator"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Shield className="w-4 h-4 inline mr-2" />
                      Moderator Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

