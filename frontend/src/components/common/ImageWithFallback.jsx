import React, { useState } from 'react';

/**
 * <img> robuste : si la source échoue, on masque l'image et on affiche
 * un fallback (children, sinon un aplat dégradé navy/turquoise).
 * Utilisé pour les vignettes (catégories, municipalités, empty states).
 */
const ImageWithFallback = ({ src, alt = '', className = '', imgClassName = '', children, ...rest }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`bg-gradient-to-br from-navy-deep to-turquoise/40 flex items-center justify-center ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover ${imgClassName}`}
        {...rest}
      />
    </div>
  );
};

export default ImageWithFallback;
