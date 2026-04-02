import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-4 py-2 text-xs',
    lg: 'px-6 py-3 text-sm',
  };

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary-900 text-white hover:bg-black dark:bg-primary-800 dark:hover:bg-primary-700',
    secondary: 'bg-primary-100 text-primary-900 hover:bg-primary-200 dark:bg-surface-800 dark:text-primary-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/40',
  };

  return (
    <button 
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
