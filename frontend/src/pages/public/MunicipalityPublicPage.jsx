import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ThumbsUp,
  Tag,
} from 'lucide-react';
import useMunicipalityTheme from '../../hooks/useMunicipalityTheme';
import publicMunicipalityService from '../../services/publicMunicipalityService';
import { resolveImageUrl } from '../../utils/url';

const DAYS = [
  ['monday', 'Lundi'],
  ['tuesday', 'Mardi'],
  ['wednesday', 'Mercredi'],
  ['thursday', 'Jeudi'],
  ['friday', 'Vendredi'],
  ['saturday', 'Samedi'],
  ['sunday', 'Dimanche'],
];

const STATUS_LABELS = {
  new: { label: 'Nouveau', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmed: { label: 'Confirmé', cls: 'bg-primary-50 text-primary-800 border-primary-300' },
  in_progress: { label: 'En cours', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: 'Résolu', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejeté', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const renderCategoryIcon = (icon) => {
  if (!icon) return null;
  // Essai lucide (PascalCase)
  const pascal = icon
    .split(/[-_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const Ico = LucideIcons[pascal] || LucideIcons[icon];
  if (Ico) return <Ico className="w-4 h-4" />;
  return null;
};

const HoursLine = ({ label, value }) => {
  if (!value) return null;
  if (value.closed) {
    return (
      <div className="flex justify-between text-sm py-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400">Fermé</span>
      </div>
    );
  }
  const open = value.open || value.from;
  const close = value.close || value.to;
  if (!open || !close) return null;
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">
        {open} – {close}
      </span>
    </div>
  );
};

const MunicipalityPublicPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  const primary = data?.primary_color || null;
  const secondary = data?.secondary_color || null;
  useMunicipalityTheme({ primary, secondary });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);
    publicMunicipalityService
      .getMunicipalityPublicPage(slug)
      .then((res) => {
        if (cancelled) return;
        setData(res?.data || res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('Erreur lors du chargement de la mairie.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mairie introuvable</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Nous n'avons pas trouvé de municipalité correspondant à « {slug} ».
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          Retour à l'accueil
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
        <p className="text-red-600 mb-4">{error || 'Erreur inconnue'}</p>
        <Link to="/" className="text-primary-600 underline">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const displayName = data.display_name || data.name;
  const hours = data.public_hours || {};
  const categories = data.categories || [];
  const stats = data.stats || { total_resolved: 0, total_in_progress: 0 };
  const recent = data.recent_reports || [];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header coloré */}
      <header
        className="text-white"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center p-1.5 flex-shrink-0">
              {data.logo_url ? (
                <img src={resolveImageUrl(data.logo_url)} alt={displayName} className="w-full h-full object-contain" />
              ) : (
                <img src="/icone.png" alt="Muno" className="w-full h-full object-contain" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/70">Municipalité</p>
              <h1 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h1>
            </div>
          </div>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
          >
            Muno
          </Link>
        </div>
      </header>

      {/* Bannière */}
      {data.banner_url && (
        <section className="w-full">
          <div className="aspect-[16/9] md:aspect-[3/1] w-full overflow-hidden">
            <img src={resolveImageUrl(data.banner_url)} alt="" className="w-full h-full object-cover" />
          </div>
        </section>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* CTA principal */}
        <div
          className="rounded-card shadow-card p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--secondary, #2BB673)' }}
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">Un problème à signaler&nbsp;?</h2>
            <p className="text-white/90 text-sm">
              Signalez en quelques secondes, anonymement ou avec un compte.
            </p>
          </div>
          <Link
            to={`/?municipality=${encodeURIComponent(data.slug)}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-white/90 transition-colors"
          >
            Signaler un problème
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Description */}
        {data.public_description && (
          <section className="bg-white rounded-card shadow-card p-6">
            <h3 className="font-bold text-gray-900 mb-3">À propos</h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {data.public_description}
            </p>
          </section>
        )}

        {/* Coordonnées + Horaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-card shadow-card p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Coordonnées
            </h3>
            <ul className="space-y-3 text-sm">
              {data.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{data.address}</span>
                </li>
              )}
              {data.contact_phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${data.contact_phone}`} className="text-primary-700 hover:underline">
                    {data.contact_phone}
                  </a>
                </li>
              )}
              {data.contact_email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${data.contact_email}`} className="text-primary-700 hover:underline break-all">
                    {data.contact_email}
                  </a>
                </li>
              )}
              {!data.address && !data.contact_phone && !data.contact_email && (
                <li className="text-gray-400 text-sm">Non renseigné</li>
              )}
            </ul>
          </section>

          <section className="bg-white rounded-card shadow-card p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Horaires
            </h3>
            <div className="divide-y divide-gray-100">
              {DAYS.map(([key, label]) => (
                <HoursLine key={key} label={label} value={hours[key]} />
              ))}
              {Object.keys(hours).length === 0 && (
                <p className="text-gray-400 text-sm">Non renseigné</p>
              )}
            </div>
          </section>
        </div>

        {/* Catégories */}
        {categories.length > 0 && (
          <section className="bg-white rounded-card shadow-card p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Catégories de signalement
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/?categorie=${cat.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-800"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color || 'var(--primary)' }}
                  />
                  {renderCategoryIcon(cat.icon)}
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Résolus</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_resolved ?? 0}</p>
          </div>
          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">En cours</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_in_progress ?? 0}</p>
          </div>
        </section>

        {/* Signalements récents */}
        {recent.length > 0 && (
          <section>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Signalements récents
            </h3>
            <ul className="space-y-3">
              {recent.slice(0, 5).map((r) => {
                const status = STATUS_LABELS[r.status] || { label: r.status, cls: 'bg-gray-50 text-gray-700 border-gray-200' };
                return (
                  <li key={r.id}>
                    <Link
                      to={`/reports/${r.id}`}
                      className="block bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                        {r.is_priority && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex-shrink-0">
                            Prioritaire
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`inline-flex items-center font-medium rounded-full border px-2 py-0.5 ${status.cls}`}>
                          {status.label}
                        </span>
                        {r.category && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                            <Tag className="w-3 h-3" />
                            {r.category}
                          </span>
                        )}
                        <span className="text-gray-500">{formatDate(r.created_at)}</span>
                        {typeof r.supports_count === 'number' && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <ThumbsUp className="w-3 h-3" />
                            {r.supports_count}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>

      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-100 bg-white">
        <p>© 2026 {displayName} — Propulsé par Muno</p>
      </footer>
    </div>
  );
};

export default MunicipalityPublicPage;
