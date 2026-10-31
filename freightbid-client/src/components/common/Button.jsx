import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon = null,
  style = {},
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[34px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[46px]'
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          style: {
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF'
          },
          className: 'shadow-xs hover:brightness-90 active:brightness-75 focus:ring-[var(--color-primary-border)]'
        };
      case 'secondary':
        return {
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          },
          className: 'border shadow-2xs hover:bg-slate-50/80 active:bg-slate-100 focus:ring-slate-300'
        };
      case 'outline':
        return {
          style: {
            borderColor: 'var(--color-primary)',
            color: 'var(--color-primary)'
          },
          className: 'border bg-transparent hover:bg-slate-50 active:bg-slate-100 focus:ring-[var(--color-primary-border)]'
        };
      case 'danger':
        return {
          style: {},
          className: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-200 shadow-xs'
        };
      case 'success':
        return {
          style: {
            backgroundColor: 'var(--color-success, #16A36A)',
            color: '#FFFFFF'
          },
          className: 'hover:brightness-90 active:brightness-75 shadow-xs'
        };
      case 'ghost':
        return {
          style: {
            color: 'var(--color-text-secondary)'
          },
          className: 'hover:bg-slate-100/70 hover:text-slate-900 active:bg-slate-200/70'
        };
      default:
        return {
          style: {
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF'
          },
          className: 'shadow-xs hover:brightness-90'
        };
    }
  };

  const variantConfig = getVariantStyles();

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ ...variantConfig.style, ...style }}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantConfig.className} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
