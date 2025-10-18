import React, { useState } from 'react';
import { cn, getInitials, cleanAvatarUrl } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Function to generate consistent colors based on name
function getAvatarColor(name: string): string {
  if (!name) return 'from-gray-500 to-gray-600';
  
  // Create a simple hash from the name for consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use hash to select from predefined color combinations
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600', 
    'from-green-500 to-green-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600',
    'from-cyan-500 to-cyan-600',
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Clean the avatar URL to remove placeholder URLs
  const cleanSrc = cleanAvatarUrl(src);

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development' && src) {
    console.log('Avatar Debug:', { src, cleanSrc, name, shouldShowFallback: !cleanSrc || imageError });
  }

  // Show fallback if no src, image failed to load, or src is invalid
  const shouldShowFallback = !cleanSrc || imageError;

  if (!shouldShowFallback) {
    return (
      <img
        src={cleanSrc}
        alt={alt || name || 'Avatar'}
        className={cn(
          'rounded-full object-cover',
          sizes[size],
          className
        )}
        onError={() => setImageError(true)}
      />
    );
  }

  const initials = name ? getInitials(name) : '?';
  const colorClass = getAvatarColor(name || '');

  return (
    <div
      className={cn(
        `rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-semibold`,
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

