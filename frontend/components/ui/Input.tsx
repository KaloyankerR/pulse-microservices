import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', showPasswordToggle = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={inputType}
            className={cn(
              'w-full px-4 py-3 border-[3px] border-[#1A1A1A] bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A] placeholder:opacity-60 focus:outline-none focus:shadow-[4px_4px_0px_#1A1A1A] font-medium',
              isPassword && (showPasswordToggle || showPassword) ? 'pr-12' : '',
              error
                ? 'border-[#FF9B85] focus:border-[#FF9B85] focus:shadow-[4px_4px_0px_#FF9B85]'
                : '',
              className
            )}
            ref={ref}
            style={{ transition: 'none' }}
            {...props}
          />
          {isPassword && (showPasswordToggle || showPassword) && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#1A1A1A] hover:text-[#1A1A1A] focus:outline-none border-l-[3px] border-[#1A1A1A] pl-3 bg-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm font-bold text-[#FF9B85]">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm font-medium text-[#1A1A1A] opacity-70">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

