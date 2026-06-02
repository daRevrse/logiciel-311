import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Bell, ThumbsUp } from 'lucide-react';
import HeroBackground from './HeroBackground';
import { IMAGES } from '../../config/images';

const DEFAULT_BULLETS = [
  { icon: MapPin, label: 'Localisation précise' },
  { icon: Bell, label: 'Suivi en temps réel' },
  { icon: ThumbsUp, label: 'Appui citoyen' },
];

/**
 * Coquille d'authentification : panneau éditorial navy (gauche) + zone formulaire (droite).
 * Partagée par Login et Register pour une DA cohérente.
 */
const AuthShell = ({
  headline = (
    <>Ma ville à <span className="text-turquoise italic">portée de main.</span></>
  ),
  subtitle = 'Signalez un problème, suivez son traitement, et appuyez les signalements qui comptent pour vous.',
  bullets = DEFAULT_BULLETS,
  image = IMAGES.heroCivic,
  children,
}) => (
  <div className="min-h-screen flex flex-col lg:flex-row bg-white">
    {/* Panneau éditorial */}
    <div className="relative lg:w-[44%] bg-navy-deep text-white p-8 lg:p-14 flex flex-col justify-between overflow-hidden min-h-[38vh] lg:min-h-screen">
      <HeroBackground image={image} opacity={0.38} />

      <div className="relative z-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg shadow-turquoise/20 group-hover:scale-105 transition-transform">
            <img src="/logo_muno.png" alt="Muno" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-none tracking-tight">Muno</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-turquoise font-bold mt-1">Signalement citoyen</span>
          </div>
        </Link>
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-2 text-white/70 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      <div className="relative z-10 my-10 lg:my-0">
        <h2 className="text-3xl lg:text-5xl font-black leading-[1.05] tracking-tight max-w-md">
          {headline}
        </h2>
        <p className="text-white/70 max-w-md leading-relaxed mt-5 text-base lg:text-lg">
          {subtitle}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap gap-x-6 gap-y-3">
        {bullets.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-white/80">
            <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-turquoise" />
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>

    {/* Zone formulaire */}
    <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-[#F8FAFC]">
      <div className="w-full max-w-md">{children}</div>
    </div>
  </div>
);

export default AuthShell;
