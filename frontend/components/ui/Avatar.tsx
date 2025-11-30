import React, { useState } from 'react';
import { cn, getInitials, cleanAvatarUrl } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  username?: string; // Add username prop for consistent color generation
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Function to generate consistent flat colors based on name (brutalist design)
function getAvatarColor(name: string): string {
  if (!name) return '#87CEEB'; // Default blue
  
  // Create a simple hash from the name for consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use hash to select from brutalist accent palette
  const colors = [
    '#F4C542', // yellow
    '#FFB6D9', // pink
    '#87CEEB', // blue
    '#FF9B85', // coral
    '#B8D4A8', // mint
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, alt, name, username, size = 'md', className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Clean the avatar URL to remove placeholder URLs
  const cleanSrc = cleanAvatarUrl(src);

  // Show fallback if no src, image failed to load, or src is invalid
  const shouldShowFallback = !cleanSrc || imageError;

  if (!shouldShowFallback) {
    return (
      <img
        src={cleanSrc}
        alt={alt || name || 'Avatar'}
        className={cn(
          'object-cover border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]',
          sizes[size],
          className
        )}
        onError={() => setImageError(true)}
      />
    );
  }

  // Use username for consistent color generation, fallback to name
  const colorKey = username || name || '';
  const initials = name ? getInitials(name) : '?';
  const backgroundColor = getAvatarColor(colorKey);

  return (
    <div
      className={cn(
        'flex items-center justify-center text-[#1A1A1A] font-black border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]',
        sizes[size],
        className
      )}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  );
}

