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
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-200 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between ${headerClassName}`}>
          <div>
            {title && <h3 className="font-semibold text-slate-800 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 rounded-b-xl flex items-center justify-end ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
