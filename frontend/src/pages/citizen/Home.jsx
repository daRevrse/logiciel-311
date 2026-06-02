import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, MapPin, ThumbsUp, Activity } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { StatusBadge, Spinner, HeroBackground, ImageWithFallback } from '../../components/common';
import { IMAGES } from '../../config/images';
import { formatShortDate, reportDate } from '../../utils/date';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolus' },
];

const PAGE_SIZE = 10;

/**
 * Accueil citoyen — flux unique de tous les signalements de la commune.
 * Fusion de l'ancien Home et de ReportsList : simple, mobile-first,
 * avec recherche, filtre de statut et chargement progressif.
 */
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reports, loading, pagination, loadReports } = useReports({}, false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Recharge le flux quand un critère change (avec anti-rebond sur la recherche)
  useEffect(() => {
    const t = setTimeout(() => {
      loadReports({
        search: search.trim() || undefined,
        status: status || undefined,
        sortBy: 'created_at',
        sortOrder: 'DESC',
        page: 1,
        limit,
      });
    }, search ? 400 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, limit]);

  const total = pagination?.total ?? pagination?.totalReports ?? reports.length;
  const canLoadMore = !loading && reports.length < total;

  return (
    <div className="min-h-screen bg-surface">
      {/* En-tête : salutation + action principale */}
      <div className="relative overflow-hidden bg-navy-deep text-white">
        <HeroBackground image={IMAGES.heroCity} opacity={0.25} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-16">
          <p className="text-turquoise font-semibold text-sm">
            {user?.municipality?.name || 'Votre commune'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Bonjour, {user?.full_name?.split(' ')[0] || 'Citoyen'}
          </h1>

          <Link
            to="/reports/create"
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-turquoise text-navy-deep font-bold rounded-2xl shadow-lg shadow-turquoise/20 active:scale-[0.98] transition-transform"
          >
            <Plus className="h-5 w-5" />
            Nouveau signalement
          </Link>
        </div>
      </div>

      {/* Flux des signalements */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-24">
        {/* Recherche */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setLimit(PAGE_SIZE); }}
            placeholder="Rechercher un signalement..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Filtres de statut */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setLimit(PAGE_SIZE); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                status === f.value
                  ? 'bg-navy-deep text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-turquoise'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Chargement…</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <ImageWithFallback
              src={IMAGES.emptyReports}
              alt=""
              className="w-36 h-36 rounded-3xl mx-auto mb-5 shadow-lg"
            >
              <Activity className="h-10 w-10 text-white/70" />
            </ImageWithFallback>
            <p className="text-navy-deep font-bold">Aucun signalement</p>
            <p className="text-gray-500 text-sm mt-1">
              {search || status ? 'Aucun résultat pour ces critères.' : 'Soyez le premier à signaler un problème.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform relative overflow-hidden"
                >
                  {/* Liseré de statut */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      report.status === 'resolved'
                        ? 'bg-emerald-500'
                        : report.status === 'completed'
                        ? 'bg-cyan-500'
                        : report.status === 'in_progress'
                        ? 'bg-amber-500'
                        : report.status === 'assigned'
                        ? 'bg-blue-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-turquoise bg-turquoise/10 px-2 py-0.5 rounded">
                          {report.category?.name || 'Général'}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">
                          {formatShortDate(reportDate(report))}
                        </span>
                      </div>
                      <h3 className="font-bold text-navy-deep leading-snug truncate">{report.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs truncate">{report.address}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={report.status} />
                      <div className="flex items-center gap-1 text-gray-500">
                        <ThumbsUp className="h-3.5 w-3.5 text-turquoise" />
                        <span className="text-sm font-bold text-navy-deep">
                          {report.supportsCount ?? report.supports_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {canLoadMore && (
              <button
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                className="mt-5 w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-navy-deep font-bold text-sm hover:border-turquoise transition-colors"
              >
                Voir plus de signalements
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
