import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle = null,
  icon: Icon = null,
  color = 'primary', // primary, emerald, amber, blue, rose
  trend = null
}) => {
  const getIconContainerStyle = () => {
    switch (color) {
      case 'primary':
        return {
          style: {
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            borderColor: 'var(--color-primary-border)'
          },
          className: 'border'
        };
      case 'emerald':
        return {
          style: {},
          className: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        };
      case 'amber':
        return {
          style: {},
          className: 'bg-amber-50 text-amber-700 border border-amber-200'
        };
      case 'blue':
        return {
          style: {},
          className: 'bg-blue-50 text-blue-700 border border-blue-200'
        };
      case 'rose':
        return {
          style: {},
          className: 'bg-rose-50 text-rose-700 border border-rose-200'
        };
      case 'indigo':
      default:
        return {
          style: {
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            borderColor: 'var(--color-primary-border)'
          },
          className: 'border'
        };
    }
  };

  const iconStyle = getIconContainerStyle();

  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 shadow-xs hover:border-slate-300 transition-all duration-150">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">{title}</p>
          <h3 className="text-2xl font-bold text-brand-text-primary mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-brand-text-secondary mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div
            style={iconStyle.style}
            className={`p-3 rounded-xl ${iconStyle.className} shrink-0`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-brand-border flex items-center gap-1.5 text-xs text-brand-text-secondary">
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
