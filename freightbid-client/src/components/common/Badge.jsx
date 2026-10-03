import React from 'react';
import { getStatusBadgeStyle } from '../../utils/formatters';

export const Badge = ({
  status,
  label = null,
  size = 'md',
  showDot = true,
  className = ''
}) => {
  const style = getStatusBadgeStyle(status);
  const displayLabel = label || style.label;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ring-1 ring-inset ${style.bg} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};

export default Badge;
