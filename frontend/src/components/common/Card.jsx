import React from 'react';

/**
 * Composant Card réutilisable
 */
const Card = ({
  children,
  title,
  subtitle,
  footer,
  noPadding = false,
  className = '',
  onClick,
  hoverable = false
}) => {
  const hoverClass = hoverable ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';
  const paddingClass = noPadding ? '' : 'p-6';

  return (
    <div
      className={`card ${paddingClass} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className={`${!noPadding ? 'mb-4' : 'p-6 pb-4'}`}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}

      <div className={noPadding ? 'px-6' : ''}>{children}</div>

      {footer && (
        <div className={`${!noPadding ? 'mt-4 pt-4' : 'p-6 pt-4'} border-t border-gray-200`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
