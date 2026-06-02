import React, { useState } from 'react';

/**
 * Fond photo pour les grandes entêtes navy.
 *
 * À placer en premier enfant d'un conteneur `relative overflow-hidden bg-navy-deep`.
 * La photo est posée SOUS un dégradé navy : si l'image ne charge pas, on retombe
 * exactement sur le rendu navy d'origine (aucune image cassée).
 *
 * Le contenu de l'entête doit rester en `relative z-10`.
 */
const HeroBackground = ({ image, opacity = 0.35, overlay = 'from-navy-deep/80 via-navy-deep/90 to-navy-deep' }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Préchargement : on n'affiche le fond qu'une fois l'image valide */}
      {image && (
        <img src={image} alt="" className="hidden" onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
      )}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: loaded ? `url(${image})` : 'none', opacity: loaded ? opacity : 0 }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${overlay}`} />
    </div>
  );
};

export default HeroBackground;
