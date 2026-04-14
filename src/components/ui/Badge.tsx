import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  pulse?: boolean;
  className?: string;
}

export function Badge({ 
  label, 
  variant = 'default', 
  size = 'sm',
  pulse,
  className = '' 
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20',
    default: 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 border-primary-500/20',
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-1 text-[10px]',
    lg: 'px-3 py-1.5 text-xs',
  };

  return (
    <span className={`
      inline-flex items-center justify-center rounded font-bold uppercase border tracking-widest transition-all
      ${variants[variant]} 
      ${sizes[size]}
      ${pulse ? 'animate-pulse' : ''}
      ${className}
    `}>
      {label}
    </span>
  );
}
