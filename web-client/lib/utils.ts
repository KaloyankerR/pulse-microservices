import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (!date) return 'Unknown date';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Unknown date';
  return format(dateObj, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  if (!date) return 'Unknown date';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Unknown date';
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return 'Unknown';

  let dateObj: Date;
  if (typeof date === 'string') {
    // For UTC timestamps, parse them correctly by treating UTC as local time
    if (date.includes('T') && date.includes('Z')) {
      // Remove the 'Z' and parse as local time to avoid timezone conversion
      const localString = date.replace('Z', '');
      dateObj = new Date(localString);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatRelativeTime:', date);
    return 'Unknown';
  }

  try {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.warn('Error formatting relative time:', error, 'for date:', date);
    return 'Unknown';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function cleanAvatarUrl(avatarUrl?: string): string | undefined {
  if (!avatarUrl) return undefined;
  
  // Check for common placeholder URLs and avatar services
  const placeholderPatterns = [
    'example.com',
    'placeholder',
    'default-avatar',
    'no-avatar',
    'avatar-placeholder',
    'gravatar.com/avatar',
    'ui-avatars.com',
    'via.placeholder.com',
    'dummyimage.com',
    'picsum.photos',
    'loremflickr.com',
    'placekitten.com',
    'placehold.it',
    'placehold.co'
  ];
  
  const isPlaceholder = placeholderPatterns.some(pattern => 
    avatarUrl.toLowerCase().includes(pattern.toLowerCase())
  );
  
  return isPlaceholder ? undefined : avatarUrl;
}

