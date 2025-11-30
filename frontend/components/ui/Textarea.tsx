import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'w-full px-4 py-3 border-[3px] border-[#1A1A1A] bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A] placeholder:opacity-60 focus:outline-none focus:shadow-[4px_4px_0px_#1A1A1A] resize-none font-medium',
            error
              ? 'border-[#FF9B85] focus:border-[#FF9B85] focus:shadow-[4px_4px_0px_#FF9B85]'
              : '',
            className
          )}
          ref={ref}
          style={{ transition: 'none' }}
          {...props}
        />
        {error && <p className="mt-2 text-sm font-bold text-[#FF9B85]">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm font-medium text-[#1A1A1A] opacity-70">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

