import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
  Building2, MapPin, Phone, Mail, Clock, AlertCircle, CheckCircle2,
  Loader2, ArrowRight, Tag, Inbox, Activity, TrendingUp, Search,
} from 'lucide-react';
import useMunicipalityTheme from '../../hooks/useMunicipalityTheme';
import publicMunicipalityService from '../../services/publicMunicipalityService';
import { resolveImageUrl } from '../../utils/url';
import TrackReportWidget from '../../components/public/TrackReportWidget';

const DAYS = [
  ['monday', 'Lundi'], ['tuesday', 'Mardi'], ['wednesday', 'Mercredi'],
  ['thursday', 'Jeudi'], ['friday', 'Vendredi'], ['saturday', 'Samedi'], ['sunday', 'Dimanche'],
];

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
};

const renderCategoryIcon = (icon, cls = 'w-4 h-4') => {
  if (!icon) return null;
  const pascal = icon.split(/[-_\s]+/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const Ico = LucideIcons[pascal] || LucideIcons[icon];
  return Ico ? <Ico className={cls} /> : null;
};

const HoursLine = ({ label, value }) => {
  if (!value) return (
    <div className="flex justify-between text-sm py-2"><span className="text-gray-500">{label}</span><span className="text-gray-300">—</span></div>
  );
  if (value.closed) {
    return <div className="flex justify-between text-sm py-2"><span className="text-gray-600">{label}</span><span className="text-gray-400">Fermé</span></div>;
  }
  const open = value.open || value.from;
  const close = value.close || value.to;
  if (!open || !close) return null;
  return (
    <div className="flex justify-between text-sm py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{open} – {close}</span>
    </div>
  );
};

const MunicipalityPublicPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useMunicipalityTheme({ primary: data?.primary_color || null, secondary: data?.secondary_color || null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setNotFound(false); setError(null);
    publicMunicipalityService.getMunicipalityPublicPage(slug)
      .then((res) => { if (!cancelled) setData(res?.data || res); })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) setNotFound(true);
        else setError('Erreur lors du chargement de la mairie.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-10 h-10 animate-spin text-turquoise" /></div>;
  }
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8" /></div>
        <h1 className="text-2xl font-bold text-navy-deep mb-2">Mairie introuvable</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">Aucune municipalité ne correspond à « {slug} ».</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy-deep text-white font-medium hover:bg-navy-deep/90 transition-colors">Retour à l'accueil <ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
        <p className="text-red-600 mb-4">{error || 'Erreur inconnue'}</p>
        <Link to="/" className="text-turquoise-dark underline">Retour à l'accueil</Link>
      </div>
    );
  }

  const displayName = data.display_name || data.name;
  const hours = data.public_hours || {};
  const categories = data.categories || [];
  const stats = data.stats || {};
  const realisations = data.recent_resolved || [];
  const hasContact = data.address || data.contact_phone || data.contact_email;

  const statCards = [
    { label: 'Signalements reçus', value: stats.total_reports ?? 0, icon: Inbox },
    { label: 'Résolus', value: stats.total_resolved ?? 0, icon: CheckCircle2 },
    { label: 'En cours', value: stats.total_in_progress ?? 0, icon: Activity },
    { label: 'Taux de résolution', value: `${stats.resolution_rate ?? 0}%`, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden text-white" style={{ backgroundColor: 'var(--primary, #1E3A5F)' }}>
        {data.banner_url && (
          <img src={resolveImageUrl(data.banner_url)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--primary, #1E3A5F) 0%, rgba(0,0,0,0.25) 100%)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1.5 flex-shrink-0 shadow-lg">
                {data.logo_url ? (
                  <img src={resolveImageUrl(data.logo_url)} alt={displayName} className="w-full h-full object-contain" />
                ) : (
                  <img src="/logo_muno.png" alt="Muno" className="w-full h-full object-contain" />
                )}
              </div>
              <span className="font-bold truncate">{displayName}</span>
            </div>
            <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition-colors">
              Propulsé par Muno
            </Link>
          </div>

          {/* Hero content */}
          <div className="py-12 sm:py-16 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider mb-4">
              <Building2 className="w-3.5 h-3.5" /> Municipalité
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1]">{displayName}</h1>
            {data.public_description && (
              <p className="mt-4 text-white/80 text-base sm:text-lg leading-relaxed line-clamp-3">{data.public_description}</p>
            )}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to={`/?municipality=${encodeURIComponent(data.slug)}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg transition-transform active:scale-[0.98]"
                style={{ backgroundColor: 'var(--secondary, #2BB673)', color: '#fff' }}
              >
                Signaler un problème <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#suivi" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white/15 hover:bg-white/25 transition-colors">
                <Search className="w-4 h-4" /> Suivre un signalement
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== CHIFFRES CLÉS (chevauche le héros) ===== */}
        <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl shadow-card p-4 sm:p-5 border border-gray-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'color-mix(in srgb, var(--primary, #1E3A5F) 12%, white)', color: 'var(--primary, #1E3A5F)' }}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-navy-deep leading-none">{s.value}</p>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">
          {/* ===== RÉALISATIONS ===== */}
          {realisations.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-2xl font-black text-navy-deep tracking-tight">Nos réalisations</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">Les derniers problèmes résolus par nos services.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {realisations.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      {r.category ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ backgroundColor: `${r.category.color || '#64748b'}1a`, color: r.category.color || '#475569' }}>
                          {renderCategoryIcon(r.category.icon, 'w-3 h-3')}
                          {r.category.name}
                        </span>
                      ) : <span />}
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Résolu
                      </span>
                    </div>
                    <h3 className="font-bold text-navy-deep leading-snug line-clamp-2">{r.title}</h3>
                    {r.address && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{r.address}</span></p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-50">Résolu le {formatDate(r.resolved_at || r.created_at)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ===== DOMAINES ===== */}
          {categories.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <h2 className="text-2xl font-black text-navy-deep tracking-tight">Domaines d'intervention</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">Ce que vous pouvez signaler à votre municipalité.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/?municipality=${encodeURIComponent(data.slug)}`}
                    className="group bg-white rounded-2xl shadow-card border border-gray-100 p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color || '#64748b'}1a`, color: cat.color || '#475569' }}>
                      {renderCategoryIcon(cat.icon, 'w-5 h-5') || <Tag className="w-5 h-5" />}
                    </div>
                    <span className="font-semibold text-navy-deep text-sm leading-tight">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ===== SUIVI ===== */}
          <section id="suivi" className="scroll-mt-6">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <h2 className="text-2xl font-black text-navy-deep tracking-tight">Suivre un signalement</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">Entrez le code de suivi reçu lors de votre signalement.</p>
            <TrackReportWidget />
          </section>

          {/* ===== INFOS PRATIQUES ===== */}
          {(hasContact || Object.keys(hours).length > 0) && (
            <section>
              <h2 className="text-2xl font-black text-navy-deep tracking-tight mb-6">Informations pratiques</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                  <h3 className="font-bold text-navy-deep mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" style={{ color: 'var(--primary)' }} /> Coordonnées</h3>
                  <ul className="space-y-3 text-sm">
                    {data.address && <li className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" /><span className="text-gray-700">{data.address}</span></li>}
                    {data.contact_phone && <li className="flex items-start gap-3"><Phone className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" /><a href={`tel:${data.contact_phone}`} className="hover:underline font-medium" style={{ color: 'var(--primary)' }}>{data.contact_phone}</a></li>}
                    {data.contact_email && <li className="flex items-start gap-3"><Mail className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" /><a href={`mailto:${data.contact_email}`} className="hover:underline break-all font-medium" style={{ color: 'var(--primary)' }}>{data.contact_email}</a></li>}
                    {!hasContact && <li className="text-gray-400">Non renseigné</li>}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                  <h3 className="font-bold text-navy-deep mb-4 flex items-center gap-2"><Clock className="w-5 h-5" style={{ color: 'var(--primary)' }} /> Horaires d'ouverture</h3>
                  <div className="divide-y divide-gray-100">
                    {DAYS.map(([key, label]) => <HoursLine key={key} label={label} value={hours[key]} />)}
                    {Object.keys(hours).length === 0 && <p className="text-gray-400 text-sm py-2">Non renseigné</p>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ===== CTA FINAL ===== */}
          <section className="rounded-3xl p-8 sm:p-10 text-white text-center" style={{ backgroundColor: 'var(--primary, #1E3A5F)' }}>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Un problème dans votre quartier ?</h2>
            <p className="text-white/80 mt-2 max-w-lg mx-auto">Signalez-le en quelques secondes. Chaque signalement aide à améliorer votre ville.</p>
            <Link
              to={`/?municipality=${encodeURIComponent(data.slug)}`}
              className="mt-6 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold shadow-lg transition-transform active:scale-[0.98]"
              style={{ backgroundColor: 'var(--secondary, #2BB673)', color: '#fff' }}
            >
              Faire un signalement <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-100 bg-white">
        <p>© 2026 {displayName} — Propulsé par <span className="font-bold text-navy-deep">Muno</span></p>
      </footer>
    </div>
  );
};

export default MunicipalityPublicPage;
