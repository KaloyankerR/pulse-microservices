import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'yellow' | 'pink' | 'blue' | 'coral' | 'mint' | 'cream';
}

export function Card({ className, children, variant = 'default', ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-white',
    yellow: 'bg-[#F4C542]',
    pink: 'bg-[#FFB6D9]',
    blue: 'bg-[#87CEEB]',
    coral: 'bg-[#FF9B85]',
    mint: 'bg-[#B8D4A8]',
    cream: 'bg-[#F5EFE7]',
  };

  return (
    <div
      className={cn(
        'border-[3px] border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] p-6',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('px-6 py-4 border-b-[3px] border-[#1A1A1A] mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-black text-[#1A1A1A]', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-0 py-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('px-6 py-4 border-t-[3px] border-[#1A1A1A] mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

