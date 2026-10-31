import React from 'react';

export const Card = ({
  children,
  className = '',
  title = null,
  subtitle = null,
  action = null,
  headerClassName = '',
  bodyClassName = '',
  footer = null,
  footerClassName = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-brand-border shadow-xs transition-all duration-150 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={`px-5 py-4 border-b border-brand-border flex items-center justify-between ${headerClassName}`}>
          <div>
            {title && <h3 className="font-semibold text-brand-text-primary text-sm sm:text-base tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-brand-text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-5 py-3.5 bg-brand-bg-secondary/70 border-t border-brand-border rounded-b-xl flex items-center justify-end ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
