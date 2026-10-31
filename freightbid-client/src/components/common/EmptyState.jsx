import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no records matching your current filter criteria.',
  actionText = null,
  onAction = null
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-white border border-dashed border-brand-border">
      <div className="p-3.5 bg-brand-bg-secondary rounded-full text-brand-text-muted mb-3 border border-brand-border/60">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-brand-text-primary tracking-tight">{title}</h3>
      <p className="text-xs text-brand-text-secondary max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
